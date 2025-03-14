import express from 'express'
import { authMiddleware } from '../middlewares/auth.middlewares'

import { uploadImageMiddleware, handleUploadError } from '../middlewares/upload.middlewares'
import { wrapAsync } from '../middlewares/error.middlewares'

import {
  getUserProfileController,
  updateProfileController,
  changePasswordController,
  uploadAvatarController,
  addAddressController,
  updateAddressController,
  deleteAddressController,
  getAddressesController,
  updateLocationController,
  updateDeliveryStatusController,
  getUsersController,
  getUserByIdController,
  banUserController,
  unbanUserController,
  getRestaurantOwnersController,
  getDeliveryPersonnelController,
  getNearbyDeliveryPersonnelController
} from '../controllers/user.controller'
import {
  addAddressValidator,
  changePasswordValidator,
  updateAddressValidator,
  updateDeliveryStatusValidator,
  updateLocationValidator,
  updateProfileValidator
} from '~/middlewares/users.middlewares'
import { checkUserRole } from '~/middlewares/common.middlewares'
import { UserRole } from '~/models/schemas/Users.schema'

const userRouter = express.Router()

// Profile routes
userRouter.get('/profile', authMiddleware, wrapAsync(getUserProfileController))

userRouter.put('/profile', authMiddleware, updateProfileValidator, wrapAsync(updateProfileController))

userRouter.put('/change-password', authMiddleware, changePasswordValidator, wrapAsync(changePasswordController))

userRouter.post('/avatar', authMiddleware, uploadImageMiddleware.single('avatar'), wrapAsync(uploadAvatarController))

// Address routes
userRouter.get('/addresses', authMiddleware, wrapAsync(getAddressesController))

userRouter.post('/addresses', authMiddleware, addAddressValidator, wrapAsync(addAddressController))

userRouter.put('/addresses/:index', authMiddleware, updateAddressValidator, wrapAsync(updateAddressController))

userRouter.delete('/addresses/:index', authMiddleware, wrapAsync(deleteAddressController))

// Delivery person routes
userRouter.put(
  '/delivery/status',
  authMiddleware,
  checkUserRole([UserRole.DeliveryPerson]),
  updateDeliveryStatusValidator,
  wrapAsync(updateDeliveryStatusController)
)

userRouter.put(
  '/location',
  authMiddleware,
  checkUserRole([UserRole.DeliveryPerson]),
  updateLocationValidator,
  wrapAsync(updateLocationController)
)

// Get nearby delivery personnel
userRouter.get(
  '/delivery/nearby',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  wrapAsync(getNearbyDeliveryPersonnelController)
)

// Admin routes
userRouter.get('/admin/all', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(getUsersController))

userRouter.get('/admin/:id', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(getUserByIdController))

userRouter.post('/admin/ban/:id', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(banUserController))

userRouter.post('/admin/unban/:id', authMiddleware, checkUserRole([UserRole.Admin]), wrapAsync(unbanUserController))

userRouter.get(
  '/admin/restaurant-owners',
  authMiddleware,
  checkUserRole([UserRole.Admin]),
  wrapAsync(getRestaurantOwnersController)
)

userRouter.get(
  '/admin/delivery-personnel',
  authMiddleware,
  checkUserRole([UserRole.Admin]),
  wrapAsync(getDeliveryPersonnelController)
)

export default userRouter
