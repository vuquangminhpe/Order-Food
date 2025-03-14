import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import refundService from '../services/refund.services'
import restaurantService from '../services/restaurant.services'
import databaseService from '../services/database.services'
import HTTP_STATUS from '../constants/httpStatus'
import { PAYMENT_MESSAGES } from '../constants/messages'
import { RefundMethod, RefundStatus } from '../models/schemas/Refund.schema'

// Create a new refund request
export const createRefundController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { orderId, amount, reason, method } = req.body

  // Create refund request
  const refund = await refundService.createRefundRequest(orderId, amount, reason, user_id, method)

  res.status(HTTP_STATUS.CREATED).json({
    message: 'Refund request created successfully',
    result: refund
  })
}

// Get refund by ID
export const getRefundController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id, role } = req.decoded_authorization as { user_id: string; role: number }

  // Get refund
  const refund = await refundService.getRefundById(id)

  // Check permissions (admin can see all refunds)
  if (role !== 3 && refund.userId.toString() !== user_id) {
    // Check if user is restaurant owner
    const order = await databaseService.orders.findOne({
      _id: refund.orderId
    })

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Order not found'
      })
    }

    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())

    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to view this refund'
      })
    }
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Refund retrieved successfully',
    result: refund
  })
}

// Get refunds for an order
export const getRefundsByOrderController = async (req: Request, res: Response) => {
  const { orderId } = req.params
  const { user_id, role } = req.decoded_authorization as { user_id: string; role: number }

  // Check permissions
  const order = await databaseService.orders.findOne({
    _id: new ObjectId(orderId)
  })

  if (!order) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: 'Order not found'
    })
  }

  // Admin can see all refunds
  if (role !== 3 && order.userId.toString() !== user_id) {
    // Check if user is restaurant owner
    const restaurant = await restaurantService.getRestaurantById(order.restaurantId.toString())

    if (!restaurant || restaurant.ownerId.toString() !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'You are not authorized to view refunds for this order'
      })
    }
  }

  // Get refunds
  const refunds = await refundService.getRefundsByOrderId(orderId)

  res.status(HTTP_STATUS.OK).json({
    message: 'Refunds retrieved successfully',
    result: refunds
  })
}

// Get user's refunds
export const getUserRefundsController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { page = 1, limit = 10 } = req.query

  // Get refunds
  const result = await refundService.getRefundsByUserId(user_id, Number(page), Number(limit))

  res.status(HTTP_STATUS.OK).json({
    message: 'Refunds retrieved successfully',
    result
  })
}

// Get all refunds (admin)
export const getAllRefundsController = async (req: Request, res: Response) => {
  const { status, page = 1, limit = 10 } = req.query

  // Get refunds
  const result = await refundService.getAllRefunds(
    status !== undefined ? (Number(status) as RefundStatus) : undefined,
    Number(page),
    Number(limit)
  )

  res.status(HTTP_STATUS.OK).json({
    message: 'Refunds retrieved successfully',
    result
  })
}

// Approve refund
export const approveRefundController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { notes } = req.body

  // Approve refund
  const result = await refundService.approveRefund(id, user_id, notes)

  res.status(HTTP_STATUS.OK).json({
    message: 'Refund approved successfully',
    result
  })
}

// Reject refund
export const rejectRefundController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { reason } = req.body

  if (!reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Rejection reason is required'
    })
  }

  // Reject refund
  const result = await refundService.rejectRefund(id, user_id, reason)

  res.status(HTTP_STATUS.OK).json({
    message: 'Refund rejected successfully',
    result
  })
}

// Process refund (admin only)
export const processRefundController = async (req: Request, res: Response) => {
  const { id } = req.params

  // Process refund
  const result = await refundService.processRefund(id)

  res.status(HTTP_STATUS.OK).json({
    message: 'Refund processed successfully',
    result
  })
}
