import express from 'express'
import { authMiddleware } from '../middlewares/auth.middlewares'
import { paymentValidator, refundValidator } from '../middlewares/validation.middlewares'
import {
  createPaymentUrlController,
  vnpayIpnController,
  vnpayReturnController,
  generateQrCodeController,
  refundPaymentController,
  getPaymentHistoryController
} from '../controllers/payment.controller'
import { wrapAsync } from '../middlewares/error.middlewares'
import { checkUserRole } from '../middlewares/common.middlewares'
import { UserRole } from '../models/schemas/Users.schema'

const paymentRouter = express.Router()

// Create VNPay payment URL
paymentRouter.post('/create-payment-url', authMiddleware, paymentValidator, wrapAsync(createPaymentUrlController))

// Generate QR code for payment
paymentRouter.post('/generate-qr', authMiddleware, paymentValidator, wrapAsync(generateQrCodeController))

// VNPay IPN (Instant Payment Notification) webhook
paymentRouter.get('/vnpay-ipn', wrapAsync(vnpayIpnController))

// VNPay return URL after payment
paymentRouter.get('/vnpay-return', wrapAsync(vnpayReturnController))

// Refund payment (for restaurant owners and admins)
paymentRouter.post('/refund', authMiddleware, refundValidator, wrapAsync(refundPaymentController))

// Get payment history for user
paymentRouter.get('/history', authMiddleware, wrapAsync(getPaymentHistoryController))

export default paymentRouter
