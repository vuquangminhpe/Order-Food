import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'
import { ORDER_MESSAGES } from '../constants/messages'
import orderService from '../services/order.services'
import restaurantService from '../services/restaurant.services'
import databaseService from '../services/database.services'
import { OrderStatus, PaymentMethod, PaymentStatus } from '../models/schemas/Order.schema'
import { getIO } from '../utils/socket'
import DeliveryTracking from '../models/schemas/DeliveryTracking.schema'
import { OrderReqBody, UpdateOrderStatusReqBody } from '~/models/requests/auth.requests'

// Create a new order
export const createOrderController = async (req: Request<ParamsDictionary, any, OrderReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const orderData = req.body

  // Validate restaurant existence
  const restaurant = await restaurantService.getRestaurantById(orderData.restaurantId as string)
  if (!restaurant) {
    return res.status(404).json({
      message: ORDER_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  // Validate menu items and calculate prices
  let subtotal = 0
  const processedItems = []

  for (const item of orderData.items) {
    const menuItem = await databaseService.menuItems.findOne({
      _id: new ObjectId(item.menuItemId as string),
      restaurantId: new ObjectId(orderData.restaurantId as string)
    })

    if (!menuItem) {
      return res.status(404).json({
        message: ORDER_MESSAGES.MENU_ITEM_NOT_FOUND,
        item: item.menuItemId
      })
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        message: ORDER_MESSAGES.MENU_ITEM_NOT_AVAILABLE,
        item: menuItem.name
      })
    }

    // Calculate item price with options
    let itemPrice = menuItem.discountedPrice || menuItem.price
    let optionsTotal = 0

    if (item.options && item.options.length > 0) {
      for (const selectedOption of item.options) {
        const menuOption = menuItem.options.find((opt) => opt.title === selectedOption.title)

        if (!menuOption) {
          return res.status(400).json({
            message: ORDER_MESSAGES.INVALID_OPTION,
            option: selectedOption.title,
            item: menuItem.name
          })
        }

        for (const selectedItem of selectedOption.items) {
          const optionItem = menuOption.items.find((item) => item.name === selectedItem.name)

          if (!optionItem) {
            return res.status(400).json({
              message: ORDER_MESSAGES.INVALID_OPTION_ITEM,
              option: selectedOption.title,
              item: selectedItem.name
            })
          }

          optionsTotal += optionItem.price
        }
      }
    }

    const totalItemPrice = (itemPrice + optionsTotal) * item.quantity
    subtotal += totalItemPrice

    processedItems.push({
      menuItemId: new ObjectId(item.menuItemId),
      name: menuItem.name,
      price: itemPrice,
      quantity: item.quantity,
      options: item.options,
      totalPrice: totalItemPrice
    })
  }

  // Get delivery fee from restaurant
  const deliveryFee = restaurant.deliveryFee || 0

  // Calculate service charge (if applicable)
  const serviceCharge = orderData.serviceCharge || 0

  // Apply discount (if any)
  const discount = orderData.discount || 0

  // Calculate total
  const total = subtotal + deliveryFee + serviceCharge - discount

  // Check minimum order amount
  if (restaurant.minOrderAmount && subtotal < restaurant.minOrderAmount) {
    return res.status(400).json({
      message: `${ORDER_MESSAGES.MINIMUM_ORDER_NOT_MET}. Minimum order amount is ${restaurant.minOrderAmount}`
    })
  }

  // Create order with calculated values
  const orderPayload = {
    userId: new ObjectId(user_id),
    restaurantId: new ObjectId(orderData.restaurantId as string),
    items: processedItems,
    deliveryAddress: orderData.deliveryAddress,
    subtotal,
    deliveryFee,
    serviceCharge,
    discount,
    total,
    paymentMethod: orderData.paymentMethod,
    paymentStatus:
      orderData.paymentMethod === PaymentMethod.CashOnDelivery ? PaymentStatus.Pending : PaymentStatus.Pending,
    orderStatus: OrderStatus.Pending,
    notes: orderData.notes || ''
  }

  const result = await orderService.createOrder(orderPayload)

  const io = getIO()
  io.to(`restaurant:${orderData.restaurantId}`).emit('order:new', {
    orderId: result.insertedId.toString(),
    restaurantId: orderData.restaurantId,
    total
  })

  res.status(201).json({
    message: ORDER_MESSAGES.CREATE_ORDER_SUCCESS,
    result: {
      order_id: result.insertedId.toString(),
      total
    }
  })
}

// Get order by ID
export const getOrderByIdController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id, role } = req.decode_authorization as { user_id: string; role: number }

  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  if (
    order.userId.toString() !== user_id &&
    (!order.deliveryPersonId || order.deliveryPersonId.toString() !== user_id) &&
    role !== 3
  ) {
    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())
    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(403).json({
        message: ORDER_MESSAGES.UNAUTHORIZED_ACCESS
      })
    }
  }

  res.status(200).json({
    message: ORDER_MESSAGES.GET_ORDER_SUCCESS,
    result: order
  })
}

export const getAllUserOrdersController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const { page = 1, limit = 10, status, sortBy = 'created_at', sortOrder = 'desc' } = req.query

  const result = await orderService.getUserOrders(user_id, {
    page: Number(page),
    limit: Number(limit),
    status: status ? (Number(status) as OrderStatus) : undefined,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc'
  })

  res.status(200).json({
    message: ORDER_MESSAGES.GET_ORDERS_SUCCESS,
    result
  })
}

export const updateOrderStatusController = async (
  req: Request<ParamsDictionary & { id: string }, any, UpdateOrderStatusReqBody>,
  res: Response
) => {
  const { id } = req.params
  const { user_id, role } = req.decode_authorization as { user_id: string; role: number }
  const { status, reason } = req.body

  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  if (role !== 3) {
    // Not admin
    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())
    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(403).json({
        message: ORDER_MESSAGES.UNAUTHORIZED_TO_UPDATE
      })
    }
  }

  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.Pending]: [OrderStatus.Confirmed, OrderStatus.Rejected],
    [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Cancelled],
    [OrderStatus.Preparing]: [OrderStatus.ReadyForPickup, OrderStatus.Cancelled],
    [OrderStatus.ReadyForPickup]: [OrderStatus.OutForDelivery],
    [OrderStatus.OutForDelivery]: [OrderStatus.Delivered],
    [OrderStatus.Delivered]: [],
    [OrderStatus.Cancelled]: [],
    [OrderStatus.Rejected]: []
  }

  if (!validTransitions[order.orderStatus].includes(status)) {
    return res.status(400).json({
      message: ORDER_MESSAGES.INVALID_STATUS_TRANSITION,
      currentStatus: order.orderStatus,
      requestedStatus: status
    })
  }

  // Update order status
  const result = await orderService.updateOrderStatus(id, status, reason)

  // Notify customer via socket
  const io = getIO()
  io.to(`user:${order.userId.toString()}`).emit('order:status_updated', {
    orderId: id,
    status,
    reason
  })

  res.status(200).json({
    message: ORDER_MESSAGES.UPDATE_STATUS_SUCCESS,
    result
  })
}

// Cancel order (for customers)
export const cancelOrderController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const { reason } = req.body

  // Get the order
  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  // Check if user owns the order
  if (order.userId.toString() !== user_id) {
    return res.status(403).json({
      message: ORDER_MESSAGES.UNAUTHORIZED_TO_CANCEL
    })
  }

  // Check if order can be cancelled
  if (![OrderStatus.Pending, OrderStatus.Confirmed].includes(order.orderStatus)) {
    return res.status(400).json({
      message: ORDER_MESSAGES.CANNOT_CANCEL_ORDER,
      status: order.orderStatus
    })
  }

  // Update order status to cancelled
  const result = await orderService.updateOrderStatus(id, OrderStatus.Cancelled, reason)

  // Notify restaurant via socket
  const io = getIO()
  io.to(`restaurant:${order.restaurantId.toString()}`).emit('order:cancelled', {
    orderId: id,
    reason
  })

  res.status(200).json({
    message: ORDER_MESSAGES.CANCEL_ORDER_SUCCESS,
    result
  })
}

// Rate order and restaurant (for customers)
export const rateOrderController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const { rating, review, foodRating, deliveryRating } = req.body

  // Validate rating
  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      message: ORDER_MESSAGES.INVALID_RATING
    })
  }

  // Get the order
  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  // Check if user owns the order
  if (order.userId.toString() !== user_id) {
    return res.status(403).json({
      message: ORDER_MESSAGES.UNAUTHORIZED_TO_RATE
    })
  }

  // Check if order is delivered
  if (order.orderStatus !== OrderStatus.Delivered) {
    return res.status(400).json({
      message: ORDER_MESSAGES.CANNOT_RATE_UNDELIVERED
    })
  }

  // Create rating
  const ratingData = {
    orderId: new ObjectId(id),
    userId: new ObjectId(user_id),
    restaurantId: order.restaurantId,
    rating,
    review: review || '',
    foodRating: foodRating || rating,
    deliveryRating: deliveryRating || rating,
    created_at: new Date()
  }

  const result = await databaseService.ratings.insertOne(ratingData)
  const allRatings = await databaseService.ratings.find({ restaurantId: order.restaurantId }).toArray()

  const avgRating = allRatings.reduce((sum: any, r: any) => sum + r.rating, 0) / allRatings.length

  await databaseService.restaurants.updateOne(
    { _id: order.restaurantId },
    {
      $set: {
        rating: parseFloat(avgRating.toFixed(1)),
        totalRatings: allRatings.length
      }
    }
  )

  res.status(201).json({
    message: ORDER_MESSAGES.RATE_ORDER_SUCCESS,
    result: {
      rating_id: result.insertedId.toString()
    }
  })
}

// Assign delivery person to order
export const assignDeliveryPersonController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id, role } = req.decode_authorization as { user_id: string; role: number }
  const { deliveryPersonId } = req.body

  // Get the order
  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  // Check permission (restaurant owner or admin)
  if (role !== 3) {
    // Not admin
    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())
    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(403).json({
        message: ORDER_MESSAGES.UNAUTHORIZED_TO_ASSIGN
      })
    }
  }

  // Check if order status is appropriate
  if (order.orderStatus !== OrderStatus.ReadyForPickup) {
    return res.status(400).json({
      message: ORDER_MESSAGES.CANNOT_ASSIGN_DELIVERY,
      status: order.orderStatus
    })
  }

  // Check if delivery person exists and is available
  const deliveryPerson = await databaseService.users.findOne({
    _id: new ObjectId(deliveryPersonId),
    role: 2, // DeliveryPerson
    isAvailable: true
  })

  if (!deliveryPerson) {
    return res.status(404).json({
      message: ORDER_MESSAGES.DELIVERY_PERSON_NOT_AVAILABLE
    })
  }

  // Assign delivery person
  await databaseService.orders.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        deliveryPersonId: new ObjectId(deliveryPersonId),
        updated_at: new Date()
      }
    }
  )

  // Create delivery tracking
  const tracking = new DeliveryTracking({
    orderId: new ObjectId(id),
    deliveryPersonId: new ObjectId(deliveryPersonId),
    status: 'assigned',
    locationHistory: []
  })

  await databaseService.deliveryTracking.insertOne(tracking)

  // Notify delivery person via socket
  const io = getIO()
  io.to(`delivery:${deliveryPersonId}`).emit('order:assigned', {
    orderId: id,
    restaurantId: order.restaurantId.toString(),
    deliveryAddress: order.deliveryAddress
  })

  res.status(200).json({
    message: ORDER_MESSAGES.ASSIGN_DELIVERY_SUCCESS,
    result: {
      orderId: id,
      deliveryPersonId
    }
  })
}

// Get order tracking information
export const getOrderTrackingController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id, role } = req.decode_authorization as { user_id: string; role: number }

  // Get the order
  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  // Check permission
  const canAccess =
    order.userId.toString() === user_id || // Customer
    role === 3 || // Admin
    (order.deliveryPersonId && order.deliveryPersonId.toString() === user_id) // Delivery person

  if (!canAccess) {
    // Check if user is restaurant owner
    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())
    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(403).json({
        message: ORDER_MESSAGES.UNAUTHORIZED_ACCESS
      })
    }
  }

  // Check if order has a delivery person assigned
  if (!order.deliveryPersonId) {
    return res.status(400).json({
      message: ORDER_MESSAGES.NO_DELIVERY_ASSIGNED
    })
  }

  // Get tracking information
  const tracking = await databaseService.deliveryTracking.findOne({
    orderId: new ObjectId(id)
  })

  if (!tracking) {
    return res.status(404).json({
      message: ORDER_MESSAGES.TRACKING_NOT_FOUND
    })
  }

  res.status(200).json({
    message: ORDER_MESSAGES.GET_TRACKING_SUCCESS,
    result: tracking
  })
}

// Update delivery location (for delivery persons)
export const updateDeliveryLocationController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const { lat, lng } = req.body

  // Validate coordinates
  if (!lat || !lng) {
    return res.status(400).json({
      message: ORDER_MESSAGES.INVALID_COORDINATES
    })
  }

  // Get the order
  const order = await orderService.getOrderById(id)

  if (!order) {
    return res.status(404).json({
      message: ORDER_MESSAGES.ORDER_NOT_FOUND
    })
  }

  // Check if user is the assigned delivery person
  if (!order.deliveryPersonId || order.deliveryPersonId.toString() !== user_id) {
    return res.status(403).json({
      message: ORDER_MESSAGES.UNAUTHORIZED_TO_UPDATE_LOCATION
    })
  }

  // Check if order is in delivery
  if (![OrderStatus.OutForDelivery, OrderStatus.ReadyForPickup].includes(order.orderStatus)) {
    return res.status(400).json({
      message: ORDER_MESSAGES.CANNOT_UPDATE_LOCATION,
      status: order.orderStatus
    })
  }

  const timestamp = new Date()

  // Update delivery tracking
  const result = await databaseService.deliveryTracking.updateOne(
    { orderId: new ObjectId(id) },
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

  // Also update driver's current location in users collection
  await databaseService.users.updateOne(
    { _id: new ObjectId(user_id) },
    {
      $set: {
        currentLocation: { lat, lng, updatedAt: timestamp }
      }
    }
  )

  // Emit location update to relevant parties
  const io = getIO()

  // Emit to customer
  io.to(`user:${order.userId.toString()}`).emit('location:updated', {
    orderId: id,
    location: { lat, lng },
    timestamp
  })

  // Emit to restaurant
  io.to(`restaurant:${order.restaurantId.toString()}`).emit('location:updated', {
    orderId: id,
    location: { lat, lng },
    timestamp
  })

  res.status(200).json({
    message: ORDER_MESSAGES.UPDATE_LOCATION_SUCCESS,
    result: {
      updated: result.modifiedCount > 0
    }
  })
}

// Get active delivery orders (for delivery persons)
export const getActiveDeliveryOrdersController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }

  // Get all active orders assigned to this delivery person
  const orders = await databaseService.orders
    .find({
      deliveryPersonId: new ObjectId(user_id),
      orderStatus: { $in: [OrderStatus.ReadyForPickup, OrderStatus.OutForDelivery] }
    })
    .toArray()

  res.status(200).json({
    message: ORDER_MESSAGES.GET_ACTIVE_DELIVERIES_SUCCESS,
    result: orders
  })
}

// Get delivery history (for delivery persons)
export const getDeliveryHistoryController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const { page = 1, limit = 10, startDate, endDate, sortBy = 'created_at', sortOrder = 'desc' } = req.query

  // Build query
  const query: any = {
    deliveryPersonId: new ObjectId(user_id),
    orderStatus: { $in: [OrderStatus.Delivered, OrderStatus.Cancelled] }
  }

  // Add date range if provided
  if (startDate || endDate) {
    query.created_at = {}

    if (startDate) {
      query.created_at.$gte = new Date(startDate as string)
    }

    if (endDate) {
      query.created_at.$lte = new Date(endDate as string)
    }
  }

  // Count total matching documents
  const total = await databaseService.orders.countDocuments(query)

  // Get paginated results
  const pageNum = Number(page)
  const limitNum = Number(limit)
  const skip = (pageNum - 1) * limitNum

  const sort: any = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const orders = await databaseService.orders.find(query).sort(sort).skip(skip).limit(limitNum).toArray()

  res.status(200).json({
    message: ORDER_MESSAGES.GET_DELIVERY_HISTORY_SUCCESS,
    result: {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
}

// Search orders (for admin)
export const searchOrdersController = async (req: Request, res: Response) => {
  const {
    query = '',
    page = 1,
    limit = 10,
    status,
    paymentStatus,
    startDate,
    endDate,
    sortBy = 'created_at',
    sortOrder = 'desc',
    restaurantId,
    userId,
    deliveryPersonId,
    minAmount,
    maxAmount
  } = req.query

  // Build complex query
  const dbQuery: any = {}

  // Full text search if query provided
  if (query) {
    dbQuery.$or = [
      { orderNumber: { $regex: query, $options: 'i' } },
      { 'items.name': { $regex: query, $options: 'i' } },
      { notes: { $regex: query, $options: 'i' } }
    ]
  }

  // Filter by status
  if (status !== undefined) {
    dbQuery.orderStatus = Number(status)
  }

  // Filter by payment status
  if (paymentStatus !== undefined) {
    dbQuery.paymentStatus = Number(paymentStatus)
  }

  // Date range
  if (startDate || endDate) {
    dbQuery.created_at = {}

    if (startDate) {
      dbQuery.created_at.$gte = new Date(startDate as string)
    }

    if (endDate) {
      dbQuery.created_at.$lte = new Date(endDate as string)
    }
  }

  // Related entities
  if (restaurantId) {
    dbQuery.restaurantId = new ObjectId(restaurantId as string)
  }

  if (userId) {
    dbQuery.userId = new ObjectId(userId as string)
  }

  if (deliveryPersonId) {
    dbQuery.deliveryPersonId = new ObjectId(deliveryPersonId as string)
  }

  // Amount range
  if (minAmount !== undefined || maxAmount !== undefined) {
    dbQuery.total = {}

    if (minAmount !== undefined) {
      dbQuery.total.$gte = Number(minAmount)
    }

    if (maxAmount !== undefined) {
      dbQuery.total.$lte = Number(maxAmount)
    }
  }

  // Execute query with pagination
  const total = await databaseService.orders.countDocuments(dbQuery)

  const pageNum = Number(page)
  const limitNum = Number(limit)
  const skip = (pageNum - 1) * limitNum

  const sort: any = {}
  sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

  const orders = await databaseService.orders.find(dbQuery).sort(sort).skip(skip).limit(limitNum).toArray()

  res.status(200).json({
    message: ORDER_MESSAGES.SEARCH_ORDERS_SUCCESS,
    result: {
      orders,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
}
