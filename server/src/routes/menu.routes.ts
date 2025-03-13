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

const menuRouter = express.Router()

// Public routes
menuRouter.get('/restaurant/:restaurantId', wrapAsync(getRestaurantMenuController))
menuRouter.get('/popular/:restaurantId', wrapAsync(getPopularMenuItemsController))
menuRouter.get('/categories/:restaurantId', wrapAsync(getMenuCategoriesController))
menuRouter.get('/item/:id', wrapAsync(getMenuItemController))

// Protected routes - Restaurant owner only
menuRouter.post(
  '/item',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  menuItemValidator,
  wrapAsync(createMenuItemController)
)

menuRouter.put(
  '/item/:id',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  menuItemValidator,
  wrapAsync(updateMenuItemController)
)

menuRouter.delete(
  '/item/:id',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  wrapAsync(deleteMenuItemController)
)

menuRouter.patch(
  '/item/:id/availability',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  wrapAsync(updateMenuItemAvailabilityController)
)

menuRouter.post(
  '/item/:id/image',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  uploadImageMiddleware.single('image'),
  wrapAsync(uploadMenuItemImageController)
)

menuRouter.post(
  '/items/batch',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  wrapAsync(batchUpdateMenuItemsController)
)

// Menu category routes
menuRouter.post(
  '/category',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  menuCategoryValidator,
  wrapAsync(createMenuCategoryController)
)

menuRouter.put(
  '/category/:id',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  menuCategoryValidator,
  wrapAsync(updateMenuCategoryController)
)

menuRouter.delete(
  '/category/:id',
  authMiddleware,
  checkUserRole([UserRole.RestaurantOwner, UserRole.Admin]),
  wrapAsync(deleteMenuCategoryController)
)

export default menuRouter
function wrapAsync(
  getRestaurantMenuController: (req: express.Request, res: express.Response) => Promise<void>
): import('express-serve-static-core').RequestHandler<
  { restaurantId: string },
  any,
  any,
  import('qs').ParsedQs,
  Record<string, any>
> {
  throw new Error('Function not implemented.')
}
function checkUserRole(
  arg0: any[]
): import('express-serve-static-core').RequestHandler<
  { restaurantId: string },
  any,
  any,
  import('qs').ParsedQs,
  Record<string, any>
> {
  throw new Error('Function not implemented.')
}
