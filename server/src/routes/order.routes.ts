import express from 'express'
import { authMiddleware } from '../middlewares/auth.middlewares'
import { orderValidator, updateOrderStatusValidator } from '../middlewares/validation.middlewares'
import {
  createOrderController,
  getOrderByIdController,
  getAllUserOrdersController,
  updateOrderStatusController,
  cancelOrderController,
  rateOrderController,
  assignDeliveryPersonController,
  getOrderTrackingController,
  updateDeliveryLocationController,
  getActiveDeliveryOrdersController,
  getDeliveryHistoryController,
  searchOrdersController
} from '../controllers/order.controller'

import { wrapAsync } from '../middlewares/error.middlewares'
import { checkUserRole } from '../middlewares/common.middlewares'
import { UserRole } from '../models/schemas/Users.schema'

const orderRouter = express.Router()

// Customer order routes
orderRouter.post('/', authMiddleware, orderValidator, wrapAsync(createOrderController))

orderRouter.get('/user', authMiddleware, wrapAsync(getAllUserOrdersController))

orderRouter.get('/:id', authMiddleware, wrapAsync(getOrderByIdController))

orderRouter.post('/:id/cancel', authMiddleware, wrapAsync(cancelOrderController))

orderRouter.post('/:id/rate', authMiddleware, wrapAsync(rateOrderController))

orderRouter.get('/:id/tracking', authMiddleware, wrapAsync(getOrderTrackingController))

// Restaurant owner order routes
orderRouter.patch(
  '/:id/status',
  authMiddleware,
  updateOrderStatusValidator,
  wrapAsync(updateOrderStatusController)
)

// Delivery person routes
orderRouter.post(
  '/:id/assign',
  authMiddleware,
  wrapAsync(assignDeliveryPersonController)
)

orderRouter.post(
  '/:id/delivery-location',
  authMiddleware,
  checkUserRole([UserRole.DeliveryPerson]),
  wrapAsync(updateDeliveryLocationController)
)

orderRouter.get(
  '/delivery/active',
  authMiddleware,
  checkUserRole([UserRole.DeliveryPerson]),
  wrapAsync(getActiveDeliveryOrdersController)
)

orderRouter.get(
  '/delivery/history',
  authMiddleware,
  checkUserRole([UserRole.DeliveryPerson]),
  wrapAsync(getDeliveryHistoryController)
)

// Admin routes
orderRouter.get('/search', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(searchOrdersController))

export default orderRouter
