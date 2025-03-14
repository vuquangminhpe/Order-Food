import { Router } from 'express'
import { refundValidator } from '../middlewares/validation.middlewares'
import { wrapAsync } from '../middlewares/error.middlewares'

import { checkUserRole } from '~/middlewares/common.middlewares'
import { UserRole } from '~/models/schemas/Users.schema'
import { authMiddleware } from '~/middlewares/auth.middlewares'
import { approveRejectRefundValidator } from '~/middlewares/refund.middlewares'
import {
  approveRefundController,
  createRefundController,
  getAllRefundsController,
  getRefundController,
  getRefundsByOrderController,
  getUserRefundsController,
  processRefundController,
  rejectRefundController
} from '~/controllers/refund.controller'

const refundRouter = Router()

refundRouter.post('/', authMiddleware, refundValidator, wrapAsync(createRefundController))

refundRouter.get('/:id', authMiddleware, wrapAsync(getRefundController))

refundRouter.get('/order/:orderId', authMiddleware, wrapAsync(getRefundsByOrderController))

refundRouter.get('/user/history', authMiddleware, wrapAsync(getUserRefundsController))

refundRouter.get('/admin/all', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(getAllRefundsController))

refundRouter.post(
  '/:id/approve',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  approveRejectRefundValidator,
  wrapAsync(approveRefundController)
)

refundRouter.post(
  '/:id/reject',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  approveRejectRefundValidator,
  wrapAsync(rejectRefundController)
)

refundRouter.post('/:id/process', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(processRefundController))

export default refundRouter
