import { ObjectId } from 'mongodb'
import { OrderStatus, PaymentMethod, PaymentStatus } from '../schemas/Order.schema'

export interface OrderFilterOptions {
  page: number
  limit: number
  status?: OrderStatus
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface DeliveryHistoryFilterOptions {
  page: number
  limit: number
  startDate?: Date
  endDate?: Date
}

export interface OrderItemOption {
  title: string
  items: {
    name: string
    price: number
  }[]
}

export interface OrderItem {
  menuItemId: ObjectId
  name: string
  price: number
  quantity: number
  options?: OrderItemOption[]
  totalPrice: number
}

export interface OrderAddress {
  address: string
  lat: number
  lng: number
}

export interface OrderResponse {
  _id: string
  orderNumber: string
  userId: string
  restaurantId: string
  items: OrderItem[]
  deliveryAddress: OrderAddress
  subtotal: number
  deliveryFee: number
  serviceCharge: number
  discount: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  scheduledFor?: Date
  deliveryPersonId?: string
  estimatedDeliveryTime?: number
  actualDeliveryTime?: Date
  rejectionReason?: string
  notes: string
  created_at: Date
  updated_at: Date
  restaurant?: {
    name: string
    address: string
    logoImage?: string
  }
  user?: {
    name: string
    phone: string
  }
  deliveryPerson?: {
    name: string
    phone: string
  }
}

export interface OrdersListResponse {
  orders: OrderResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface OrderTrackingResponse {
  _id: string
  orderId: string
  deliveryPersonId: string
  status: string
  locationHistory: {
    lat: number
    lng: number
    timestamp: Date
  }[]
  currentLocation?: {
    lat: number
    lng: number
    timestamp: Date
  }
  estimatedArrival?: Date
  created_at: Date
  updated_at: Date
}

export interface OrderRatingRequest {
  rating: number
  review?: string
  foodRating?: number
  deliveryRating?: number
}

export interface OrderStatusUpdateResult {
  success: boolean
  message: string
  order?: OrderResponse
}

export interface OrderDailySummary {
  date: Date
  totalOrders: number
  totalRevenue: number
  statusBreakdown: {
    status: string
    count: number
    total: number
  }[]
  hourlyData: {
    hour: number
    count: number
    total: number
  }[]
}

export interface LocationUpdateRequest {
  orderId: string
  lat: number
  lng: number
}

export interface LocationUpdateResult {
  updated: boolean
  currentLocation?: {
    lat: number
    lng: number
    timestamp: Date
  }
  estimatedArrival?: Date
}
