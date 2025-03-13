import { ObjectId } from 'mongodb'

export enum RefundStatus {
  Pending = 0,
  Approved = 1,
  Processing = 2,
  Completed = 3,
  Rejected = 4,
  Failed = 5
}

export enum RefundMethod {
  Original = 0,
  Wallet = 1,
  BankTransfer = 2
}

interface RefundType {
  _id?: ObjectId
  orderId: ObjectId
  userId: ObjectId
  paymentId: string
  amount: number
  reason: string
  status: RefundStatus
  method: RefundMethod
  transactionRef?: string
  originalTransactionRef: string
  approvedBy?: ObjectId
  rejectionReason?: string
  notes?: string
  created_at?: Date
  updated_at?: Date
  completed_at?: Date
}

export default class Refund {
  _id?: ObjectId
  orderId: ObjectId
  userId: ObjectId
  paymentId: string
  amount: number
  reason: string
  status: RefundStatus
  method: RefundMethod
  transactionRef: string
  originalTransactionRef: string
  approvedBy?: ObjectId
  rejectionReason: string
  notes: string
  created_at: Date
  updated_at: Date
  completed_at?: Date

  constructor(refund: RefundType) {
    const date = new Date()
    this._id = refund._id
    this.orderId = refund.orderId
    this.userId = refund.userId
    this.paymentId = refund.paymentId
    this.amount = refund.amount
    this.reason = refund.reason
    this.status = refund.status
    this.method = refund.method
    this.transactionRef = refund.transactionRef || ''
    this.originalTransactionRef = refund.originalTransactionRef
    this.approvedBy = refund.approvedBy
    this.rejectionReason = refund.rejectionReason || ''
    this.notes = refund.notes || ''
    this.created_at = refund.created_at || date
    this.updated_at = refund.updated_at || date
    this.completed_at = refund.completed_at
  }
}
