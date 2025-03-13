import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import moment from 'moment'
import databaseService from './database.services'
import Refund, { RefundStatus, RefundMethod } from '../models/schemas/Refund.schema'
import { OrderStatus, PaymentStatus, PaymentMethod } from '../models/schemas/Order.schema'
import { ApiError } from '../middlewares/error.middlewares'
import HTTP_STATUS from '../constants/httpStatus'
import { envConfig } from '../constants/config'
import paymentService from './payment.services'

class RefundService {
  /**
   * Create a new refund request
   * @param orderId Order ID to refund
   * @param amount Amount to refund
   * @param reason Refund reason
   * @param requestedBy User ID who requested the refund
   * @param method Refund method
   * @returns Created refund
   */
  async createRefundRequest(
    orderId: string,
    amount: number,
    reason: string,
    requestedBy: string,
    method: RefundMethod = RefundMethod.Original
  ) {
    // Get order details
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      throw new ApiError('Order not found', HTTP_STATUS.NOT_FOUND)
    }

    // Check if order can be refunded
    if (order.paymentStatus !== PaymentStatus.Completed) {
      throw new ApiError('Order has not been paid', HTTP_STATUS.BAD_REQUEST)
    }

    // Check if refund amount is valid
    if (amount <= 0 || amount > order.total) {
      throw new ApiError('Invalid refund amount', HTTP_STATUS.BAD_REQUEST)
    }

    // Check if order has already been refunded
    const existingRefund = await databaseService.refunds.findOne({
      orderId: new ObjectId(orderId),
      status: { $in: [RefundStatus.Completed, RefundStatus.Processing, RefundStatus.Approved, RefundStatus.Pending] }
    })

    if (existingRefund) {
      throw new ApiError('Order already has a pending or completed refund', HTTP_STATUS.CONFLICT)
    }

    // Create refund transaction reference
    const transactionRef = `REF${moment().format('YYYYMMDDHHmmss')}${crypto.randomBytes(3).toString('hex').toUpperCase()}`

    // Create new refund
    const refund = new Refund({
      orderId: new ObjectId(orderId),
      userId: order.userId,
      paymentId: order.paymentId || '',
      amount,
      reason,
      status: RefundStatus.Pending,
      method,
      originalTransactionRef: order.paymentId || '',
      transactionRef
    })

    // Insert refund into database
    const result = await databaseService.refunds.insertOne(refund)

    // Get created refund
    const createdRefund = await databaseService.refunds.findOne({
      _id: result.insertedId
    })

    return createdRefund
  }

  /**
   * Approve a refund request
   * @param refundId Refund ID to approve
   * @param approvedBy User ID who approved the refund
   * @param notes Optional notes
   * @returns Updated refund
   */
  async approveRefund(refundId: string, approvedBy: string, notes?: string) {
    // Get refund details
    const refund = await databaseService.refunds.findOne({
      _id: new ObjectId(refundId)
    })

    if (!refund) {
      throw new ApiError('Refund not found', HTTP_STATUS.NOT_FOUND)
    }

    // Check if refund can be approved
    if (refund.status !== RefundStatus.Pending) {
      throw new ApiError('Refund cannot be approved in its current status', HTTP_STATUS.BAD_REQUEST)
    }

    // Update refund status
    const result = await databaseService.refunds.findOneAndUpdate(
      { _id: new ObjectId(refundId) },
      {
        $set: {
          status: RefundStatus.Approved,
          approvedBy: new ObjectId(approvedBy),
          notes: notes || refund.notes,
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new ApiError('Failed to approve refund', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    // Process the refund if it's for VNPay
    if (refund.method === RefundMethod.Original) {
      try {
        // Get order details
        const order = await databaseService.orders.findOne({
          _id: refund.orderId
        })

        if (!order) {
          throw new Error('Order not found')
        }

        // Only process automatically for VNPay payments
        if (order.paymentMethod === PaymentMethod.VNPay) {
          return await this.processRefund(refundId)
        }

        return result
      } catch (error: any) {
        console.error('Error processing refund:', error)

        // Update refund status to approved but not processed
        await databaseService.refunds.updateOne(
          { _id: new ObjectId(refundId) },
          {
            $set: {
              notes: `${result.notes}\nAutomatic processing failed: ${error.message}`,
              updated_at: new Date()
            }
          }
        )

        return result
      }
    }

    return result
  }

  /**
   * Process an approved refund
   * @param refundId Refund ID to process
   * @returns Processed refund
   */
  async processRefund(refundId: string) {
    // Get refund details
    const refund = await databaseService.refunds.findOne({
      _id: new ObjectId(refundId)
    })

    if (!refund) {
      throw new ApiError('Refund not found', HTTP_STATUS.NOT_FOUND)
    }

    // Check if refund can be processed
    if (refund.status !== RefundStatus.Approved) {
      throw new ApiError('Refund must be approved before processing', HTTP_STATUS.BAD_REQUEST)
    }

    try {
      // Update refund status to processing
      await databaseService.refunds.updateOne(
        { _id: new ObjectId(refundId) },
        {
          $set: {
            status: RefundStatus.Processing,
            updated_at: new Date()
          }
        }
      )

      // Get order details
      const order = await databaseService.orders.findOne({
        _id: refund.orderId
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // Process refund based on payment method
      if (order.paymentMethod === PaymentMethod.VNPay) {
        // Call VNPay refund API (in a real implementation)
        // For this example, we'll simulate a successful refund
        const processedAt = new Date()

        // Update refund as completed
        const result = await databaseService.refunds.findOneAndUpdate(
          { _id: new ObjectId(refundId) },
          {
            $set: {
              status: RefundStatus.Completed,
              updated_at: processedAt,
              completed_at: processedAt,
              notes: refund.notes ? `${refund.notes}\nRefund processed successfully.` : 'Refund processed successfully.'
            }
          },
          { returnDocument: 'after' }
        )

        if (!result) {
          throw new Error('Failed to update refund status')
        }

        // Update order payment status
        await databaseService.orders.updateOne(
          { _id: refund.orderId },
          {
            $set: {
              paymentStatus: PaymentStatus.Refunded,
              updated_at: new Date()
            }
          }
        )

        return result
      } else {
        // For other payment methods, admin needs to process manually
        throw new Error('Manual processing required for this payment method')
      }
    } catch (error: any) {
      // Update refund status to failed
      await databaseService.refunds.updateOne(
        { _id: new ObjectId(refundId) },
        {
          $set: {
            status: RefundStatus.Failed,
            notes: refund.notes
              ? `${refund.notes}\nProcessing failed: ${error.message}`
              : `Processing failed: ${error.message}`,
            updated_at: new Date()
          }
        }
      )

      throw new ApiError(`Failed to process refund: ${error.message}`, HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }
  }

  /**
   * Reject a refund request
   * @param refundId Refund ID to reject
   * @param rejectedBy User ID who rejected the refund
   * @param reason Rejection reason
   * @returns Updated refund
   */
  async rejectRefund(refundId: string, rejectedBy: string, reason: string) {
    // Get refund details
    const refund = await databaseService.refunds.findOne({
      _id: new ObjectId(refundId)
    })

    if (!refund) {
      throw new ApiError('Refund not found', HTTP_STATUS.NOT_FOUND)
    }

    // Check if refund can be rejected
    if (refund.status !== RefundStatus.Pending) {
      throw new ApiError('Refund cannot be rejected in its current status', HTTP_STATUS.BAD_REQUEST)
    }

    // Update refund status
    const result = await databaseService.refunds.findOneAndUpdate(
      { _id: new ObjectId(refundId) },
      {
        $set: {
          status: RefundStatus.Rejected,
          rejectionReason: reason,
          approvedBy: new ObjectId(rejectedBy),
          updated_at: new Date()
        }
      },
      { returnDocument: 'after' }
    )

    if (!result) {
      throw new ApiError('Failed to reject refund', HTTP_STATUS.INTERNAL_SERVER_ERROR)
    }

    return result
  }

  /**
   * Get refund by ID
   * @param refundId Refund ID
   * @returns Refund details
   */
  async getRefundById(refundId: string) {
    const refund = await databaseService.refunds.findOne({
      _id: new ObjectId(refundId)
    })

    if (!refund) {
      throw new ApiError('Refund not found', HTTP_STATUS.NOT_FOUND)
    }

    return refund
  }

  /**
   * Get refunds for an order
   * @param orderId Order ID
   * @returns Refunds for the order
   */
  async getRefundsByOrderId(orderId: string) {
    return databaseService.refunds
      .find({
        orderId: new ObjectId(orderId)
      })
      .sort({ created_at: -1 })
      .toArray()
  }

  /**
   * Get refunds for a user
   * @param userId User ID
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated refunds for the user
   */
  async getRefundsByUserId(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const count = await databaseService.refunds.countDocuments({
      userId: new ObjectId(userId)
    })

    const refunds = await databaseService.refunds
      .find({
        userId: new ObjectId(userId)
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Enrich with order details
    const enrichedRefunds = await Promise.all(
      refunds.map(async (refund) => {
        const order = await databaseService.orders.findOne({
          _id: refund.orderId
        })

        const restaurant = order
          ? await databaseService.restaurants.findOne(
              {
                _id: order.restaurantId
              },
              { projection: { name: 1 } }
            )
          : null

        return {
          ...refund,
          order: order
            ? {
                orderNumber: order.orderNumber,
                total: order.total,
                restaurantName: restaurant ? restaurant.name : 'Unknown Restaurant'
              }
            : null
        }
      })
    )

    return {
      refunds: enrichedRefunds,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    }
  }

  /**
   * Get all refunds (for admin)
   * @param status Filter by status
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated refunds
   */
  async getAllRefunds(status?: RefundStatus, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit

    const filter: any = {}
    if (status !== undefined) {
      filter.status = status
    }

    const count = await databaseService.refunds.countDocuments(filter)

    const refunds = await databaseService.refunds
      .find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Enrich with user and order details
    const enrichedRefunds = await Promise.all(
      refunds.map(async (refund) => {
        const user = await databaseService.users.findOne(
          {
            _id: refund.userId
          },
          { projection: { name: 1, email: 1 } }
        )

        const order = await databaseService.orders.findOne({
          _id: refund.orderId
        })

        const restaurant = order
          ? await databaseService.restaurants.findOne(
              {
                _id: order.restaurantId
              },
              { projection: { name: 1 } }
            )
          : null

        return {
          ...refund,
          user: user
            ? {
                name: user.name,
                email: user.email
              }
            : null,
          order: order
            ? {
                orderNumber: order.orderNumber,
                total: order.total,
                restaurantName: restaurant ? restaurant.name : 'Unknown Restaurant'
              }
            : null
        }
      })
    )

    return {
      refunds: enrichedRefunds,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit)
      }
    }
  }
}

const refundService = new RefundService()

export default refundService
