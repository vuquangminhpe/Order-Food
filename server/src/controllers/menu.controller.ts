import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'
import { MENU_MESSAGES } from '../constants/messages'
import databaseService from '../services/database.services'
import MenuItem, { MenuCategory } from '../models/schemas/Menu.schema'
import path from 'path'
import fs from 'fs'
import restaurantService from '~/services/restaurant.services'
import menuService from '~/services/menu.services'
import { deleteFileFromS3, uploadFileS3 } from '~/utils/s3'
import { TokenPayload } from '~/constants/enums'
import { MenuCategoryReqBody, MenuItemReqBody } from '~/models/requests/auth.requests'

// Create a new menu item
export const createMenuItemController = async (req: Request<ParamsDictionary, any, MenuItemReqBody>, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const menuItemData = req.body

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(menuItemData.restaurantId as string)

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_CREATE
    })
  }

  // Check if category exists
  const category = await databaseService.menuCategories.findOne({
    _id: new ObjectId(menuItemData.categoryId),
    restaurantId: new ObjectId(menuItemData.restaurantId)
  })

  if (!category) {
    return res.status(404).json({
      message: MENU_MESSAGES.CATEGORY_NOT_FOUND
    })
  }

  // Create menu item
  const result = await menuService.createMenuItem(menuItemData)

  res.status(201).json({
    message: MENU_MESSAGES.CREATE_ITEM_SUCCESS,
    result: {
      menu_item_id: result.insertedId.toString()
    }
  })
}

// Get a menu item by ID
export const getMenuItemController = async (req: Request, res: Response) => {
  const { id } = req.params

  const menuItem = await menuService.getMenuItemById(id)

  if (!menuItem) {
    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  res.status(200).json({
    message: MENU_MESSAGES.GET_ITEM_SUCCESS,
    result: menuItem
  })
}

// Update a menu item
export const updateMenuItemController = async (
  req: Request<ParamsDictionary & { id: string }, any, Partial<MenuItemReqBody>>,
  res: Response
) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as TokenPayload
  const updateData = req.body

  // Get the menu item
  const menuItem = await menuService.getMenuItemById(id)

  if (!menuItem) {
    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(menuItem.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  // If changing category, check if it exists
  if (updateData.categoryId) {
    const category = await databaseService.menuCategories.findOne({
      _id: new ObjectId(updateData.categoryId),
      restaurantId: menuItem.restaurantId
    })

    if (!category) {
      return res.status(404).json({
        message: MENU_MESSAGES.CATEGORY_NOT_FOUND
      })
    }
  }

  // Update menu item
  const result = await menuService.updateMenuItem(id, updateData)

  res.status(200).json({
    message: MENU_MESSAGES.UPDATE_ITEM_SUCCESS,
    result
  })
}

// Delete a menu item
export const deleteMenuItemController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }

  // Get the menu item
  const menuItem = await menuService.getMenuItemById(id)

  if (!menuItem) {
    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(menuItem.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_DELETE
    })
  }

  if (menuItem.image) {
    await deleteFileFromS3(menuItem.image)
  }

  // Delete menu item
  const result = await menuService.deleteMenuItem(id)

  res.status(200).json({
    message: MENU_MESSAGES.DELETE_ITEM_SUCCESS,
    result
  })
}

export const uploadMenuItemImageController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const file = (req as any).file

  if (!file) {
    return res.status(400).json({
      message: MENU_MESSAGES.NO_IMAGE_UPLOADED
    })
  }

  // Get the menu item
  const menuItem = await menuService.getMenuItemById(id)

  if (!menuItem) {
    // Clean up uploaded file
    fs.unlinkSync(file.path)

    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(menuItem.restaurantId.toString())

  if (!restaurant) {
    // Clean up uploaded file
    fs.unlinkSync(file.path)

    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    // Clean up uploaded file
    fs.unlinkSync(file.path)

    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  try {
    // Delete old image if exists
    if (menuItem.image) {
      await deleteFileFromS3(menuItem.image)
    }

    // Upload new image to S3
    const filename = `menu-items/${id}/${Date.now()}-${path.basename(file.path)}`

    await uploadFileS3({
      filename,
      filePath: file.path,
      contentType: file.mimetype
    })

    // Construct S3 URL
    const fileUrl = `https://${process.env.Bucket_Name}.s3.${process.env.region}.amazonaws.com/${filename}`

    // Update menu item with image URL
    await menuService.updateMenuItem(id, { image: fileUrl })

    // Clean up uploaded file
    fs.unlinkSync(file.path)

    res.status(200).json({
      message: MENU_MESSAGES.UPLOAD_IMAGE_SUCCESS,
      result: {
        image_url: fileUrl
      }
    })
  } catch (error) {
    // Clean up uploaded file
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }

    throw error
  }
}

// Create a new menu category
export const createMenuCategoryController = async (
  req: Request<ParamsDictionary, any, MenuCategoryReqBody>,
  res: Response
) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const categoryData = req.body

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(categoryData.restaurantId as string)

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_CREATE
    })
  }

  // Create category
  const result = await menuService.createMenuCategory(categoryData)

  res.status(201).json({
    message: MENU_MESSAGES.CREATE_CATEGORY_SUCCESS,
    result: {
      category_id: result.insertedId.toString()
    }
  })
}

// Get all menu categories for a restaurant
export const getMenuCategoriesController = async (req: Request, res: Response) => {
  const { restaurantId } = req.params

  const categories = await menuService.getMenuCategories(restaurantId)

  res.status(200).json({
    message: MENU_MESSAGES.GET_CATEGORIES_SUCCESS,
    result: categories
  })
}

// Update a menu category
export const updateMenuCategoryController = async (
  req: Request<ParamsDictionary & { id: string }, any, Partial<MenuCategoryReqBody>>,
  res: Response
) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const updateData = req.body

  // Get the category
  const category = await databaseService.menuCategories.findOne({
    _id: new ObjectId(id)
  })

  if (!category) {
    return res.status(404).json({
      message: MENU_MESSAGES.CATEGORY_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(category.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  // Update category
  const result = await menuService.updateMenuCategory(id, updateData)

  res.status(200).json({
    message: MENU_MESSAGES.UPDATE_CATEGORY_SUCCESS,
    result
  })
}

// Delete a menu category
export const deleteMenuCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }

  // Get the category
  const category = await databaseService.menuCategories.findOne({
    _id: new ObjectId(id)
  })

  if (!category) {
    return res.status(404).json({
      message: MENU_MESSAGES.CATEGORY_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(category.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_DELETE
    })
  }

  // Check if category has menu items
  const menuItems = await databaseService.menuItems.countDocuments({
    categoryId: new ObjectId(id)
  })

  if (menuItems > 0) {
    return res.status(400).json({
      message: MENU_MESSAGES.CATEGORY_HAS_ITEMS,
      itemCount: menuItems
    })
  }

  // Delete category
  const result = await menuService.deleteMenuCategory(id)

  res.status(200).json({
    message: MENU_MESSAGES.DELETE_CATEGORY_SUCCESS,
    result
  })
}

// Get a restaurant's complete menu
export const getRestaurantMenuController = async (req: Request, res: Response) => {
  const { restaurantId } = req.params

  // Get all categories
  const categories = await menuService.getMenuCategories(restaurantId)

  // Get all menu items
  const menuItems = await databaseService.menuItems
    .find({
      restaurantId: new ObjectId(restaurantId)
    })
    .toArray()

  // Group menu items by category
  const menuByCategory = categories.map((category) => {
    const items = menuItems.filter((item) => item.categoryId.toString() === category._id!.toString())

    return {
      category,
      items
    }
  })

  res.status(200).json({
    message: MENU_MESSAGES.GET_MENU_SUCCESS,
    result: {
      restaurant_id: restaurantId,
      menu: menuByCategory
    }
  })
}

// Update menu item availability
export const updateMenuItemAvailabilityController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decode_authorization as { user_id: string }
  const { isAvailable } = req.body

  if (isAvailable === undefined) {
    return res.status(400).json({
      message: MENU_MESSAGES.AVAILABILITY_REQUIRED
    })
  }

  // Get the menu item
  const menuItem = await menuService.getMenuItemById(id)

  if (!menuItem) {
    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(menuItem.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  // Update availability
  const result = await menuService.updateMenuItem(id, { isAvailable })

  res.status(200).json({
    message: MENU_MESSAGES.UPDATE_AVAILABILITY_SUCCESS,
    result
  })
}

// Batch update menu items
export const batchUpdateMenuItemsController = async (req: Request, res: Response) => {
  const { user_id } = req.decode_authorization as { user_id: string }
  const { items } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: MENU_MESSAGES.INVALID_BATCH_UPDATE
    })
  }

  // Get first item to check restaurant ownership
  const firstItemId = items[0].id
  const firstItem = await menuService.getMenuItemById(firstItemId)

  if (!firstItem) {
    return res.status(404).json({
      message: MENU_MESSAGES.ITEM_NOT_FOUND
    })
  }

  // Check if user owns the restaurant
  const restaurant = await restaurantService.getRestaurantById(firstItem.restaurantId.toString())

  if (!restaurant) {
    return res.status(404).json({
      message: MENU_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: MENU_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  // Process batch updates
  const results = []

  for (const item of items) {
    try {
      // Verify this item belongs to the same restaurant
      const menuItem = await menuService.getMenuItemById(item.id)

      if (!menuItem || menuItem.restaurantId.toString() !== firstItem.restaurantId.toString()) {
        results.push({
          id: item.id,
          success: false,
          message: MENU_MESSAGES.ITEM_NOT_FOUND_OR_DIFFERENT_RESTAURANT
        })
        continue
      }

      // Update the item
      const result = await menuService.updateMenuItem(item.id, item.updates)

      results.push({
        id: item.id,
        success: true
      })
    } catch (error: any) {
      results.push({
        id: item.id,
        success: false,
        message: error.message
      })
    }
  }

  res.status(200).json({
    message: MENU_MESSAGES.BATCH_UPDATE_SUCCESS,
    result: results
  })
}

// Get popular menu items
export const getPopularMenuItemsController = async (req: Request, res: Response) => {
  const { restaurantId } = req.params
  const { limit = 10 } = req.query

  // Get menu items sorted by popularity
  const menuItems = await databaseService.menuItems
    .find({
      restaurantId: new ObjectId(restaurantId),
      isAvailable: true
    })
    .sort({ popularity: -1 })
    .limit(Number(limit))
    .toArray()

  res.status(200).json({
    message: MENU_MESSAGES.GET_POPULAR_ITEMS_SUCCESS,
    result: menuItems
  })
}
