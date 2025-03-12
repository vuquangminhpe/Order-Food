import { Server as HttpServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyAccessToken } from './jwt'
import databaseService from '../services/database.services'
import { OrderStatus } from '../models/schemas/Order.schema'
import { ObjectId } from 'mongodb'

interface LocationUpdate {
  orderId: string
  lat: number
  lng: number
}

let io: Server

const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token
      if (!token) {
        return next(new Error('Authentication error: Token missing'))
      }

      const decoded = await verifyAccessToken(token)
      if (!decoded) {
        return next(new Error('Authentication error: Invalid token'))
      }

      socket.data.userId = decoded.user_id
      socket.data.userRole = decoded.role
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}, userId: ${socket.data.userId}`)

    if (socket.data.userRole === 2) {
      socket.join(`delivery:${socket.data.userId}`)
    } else {
      socket.join(`user:${socket.data.userId}`)
    }

    socket.on('location:update', async (data: LocationUpdate) => {
      try {
        const { orderId, lat, lng } = data
        const order = await databaseService.orders.findOne({
          _id: new ObjectId(orderId),
          deliveryPersonId: new ObjectId(socket.data.userId),
          orderStatus: { $in: [OrderStatus.OutForDelivery, OrderStatus.ReadyForPickup] }
        })

        if (!order) {
          return socket.emit('error', { message: 'Order not found or not assigned to you' })
        }

        const timestamp = new Date()
        await databaseService.deliveryTracking.updateOne(
          { orderId: new ObjectId(orderId) },
          {
            $set: {
              currentLocation: { lat, lng, timestamp },
              updated_at: timestamp
            },
            $push: {
              locationHistory: { lat, lng, timestamp }
            }
          },
          { upsert: true }
        )

        io.to(`user:${order.userId.toString()}`).emit('location:updated', {
          orderId,
          location: { lat, lng },
          timestamp
        })

        io.to(`restaurant:${order.restaurantId.toString()}`).emit('location:updated', {
          orderId,
          location: { lat, lng },
          timestamp
        })
      } catch (error) {
        console.error('Error updating location:', error)
        socket.emit('error', { message: 'Failed to update location' })
      }
    })

    socket.on('order:status', async (data: { orderId: string; status: OrderStatus; reason?: string }) => {
      try {
        const { orderId, status, reason } = data

        const result = await databaseService.orders.updateOne(
          { _id: new ObjectId(orderId) },
          {
            $set: {
              orderStatus: status,
              ...(reason && { rejectionReason: reason }),
              updated_at: new Date()
            }
          }
        )

        if (result.modifiedCount === 0) {
          return socket.emit('error', { message: 'Failed to update order status' })
        }

        const order = await databaseService.orders.findOne({ _id: new ObjectId(orderId) })

        if (!order) {
          return socket.emit('error', { message: 'Order not found' })
        }

        io.to(`user:${order.userId.toString()}`).emit('order:status_updated', {
          orderId,
          status,
          reason
        })

        io.to(`restaurant:${order.restaurantId.toString()}`).emit('order:status_updated', {
          orderId,
          status,
          reason
        })

        if (order.deliveryPersonId) {
          io.to(`delivery:${order.deliveryPersonId.toString()}`).emit('order:status_updated', {
            orderId,
            status,
            reason
          })
        }
      } catch (error) {
        console.error('Error updating order status:', error)
        socket.emit('error', { message: 'Failed to update order status' })
      }
    })

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`)
    })
  })

  return io
}

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized')
  }
  return io
}

export default initSocket
