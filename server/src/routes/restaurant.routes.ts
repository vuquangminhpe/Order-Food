import express from 'express'
import { authMiddleware } from '../middlewares/auth.middlewares'
import { restaurantValidator, updateRestaurantValidator } from '../middlewares/validation.middlewares'
import { uploadImageMiddleware } from '../middlewares/upload.middlewares'
import {
  createRestaurantController,
  getRestaurantByIdController,
  updateRestaurantController,
  deleteRestaurantController,
  getAllRestaurantsController,
  getNearbyRestaurantsController,
  getRestaurantsByCategoryController,
  getRestaurantMenuController,
  uploadRestaurantImagesController,
  getRestaurantRatingsController,
  getRestaurantOrdersController,
  getRestaurantRevenueController
} from '../controllers/restaurant.controller'
import { UserRole } from '../models/schemas/Users.schema'
import { checkUserRole } from '../middlewares/common.middlewares'
import { wrapAsync } from '../middlewares/error.middlewares'

const restaurantRouter = express.Router()

// Public routes
restaurantRouter.get('/', wrapAsync(getAllRestaurantsController))
restaurantRouter.get('/nearby', wrapAsync(getNearbyRestaurantsController))
restaurantRouter.get('/category/:category', wrapAsync(getRestaurantsByCategoryController))
restaurantRouter.get('/:id', wrapAsync(getRestaurantByIdController))
restaurantRouter.get('/:id/menu', wrapAsync(getRestaurantMenuController))
restaurantRouter.get('/:id/ratings', wrapAsync(getRestaurantRatingsController))

// Protected routes - Restaurant owner only
restaurantRouter.post('/', authMiddleware, restaurantValidator, wrapAsync(createRestaurantController))

restaurantRouter.put('/:id', authMiddleware, updateRestaurantValidator, wrapAsync(updateRestaurantController))

restaurantRouter.delete('/:id', authMiddleware, wrapAsync(deleteRestaurantController))

restaurantRouter.post(
  '/:id/images',
  authMiddleware,
  uploadImageMiddleware.array('images', 10),
  wrapAsync(uploadRestaurantImagesController)
)

// Restaurant analytics - restricted access
restaurantRouter.get('/:id/orders', authMiddleware, wrapAsync(getRestaurantOrdersController))

restaurantRouter.get('/:id/revenue', authMiddleware, wrapAsync(getRestaurantRevenueController))

export default restaurantRouter
