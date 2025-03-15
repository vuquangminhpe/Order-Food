import crypto from 'crypto'
import querystring from 'querystring'
import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { OrderStatus, PaymentStatus } from '../models/schemas/Order.schema'
import { envConfig } from '../constants/config'
import moment from 'moment'
import { RefundMethod, RefundStatus } from '../models/schemas/Refund.schema'

class PaymentService {
  private vnp_TmnCode: string
  private vnp_HashSecret: string
  private vnp_Url: string
  private vnp_ReturnUrl: string
  private vnp_Version: string = '2.1.0'
  private vnp_Command: string = 'pay'
  private vnp_CurrCode: string = 'VND'
  private vnp_Locale: string = 'vn'

  constructor() {
    this.vnp_TmnCode = envConfig.vnpay_tmn_code || ''
    this.vnp_HashSecret = envConfig.vnpay_hash_secret || ''
    this.vnp_Url = envConfig.vnpay_payment_url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'
    this.vnp_ReturnUrl = `${envConfig.client_url}/payment/result`
  }

  /**
   * Create VNPay payment URL
   * @param orderId Order ID
   * @param amount Amount in VND
   * @param orderInfo Order description
   * @param ipAddr Client IP address
   * @returns Payment URL
   */
  async createPaymentUrl(orderId: string, amount: number, orderInfo: string, ipAddr: string): Promise<string> {
    // Check if order exists
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Check if order is already paid
    if (order.paymentStatus === PaymentStatus.Completed) {
      throw new Error('Order is already paid')
    }

    // Format date for VNPay
    const createDate = moment().format('YYYYMMDDHHmmss')

    // Create order ID for VNPay (unique reference)
    const orderId2 = moment().format('DDHHmmss')

    // Prepare data for VNPay
    const vnpParams: any = {
      vnp_Version: this.vnp_Version,
      vnp_Command: this.vnp_Command,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: this.vnp_Locale,
      vnp_CurrCode: this.vnp_CurrCode,
      vnp_TxnRef: orderId2,
      vnp_OrderInfo: orderInfo || `Payment for order ${orderId}`,
      vnp_OrderType: 'food_delivery',
      vnp_Amount: amount * 100, // VNPay requires amount * 100
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    }

    // Store VNPay transaction reference in database for callback verification
    await databaseService.orders.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          paymentId: orderId2,
          updated_at: new Date()
        }
      }
    )

    // Sort params alphabetically before signing
    const sortedParams = this.sortObject(vnpParams)

    // Create signature
    const signData = querystring.stringify(sortedParams)
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')
    sortedParams['vnp_SecureHash'] = signed

    // Create full payment URL
    const paymentUrl = `${this.vnp_Url}?${querystring.stringify(sortedParams)}`

    return paymentUrl
  }

  /**
   * Verify VNPay IPN (Instant Payment Notification)
   * @param vnpParams VNPay params from callback
   * @returns Verification result
   */
  async verifyIpn(vnpParams: any): Promise<{
    RspCode: string
    Message: string
    orderId?: string
    paymentStatus?: PaymentStatus
  }> {
    const secureHash = vnpParams['vnp_SecureHash']

    // Remove hash from params to validate
    delete vnpParams['vnp_SecureHash']
    delete vnpParams['vnp_SecureHashType']

    // Sort params
    const sortedParams = this.sortObject(vnpParams)

    // Check signature
    const signData = querystring.stringify(sortedParams)
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    // Compare signatures
    if (secureHash !== signed) {
      return { RspCode: '97', Message: 'Invalid signature' }
    }

    // Find order by payment ID
    const paymentId = vnpParams['vnp_TxnRef']
    const order = await databaseService.orders.findOne({
      paymentId: paymentId
    })

    if (!order) {
      return { RspCode: '01', Message: 'Order not found' }
    }

    // Check payment amount
    const vnpAmount = Number(vnpParams['vnp_Amount']) / 100 // Convert back to original amount
    if (vnpAmount !== order.total) {
      return { RspCode: '04', Message: 'Invalid amount' }
    }

    // Check payment status
    if (order.paymentStatus === PaymentStatus.Completed) {
      return {
        RspCode: '02',
        Message: 'Order already confirmed',
        orderId: order._id.toString(),
        paymentStatus: order.paymentStatus
      }
    }

    // Check VNPay response code
    const vnpResponseCode = vnpParams['vnp_ResponseCode']
    let paymentStatus = PaymentStatus.Pending
    let orderStatus = order.orderStatus

    if (vnpResponseCode === '00') {
      // Payment successful
      paymentStatus = PaymentStatus.Completed

      // Update order status if it's still pending
      if (orderStatus === OrderStatus.Pending) {
        orderStatus = OrderStatus.Confirmed
      }
    } else if (['06', '24', '51', '99'].includes(vnpResponseCode)) {
      // Payment failed
      paymentStatus = PaymentStatus.Failed
    }

    // Update order in database
    await databaseService.orders.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus,
          orderStatus,
          updated_at: new Date()
        }
      }
    )

    // Success response to VNPay
    return {
      RspCode: '00',
      Message: 'Confirmed',
      orderId: order._id.toString(),
      paymentStatus
    }
  }

  /**
   * Handle VNPay payment return
   * @param vnpParams VNPay params from return URL
   * @returns Payment result
   */
  async handlePaymentReturn(vnpParams: any): Promise<any> {
    const secureHash = vnpParams['vnp_SecureHash']

    // Remove hash from params to validate
    delete vnpParams['vnp_SecureHash']
    delete vnpParams['vnp_SecureHashType']

    // Sort params
    const sortedParams = this.sortObject(vnpParams)

    // Check signature
    const signData = querystring.stringify(sortedParams)
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret)
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex')

    // Compare signatures
    if (secureHash !== signed) {
      return {
        code: 97,
        message: 'Invalid signature'
      }
    }

    // Find order by payment ID
    const paymentId = vnpParams['vnp_TxnRef']
    const order = await databaseService.orders.findOne({
      paymentId: paymentId
    })

    if (!order) {
      return {
        code: 1,
        message: 'Order not found'
      }
    }

    // Check VNPay response code
    const vnpResponseCode = vnpParams['vnp_ResponseCode']
    let paymentStatus = order.paymentStatus
    let orderStatus = order.orderStatus

    // Update payment status if needed
    if (paymentStatus !== PaymentStatus.Completed && vnpResponseCode === '00') {
      paymentStatus = PaymentStatus.Completed

      // Update order status if it's still pending
      if (orderStatus === OrderStatus.Pending) {
        orderStatus = OrderStatus.Confirmed
      }

      // Update order in database
      await databaseService.orders.updateOne(
        { _id: order._id },
        {
          $set: {
            paymentStatus,
            orderStatus,
            updated_at: new Date()
          }
        }
      )
    }

    // Return result to client
    return {
      code: Number(vnpResponseCode),
      message: this.getResponseMessage(vnpResponseCode),
      data: {
        orderId: order._id.toString(),
        paymentStatus,
        orderStatus
      }
    }
  }

  /**
   * Generate VNPay payment QR code data
   * @param orderId Order ID
   * @param amount Amount in VND
   * @returns QR code data
   */
  async generateQrCodeData(orderId: string, amount: number): Promise<string> {
    // Check if order exists
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Format for VNPay QR
    const createDate = moment().format('YYYYMMDDHHmmss')
    const orderInfo = `Payment for order ${orderId}`
    const qrCodeData = `${this.vnp_TmnCode}|${orderInfo}|${amount}|${createDate}|${orderId}`

    // Generate hash
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret)
    const hash = hmac.update(Buffer.from(qrCodeData, 'utf-8')).digest('hex')

    // Return formatted QR data
    return `${qrCodeData}|${hash}`
  }

  /**
   * Refund payment via VNPay
   * @param orderId Order ID
   * @param amount Amount to refund (can be partial)
   * @param reason Refund reason
   * @returns Refund result
   */
  async refundPayment(orderId: string, amount: number, reason: string): Promise<any> {
    // Check if order exists
    const order = await databaseService.orders.findOne({
      _id: new ObjectId(orderId)
    })

    if (!order) {
      throw new Error('Order not found')
    }

    // Check if order has been paid
    if (order.paymentStatus !== PaymentStatus.Completed) {
      throw new Error('Order has not been paid')
    }

    // Original payment transaction reference
    if (!order.paymentId) {
      throw new Error('No payment ID found for this order')
    }

    // Create refund parameters
    const date = moment().format('YYYYMMDDHHmmss')
    const transactionType = '03' // Refund transaction type
    const transactionRef = `R${moment().format('YYYYMMDDHHmmss')}`

    // In a real implementation, this would involve calling VNPay's refund API
    // For this example, we'll just update our database

    await databaseService.orders.updateOne(
      { _id: order._id },
      {
        $set: {
          paymentStatus: PaymentStatus.Refunded,
          rejectionReason: reason,
          updated_at: new Date()
        }
      }
    )

    await databaseService.refunds.insertOne({
      orderId: order._id,
      amount,
      reason,
      status: RefundStatus.Completed,
      transactionRef,
      originalTransactionRef: order.paymentId,
      created_at: new Date(),
      updated_at: new Date(),
      userId: new ObjectId(),
      paymentId: '',
      rejectionReason: '',
      notes: '',
      method: RefundMethod.Original
    })

    return {
      success: true,
      message: 'Refund processed successfully',
      data: {
        orderId: order._id.toString(),
        refundAmount: amount,
        refundId: transactionRef
      }
    }
  }

  /**
   * Sort object by key (required by VNPay)
   * @param obj Object to sort
   * @returns Sorted object
   */
  private sortObject(obj: any) {
    const sorted: any = {}
    const keys = Object.keys(obj).sort()

    for (const key of keys) {
      sorted[key] = obj[key]
    }

    return sorted
  }

  /**
   * Get response message for VNPay response code
   * @param responseCode VNPay response code
   * @returns Message
   */
  private getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      '00': 'Payment successful',
      '01': 'Order not found',
      '02': 'Order already paid',
      '04': 'Invalid amount',
      '05': 'Payment timeout',
      '06': 'Payment failed',
      '07': 'Transaction already processed',
      '09': 'Transaction failed',
      '10': 'Technical error',
      '11': 'User cancelled',
      '24': 'User cancelled',
      '51': 'User authentication failed',
      '65': 'User cancelled',
      '75': 'Authentication failed too many times',
      '79': 'Authentication failed too many times',
      '97': 'Invalid signature',
      '99': 'Unknown error'
    }

    return messages[responseCode] || 'Unknown error'
  }
}

const paymentService = new PaymentService()

export default paymentService
