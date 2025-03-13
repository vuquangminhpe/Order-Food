import { ObjectId } from 'mongodb'
import { PaymentMethod, PaymentStatus } from '../schemas/Order.schema'

export interface PaymentReqBody {
  orderId: string
  amount: number
  orderInfo?: string
}

export interface RefundReqBody {
  orderId: string
  amount: number
  reason: string
}

export interface PaymentUrlResponse {
  paymentUrl: string
}

export interface QrCodeResponse {
  qrCodeData: string
}

export interface PaymentIpnResponse {
  RspCode: string
  Message: string
  orderId?: string
  paymentStatus?: PaymentStatus
}

export interface PaymentReturnResponse {
  code: number
  message: string
  data: {
    orderId: string
    paymentStatus: PaymentStatus
    orderStatus: number
  }
}

export interface RefundResponse {
  success: boolean
  message: string
  data: {
    orderId: string
    refundAmount: number
    refundId: string
  }
}

export interface PaymentHistoryItem {
  orderId: ObjectId
  orderNumber: string
  restaurantName: string
  amount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentDate: Date
  items: number
}

export interface PaymentHistoryResponse {
  payments: PaymentHistoryItem[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface RefundType {
  _id?: ObjectId
  orderId: ObjectId
  amount: number
  reason: string
  status: 'pending' | 'completed' | 'failed'
  transactionRef: string
  originalTransactionRef: string
  created_at?: Date
  updated_at?: Date
}

export interface PaymentTransactionType {
  _id?: ObjectId
  orderId: ObjectId
  amount: number
  paymentMethod: PaymentMethod
  status: PaymentStatus
  transactionRef?: string
  gatewayResponse?: any
  created_at?: Date
  updated_at?: Date
}
