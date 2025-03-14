import { checkSchema } from 'express-validator'
import { validate, isValidObjectId } from '../utils/validation'
import databaseService from '../services/database.services'
import { ObjectId } from 'mongodb'
import { PaymentStatus } from '../models/schemas/Order.schema'
import { PAYMENT_MESSAGES } from '../constants/messages'
import { RefundMethod, RefundStatus } from '../models/schemas/Refund.schema'

// Refund request validator
export const refundValidator = validate(
  checkSchema(
    {
      orderId: {
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        custom: {
          options: async (value, { req }) => {
            if (!isValidObjectId(value)) {
              throw new Error('Invalid order ID format')
            }

            // Check if order exists
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(value)
            })

            if (!order) {
              throw new Error(PAYMENT_MESSAGES.ORDER_NOT_FOUND)
            }

            // Check if user is authorized to request refund
            const { user_id, role } = req.decoded_authorization

            // Admin or restaurant owner can refund any order
            if (role === 3) {
              return true
            }

            // Customer can only refund their own orders
            if (order.userId.toString() !== user_id) {
              const restaurant = await databaseService.restaurants.findOne({
                _id: order.restaurantId,
                ownerId: new ObjectId(user_id)
              })

              if (!restaurant) {
                throw new Error('You are not authorized to request a refund for this order')
              }
            }

            // Check if order is paid
            if (order.paymentStatus !== PaymentStatus.Completed) {
              throw new Error('Order has not been paid')
            }

            // Check if order already has a refund
            const existingRefund = await databaseService.refunds.findOne({
              orderId: new ObjectId(value),
              status: {
                $in: [RefundStatus.Pending, RefundStatus.Approved, RefundStatus.Processing, RefundStatus.Completed]
              }
            })

            if (existingRefund) {
              throw new Error('Order already has a pending or completed refund')
            }

            return true
          }
        }
      },
      amount: {
        notEmpty: {
          errorMessage: 'Amount is required'
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: 'Amount must be a positive number'
        },
        custom: {
          options: async (value, { req }) => {
            if (!req.body.orderId || !isValidObjectId(req.body.orderId)) {
              return true // Skip this validation if orderId is invalid
            }

            // Check if amount is valid
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(req.body.orderId)
            })

            if (!order) {
              return true // Skip if order not found
            }

            if (parseFloat(value) <= 0) {
              throw new Error('Amount must be greater than 0')
            }

            if (parseFloat(value) > order.total) {
              throw new Error('Refund amount cannot exceed the order total')
            }

            return true
          }
        }
      },
      reason: {
        notEmpty: {
          errorMessage: 'Reason is required'
        },
        isString: true,
        isLength: {
          options: { min: 3, max: 500 },
          errorMessage: 'Reason must be between 3 and 500 characters'
        },
        trim: true
      },
      method: {
        optional: true,
        isInt: true,
        custom: {
          options: (value) => {
            const validMethods = Object.values(RefundMethod).filter((v) => !isNaN(Number(v)))
            if (!validMethods.includes(Number(value))) {
              throw new Error('Invalid refund method')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

// Approve/reject refund validator
export const approveRejectRefundValidator = validate(
  checkSchema(
    {
      id: {
        notEmpty: {
          errorMessage: 'Refund ID is required'
        },
        custom: {
          options: async (value, { req }) => {
            if (!isValidObjectId(value)) {
              throw new Error('Invalid refund ID format')
            }

            // Check if refund exists
            const refund = await databaseService.refunds.findOne({
              _id: new ObjectId(value)
            })

            if (!refund) {
              throw new Error('Refund not found')
            }

            // Check if refund can be approved/rejected
            if (refund.status !== RefundStatus.Pending) {
              throw new Error('Refund cannot be approved/rejected in its current status')
            }

            // Check if user is authorized to approve/reject
            const { user_id, role } = req.decoded_authorization

            // Admin can approve/reject any refund
            if (role === 3) {
              return true
            }

            // Get order
            const order = await databaseService.orders.findOne({
              _id: refund.orderId
            })

            if (!order) {
              throw new Error('Order not found')
            }

            // Restaurant owner can only approve/reject refunds for their own orders
            const restaurant = await databaseService.restaurants.findOne({
              _id: order.restaurantId,
              ownerId: new ObjectId(user_id)
            })

            if (!restaurant) {
              throw new Error('You are not authorized to approve/reject this refund')
            }

            return true
          }
        }
      },
      notes: {
        optional: true,
        isString: true,
        isLength: {
          options: { max: 500 },
          errorMessage: 'Notes cannot exceed 500 characters'
        },
        trim: true
      },
      reason: {
        optional: true,
        isString: true,
        isLength: {
          options: { min: 3, max: 500 },
          errorMessage: 'Reason must be between 3 and 500 characters'
        },
        trim: true
      }
    },
    ['params', 'body']
  )
)
