import { ObjectId } from 'mongodb'
import { InsertOneResult, UpdateResult } from 'mongodb'
import Order, { OrderStatus, PaymentStatus } from '../models/schemas/Order.schema'
import DeliveryTracking from '../models/schemas/DeliveryTracking.schema'
import databaseService from './database.services'
import menuService from './menu.services'
import { getIO } from '../utils/socket'

class OrderService {
  // Create a new order
  async createOrder(orderData: any): Promise<InsertOneResult<Order>> {
    const order = new Order(orderData)

    const result = await databaseService.orders.insertOne(order)

    // Update popularity for ordered menu items
    for (const item of orderData.items) {
      await menuService.updateMenuItemPopularity(item.menuItemId.toString(), item.quantity)
    }

    return result
  }

  // Get order by ID
  async getOrderById(id: string) {
    return databaseService.orders.findOne({ _id: new ObjectId(id) })
  }

  // Get all orders for a user
  async getUserOrders(
    userId: string,
    {
      page = 1,
      limit = 10,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    }: {
      page: number
      limit: number
      status?: OrderStatus
      sortBy: string
      sortOrder: 'asc' | 'desc'
    }
  ) {
    const query: any = { userId: new ObjectId(userId) }

    // Filter by status
    if (status !== undefined) {
      query.orderStatus = status
    }

    // Count total matching orders
    const total = await databaseService.orders.countDocuments(query)

    // Get paginated orders
    const skip = (page - 1) * limit

    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const orders = await databaseService.orders.find(query).sort(sort).skip(skip).limit(limit).toArray()

    // Get restaurant details for each order
    const ordersWithRestaurants = await Promise.all(
      orders.map(async (order) => {
        const restaurant = await databaseService.restaurants.findOne(
          { _id: order.restaurantId },
          { projection: { name: 1, address: 1, logoImage: 1 } }
        )

        return {
          ...order,
          restaurant: restaurant || { name: 'Unknown Restaurant' }
        }
      })
    )

    return {
      orders: ordersWithRestaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Update order status
  async updateOrderStatus(id: string, status: OrderStatus, reason?: string): Promise<UpdateResult> {
    const updateObj: any = {
      orderStatus: status,
      updated_at: new Date()
    }

    if (reason) {
      updateObj.rejectionReason = reason
    }

    // Special handling for specific statuses
    if (status === OrderStatus.OutForDelivery) {
      updateObj.estimatedDeliveryTime = await this.calculateEstimatedDeliveryTime(id)
    } else if (status === OrderStatus.Delivered) {
      updateObj.actualDeliveryTime = new Date()
    }

    const result = await databaseService.orders.updateOne({ _id: new ObjectId(id) }, { $set: updateObj })

    // If order is delivered, update delivery tracking
    if (status === OrderStatus.Delivered) {
      await databaseService.deliveryTracking.updateOne(
        { orderId: new ObjectId(id) },
        {
          $set: {
            status: 'delivered',
            updated_at: new Date()
          }
        }
      )
    }

    return result
  }

  // Update payment status
  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, paymentId?: string): Promise<UpdateResult> {
    const updateObj: any = {
      paymentStatus,
      updated_at: new Date()
    }

    if (paymentId) {
      updateObj.paymentId = paymentId
    }

    return databaseService.orders.updateOne({ _id: new ObjectId(id) }, { $set: updateObj })
  }

  // Assign delivery person to order
  async assignDeliveryPerson(orderId: string, deliveryPersonId: string): Promise<boolean> {
    // Get the order
    const order = await this.getOrderById(orderId)

    if (!order) {
      return false
    }

    // Update order with delivery person
    const orderResult = await databaseService.orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          deliveryPersonId: new ObjectId(deliveryPersonId),
          updated_at: new Date()
        }
      }
    )

    if (orderResult.modifiedCount === 0) {
      return false
    }

    // Create or update delivery tracking
    const tracking = await databaseService.deliveryTracking.findOne({
      orderId: new ObjectId(orderId)
    })

    if (tracking) {
      await databaseService.deliveryTracking.updateOne(
        { _id: tracking._id },
        {
          $set: {
            deliveryPersonId: new ObjectId(deliveryPersonId),
            status: 'assigned',
            updated_at: new Date()
          }
        }
      )
    } else {
      // Create new tracking entry
      const newTracking = new DeliveryTracking({
        orderId: new ObjectId(orderId),
        deliveryPersonId: new ObjectId(deliveryPersonId),
        status: 'assigned',
        locationHistory: []
      })

      await databaseService.deliveryTracking.insertOne(newTracking)
    }

    // Get restaurant and delivery address for notification
    const restaurant = await databaseService.restaurants.findOne(
      { _id: order.restaurantId },
      { projection: { location: 1, name: 1 } }
    )

    // Notify delivery person via socket
    const io = getIO()
    io.to(`delivery:${deliveryPersonId}`).emit('order:assigned', {
      orderId,
      restaurantId: order.restaurantId.toString(),
      restaurantName: restaurant?.name || 'Restaurant',
      restaurantLocation: restaurant?.location,
      deliveryAddress: order.deliveryAddress
    })

    return true
  }

  // Update delivery location
  async updateDeliveryLocation(orderId: string, lat: number, lng: number): Promise<boolean> {
    const timestamp = new Date()

    // Update delivery tracking
    const result = await databaseService.deliveryTracking.updateOne(
      { orderId: new ObjectId(orderId) },
      {
        $set: {
          currentLocation: { lat, lng, timestamp },
          updated_at: timestamp
        },
        $push: {
          locationHistory: { lat, lng, timestamp }
        }
      }
    )

    if (result.modifiedCount === 0) {
      return false
    }

    // Get order to notify relevant parties
    const order = await this.getOrderById(orderId)

    if (!order) {
      return false
    }

    // Get estimated time remaining
    const estimatedArrival = await this.calculateEstimatedArrival(
      orderId,
      lat,
      lng,
      order.deliveryAddress.lat,
      order.deliveryAddress.lng
    )

    // Update estimated arrival time
    await databaseService.deliveryTracking.updateOne(
      { orderId: new ObjectId(orderId) },
      {
        $set: {
          estimatedArrival,
          updated_at: new Date()
        }
      }
    )

    // Emit location update to relevant parties via socket
    const io = getIO()

    // Emit to customer
    io.to(`user:${order.userId.toString()}`).emit('location:updated', {
      orderId,
      location: { lat, lng },
      timestamp,
      estimatedArrival
    })

    // Emit to restaurant
    io.to(`restaurant:${order.restaurantId.toString()}`).emit('location:updated', {
      orderId,
      location: { lat, lng },
      timestamp,
      estimatedArrival
    })

    return true
  }

  // Get order tracking information
  async getOrderTracking(orderId: string): Promise<DeliveryTracking | null> {
    return databaseService.deliveryTracking.findOne({
      orderId: new ObjectId(orderId)
    })
  }

  async getActiveDeliveryOrders(deliveryPersonId: string) {
    const orders = await databaseService.orders
      .find({
        deliveryPersonId: new ObjectId(deliveryPersonId),
        orderStatus: { $in: [OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery] }
      })
      .sort({ created_at: 1 })
      .toArray()

    return orders
  }

  // Get delivery history for a delivery person
  async getDeliveryHistory(
    deliveryPersonId: string,
    {
      page = 1,
      limit = 10,
      startDate,
      endDate
    }: {
      page: number
      limit: number
      startDate?: Date
      endDate?: Date
    }
  ) {
    const query: any = {
      deliveryPersonId: new ObjectId(deliveryPersonId),
      orderStatus: { $in: [OrderStatus.Delivered, OrderStatus.Cancelled] }
    }

    // Add date range if provided
    if (startDate || endDate) {
      query.created_at = {}

      if (startDate) {
        query.created_at.$gte = startDate
      }

      if (endDate) {
        query.created_at.$lte = endDate
      }
    }

    // Count total matching documents
    const total = await databaseService.orders.countDocuments(query)

    // Get paginated results
    const skip = (page - 1) * limit

    const orders = await databaseService.orders.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray()

    // Get restaurant details for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const restaurant = await databaseService.restaurants.findOne(
          { _id: order.restaurantId },
          { projection: { name: 1, address: 1 } }
        )

        return {
          ...order,
          restaurant: restaurant || { name: 'Unknown Restaurant' }
        }
      })
    )

    return {
      orders: ordersWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get daily orders summary (for admin dashboard)
  async getDailyOrdersSummary(date: Date = new Date()): Promise<any> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Aggregate order data
    const orderStats = await databaseService.orders
      .aggregate([
        {
          $match: {
            created_at: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: '$orderStatus',
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        }
      ])
      .toArray()

    // Aggregate order data by hour
    const hourlyStats = await databaseService.orders
      .aggregate([
        {
          $match: {
            created_at: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          }
        },
        {
          $group: {
            _id: { $hour: '$created_at' },
            count: { $sum: 1 },
            total: { $sum: '$total' }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ])
      .toArray()

    // Format for all hours (0-23)
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const hourData = hourlyStats.find((item) => item._id === hour)
      return {
        hour,
        count: hourData ? hourData.count : 0,
        total: hourData ? hourData.total : 0
      }
    })

    // Calculate totals
    const totalOrders = orderStats.reduce((sum, item) => sum + item.count, 0)
    const totalRevenue = orderStats.reduce((sum, item) => sum + item.total, 0)

    // Map status numbers to names for readability
    const statusMap: Record<number, string> = {
      0: 'Pending',
      1: 'Confirmed',
      2: 'Preparing',
      3: 'ReadyForPickup',
      4: 'OutForDelivery',
      5: 'Delivered',
      6: 'Cancelled',
      7: 'Rejected'
    }

    const statusStats = orderStats.map((item) => ({
      status: statusMap[item._id] || `Status ${item._id}`,
      count: item.count,
      total: item.total
    }))

    return {
      date: startOfDay,
      totalOrders,
      totalRevenue,
      statusBreakdown: statusStats,
      hourlyData
    }
  }

  // Calculate estimated delivery time
  private async calculateEstimatedDeliveryTime(orderId: string): Promise<number> {
    const order = await this.getOrderById(orderId)

    if (!order) {
      return 30 // Default 30 minutes
    }

    // Get restaurant details
    const restaurant = await databaseService.restaurants.findOne({
      _id: order.restaurantId
    })

    if (!restaurant) {
      return 30
    }

    // Use restaurant's estimate if available
    if (restaurant.estimatedDeliveryTime) {
      return restaurant.estimatedDeliveryTime
    }

    // Calculate based on distance (simplified estimation)
    const distance = this.calculateDistance(
      restaurant.location.lat,
      restaurant.location.lng,
      order.deliveryAddress.lat,
      order.deliveryAddress.lng
    )

    // Rough estimate: 5 minutes per kilometer + 10 minutes base time
    const estimatedTime = Math.ceil(distance * 5 + 10)

    return estimatedTime
  }

  // Calculate estimated arrival time
  private async calculateEstimatedArrival(
    orderId: string,
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number
  ): Promise<Date> {
    // Calculate distance from current location to destination
    const remainingDistance = this.calculateDistance(currentLat, currentLng, destLat, destLng)

    // Rough estimate: 2 minutes per kilometer remaining
    const minutesRemaining = Math.ceil(remainingDistance * 2)

    const estimatedArrival = new Date()
    estimatedArrival.setMinutes(estimatedArrival.getMinutes() + minutesRemaining)

    return estimatedArrival
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS = 6371 // Earth's radius in kilometers

    const dLat = this.degToRad(lat2 - lat1)
    const dLng = this.degToRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = EARTH_RADIUS * c

    return distance
  }

  private degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

const orderService = new OrderService()

export default orderService
