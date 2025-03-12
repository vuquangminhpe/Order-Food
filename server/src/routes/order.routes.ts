import express from 'express'
import { authMiddleware } from '../middlewares/auth.middlewares'
import { orderValidator, updateOrderStatusValidator } from '../middlewares/validation.middlewares'
import { wrapAsync } from '../utils/handlers'
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
import { checkUserRole } from '../middlewares/role.middlewares'
import { UserRole } from '../models/schemas/User.schema'

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
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  updateOrderStatusValidator,
  wrapAsync(updateOrderStatusController)
)

// Delivery person routes
orderRouter.post(
  '/:id/assign',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
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
