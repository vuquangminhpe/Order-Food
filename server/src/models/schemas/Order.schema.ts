import { ObjectId } from 'mongodb'

enum OrderStatus {
  Pending = 0,
  Confirmed = 1,
  Preparing = 2,
  ReadyForPickup = 3,
  OutForDelivery = 4,
  Delivered = 5,
  Cancelled = 6,
  Rejected = 7
}

enum PaymentStatus {
  Pending = 0,
  Completed = 1,
  Failed = 2,
  Refunded = 3
}

enum PaymentMethod {
  CashOnDelivery = 0,
  VNPay = 1
}

interface OrderType {
  _id?: ObjectId
  orderNumber?: string
  userId: ObjectId
  restaurantId: ObjectId
  items: {
    menuItemId: ObjectId
    name: string
    price: number
    quantity: number
    options?: {
      title: string
      items: {
        name: string
        price: number
      }[]
    }[]
    totalPrice: number
  }[]
  deliveryAddress: {
    address: string
    lat: number
    lng: number
  }
  subtotal: number
  deliveryFee: number
  serviceCharge?: number
  discount?: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentId?: string
  orderStatus: OrderStatus
  scheduledFor?: Date
  deliveryPersonId?: ObjectId
  estimatedDeliveryTime?: number
  actualDeliveryTime?: Date
  rejectionReason?: string
  notes?: string
  created_at?: Date
  updated_at?: Date
}

export default class Order {
  _id?: ObjectId
  orderNumber: string
  userId: ObjectId
  restaurantId: ObjectId
  items: {
    menuItemId: ObjectId
    name: string
    price: number
    quantity: number
    options?: {
      title: string
      items: {
        name: string
        price: number
      }[]
    }[]
    totalPrice: number
  }[]
  deliveryAddress: {
    address: string
    lat: number
    lng: number
  }
  subtotal: number
  deliveryFee: number
  serviceCharge: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentId?: string
  orderStatus: OrderStatus
  scheduledFor?: Date
  deliveryPersonId?: ObjectId
  estimatedDeliveryTime?: number
  actualDeliveryTime?: Date
  rejectionReason?: string
  notes: string
  created_at: Date
  updated_at: Date

  constructor(order: OrderType) {
    const date = new Date()
    this._id = order._id

    this.orderNumber = order.orderNumber || this.generateOrderNumber()

    this.userId = order.userId
    this.restaurantId = order.restaurantId
    this.items = order.items
    this.deliveryAddress = order.deliveryAddress
    this.subtotal = order.subtotal
    this.deliveryFee = order.deliveryFee
    this.serviceCharge = order.serviceCharge || 0
    this.discount = order.discount || 0
    this.total = order.total
    this.paymentMethod = order.paymentMethod
    this.paymentStatus = order.paymentStatus
    this.paymentId = order.paymentId
    this.orderStatus = order.orderStatus
    this.scheduledFor = order.scheduledFor
    this.deliveryPersonId = order.deliveryPersonId
    this.estimatedDeliveryTime = order.estimatedDeliveryTime
    this.actualDeliveryTime = order.actualDeliveryTime
    this.rejectionReason = order.rejectionReason
    this.notes = order.notes || ''
    this.created_at = order.created_at || date
    this.updated_at = order.updated_at || date
  }

  private generateOrderNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().substr(-2)
    const month = ('0' + (date.getMonth() + 1)).slice(-2)
    const day = ('0' + date.getDate()).slice(-2)
    const random = Math.floor(Math.random() * 9000) + 1000

    return `ORD-${year}${month}${day}-${random}`
  }
}

export { OrderStatus, PaymentStatus, PaymentMethod }
