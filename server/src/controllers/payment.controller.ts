import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { PAYMENT_MESSAGES } from '../constants/messages'
import paymentService from '../services/payment.services'
import databaseService from '../services/database.services'
import HTTP_STATUS from '../constants/httpStatus'
import { PaymentStatus } from '../models/schemas/Order.schema'
import { PaymentReqBody } from '../models/requests/auth.requests'
import { RefundReqBody } from '../models/requests/payment.requests'

// Create VNPay payment URL
export const createPaymentUrlController = async (
  req: Request<ParamsDictionary, any, PaymentReqBody>,
  res: Response
) => {
  try {
    const { orderId, amount, orderInfo } = req.body

    // Get IP address
    const ipAddr =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || '127.0.0.1'

    // Create payment URL
    const paymentUrl = await paymentService.createPaymentUrl(
      orderId,
      amount,
      orderInfo || `Payment for order ${orderId}`,
      ipAddr as string
    )

    res.status(HTTP_STATUS.OK).json({
      message: PAYMENT_MESSAGES.PAYMENT_URL_CREATED,
      result: {
        paymentUrl
      }
    })
  } catch (error: any) {
    console.error('Error creating payment URL:', error)
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error.message || PAYMENT_MESSAGES.PAYMENT_FAILED
    })
  }
}

// Generate QR code for VNPay payment
export const generateQrCodeController = async (req: Request<ParamsDictionary, any, PaymentReqBody>, res: Response) => {
  try {
    const { orderId, amount } = req.body

    // Generate QR code data
    const qrCodeData = await paymentService.generateQrCodeData(orderId, amount)

    res.status(HTTP_STATUS.OK).json({
      message: 'QR code data generated successfully',
      result: {
        qrCodeData
      }
    })
  } catch (error: any) {
    console.error('Error generating QR code:', error)
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error.message || 'Failed to generate QR code'
    })
  }
}

// VNPay IPN (Instant Payment Notification) webhook
export const vnpayIpnController = async (req: Request, res: Response) => {
  try {
    const vnpParams = req.query

    // Verify IPN
    const result = await paymentService.verifyIpn(vnpParams)

    // Send response to VNPay
    res.status(HTTP_STATUS.OK).json({
      RspCode: result.RspCode,
      Message: result.Message
    })
  } catch (error) {
    console.error('Error processing VNPay IPN:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      RspCode: '99',
      Message: 'Unknown error'
    })
  }
}

// VNPay return URL after payment
export const vnpayReturnController = async (req: Request, res: Response) => {
  try {
    const vnpParams = req.query

    // Handle payment return
    const result = await paymentService.handlePaymentReturn(vnpParams)

    // Return result to client (this would typically redirect to a frontend page)
    res.status(HTTP_STATUS.OK).json(result)
  } catch (error) {
    console.error('Error processing VNPay return:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      code: 99,
      message: 'Unknown error'
    })
  }
}

// Refund payment
export const refundPaymentController = async (req: Request<ParamsDictionary, any, RefundReqBody>, res: Response) => {
  try {
    const { user_id, role } = req.decoded_authorization as { user_id: string; role: number }
    const { orderId, amount, reason } = req.body

    // Check if order exists
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: PAYMENT_MESSAGES.ORDER_NOT_FOUND
      })
    }

    // Check authorization (admin or restaurant owner)
    if (role !== 3) {
      // Not admin
      const restaurant = await databaseService.restaurants.findOne({
        _id: order.restaurantId
      })

      if (!restaurant || restaurant.ownerId.toString() !== user_id) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: 'You are not authorized to refund this payment'
        })
      }
    }

    // Process refund
    const refundResult = await paymentService.refundPayment(orderId, amount, reason)

    res.status(HTTP_STATUS.OK).json({
      message: 'Refund processed successfully',
      result: refundResult
    })
  } catch (error: any) {
    console.error('Error processing refund:', error)
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error.message || 'Failed to process refund'
    })
  }
}

// Get payment history for user
export const getPaymentHistoryController = async (req: Request, res: Response) => {
  try {
    const { user_id } = req.decoded_authorization as { user_id: string }
    const { page = 1, limit = 10 } = req.query

    // Get all orders with payments for this user
    const query = {
      userId: new ObjectId(user_id),
      paymentStatus: { $ne: PaymentStatus.Pending }
    }

    // Count total
    const total = await databaseService.orders.countDocuments(query)

    // Get paginated results
    const pageNum = Number(page)
    const limitNum = Number(limit)
    const skip = (pageNum - 1) * limitNum

    const orders = await databaseService.orders
      .find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray()

    // Get restaurant details
    const paymentsWithDetails = await Promise.all(
      orders.map(async (order) => {
        const restaurant = await databaseService.restaurants.findOne(
          { _id: order.restaurantId },
          { projection: { name: 1 } }
        )

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant?.name || 'Unknown Restaurant',
          amount: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          paymentDate: order.updated_at,
          items: order.items.length
        }
      })
    )

    res.status(HTTP_STATUS.OK).json({
      message: 'Payment history retrieved successfully',
      result: {
        payments: paymentsWithDetails,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    })
  } catch (error) {
    console.error('Error retrieving payment history:', error)
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to retrieve payment history'
    })
  }
}
