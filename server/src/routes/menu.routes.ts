import express from 'express'

import {
  createMenuItemController,
  getMenuItemController,
  updateMenuItemController,
  deleteMenuItemController,
  createMenuCategoryController,
  getMenuCategoriesController,
  updateMenuCategoryController,
  deleteMenuCategoryController,
  uploadMenuItemImageController,
  getRestaurantMenuController,
  updateMenuItemAvailabilityController,
  batchUpdateMenuItemsController,
  getPopularMenuItemsController
} from '../controllers/menu.controller'
import { menuCategoryValidator, menuItemValidator } from '../middlewares/validation.middlewares'
import { UserRole } from '../models/schemas/Users.schema'
import { wrapAsync } from '../middlewares/error.middlewares'
import { checkUserRole } from '../middlewares/common.middlewares'
import { authMiddleware } from '../middlewares/auth.middlewares'
import { uploadImageMiddleware } from '../middlewares/upload.middlewares'

const menuRouter = express.Router()

// Public routes
menuRouter.get('/restaurant/:restaurantId', wrapAsync(getRestaurantMenuController))
menuRouter.get('/popular/:restaurantId', wrapAsync(getPopularMenuItemsController))
menuRouter.get('/categories/:restaurantId', wrapAsync(getMenuCategoriesController))
menuRouter.get('/item/:id', wrapAsync(getMenuItemController))

// Protected routes - Restaurant owner only
menuRouter.post('/item', authMiddleware, menuItemValidator, wrapAsync(createMenuItemController))

menuRouter.put('/item/:id', authMiddleware, menuItemValidator, wrapAsync(updateMenuItemController))

menuRouter.delete('/item/:id', authMiddleware, wrapAsync(deleteMenuItemController))

menuRouter.patch('/item/:id/availability', authMiddleware, wrapAsync(updateMenuItemAvailabilityController))

menuRouter.post(
  '/item/:id/image',
  authMiddleware,
  uploadImageMiddleware.single('image'),
  wrapAsync(uploadMenuItemImageController)
)

menuRouter.post('/items/batch', authMiddleware, wrapAsync(batchUpdateMenuItemsController))

// Menu category routes
menuRouter.post('/category', authMiddleware, menuCategoryValidator, wrapAsync(createMenuCategoryController))

menuRouter.put('/category/:id', authMiddleware, menuCategoryValidator, wrapAsync(updateMenuCategoryController))

menuRouter.delete('/category/:id', authMiddleware, wrapAsync(deleteMenuCategoryController))

export default menuRouter
