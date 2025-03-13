import { ObjectId } from 'mongodb'
import { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb'
import MenuItem, { MenuCategory } from '../models/schemas/Menu.schema'
import databaseService from './database.services'
import { MenuItemReqBody, MenuCategoryReqBody } from '../models/requests/menu.requests'

class MenuService {
  // Create a new menu item
  async createMenuItem(menuItemData: MenuItemReqBody): Promise<InsertOneResult<MenuItem>> {
    const menuItem = new MenuItem({
      ...menuItemData,
      restaurantId: new ObjectId(menuItemData.restaurantId),
      categoryId: new ObjectId(menuItemData.categoryId)
    })

    return databaseService.menuItems.insertOne(menuItem)
  }

  // Get menu item by ID
  async getMenuItemById(id: string): Promise<MenuItem | null> {
    return databaseService.menuItems.findOne({ _id: new ObjectId(id) })
  }

  // Update menu item
  async updateMenuItem(id: string, updateData: Partial<MenuItemReqBody>): Promise<UpdateResult> {
    const updateObj: any = {}

    // Handle normal fields
    if (updateData.name) updateObj.name = updateData.name
    if (updateData.description !== undefined) updateObj.description = updateData.description
    if (updateData.price !== undefined) updateObj.price = updateData.price
    if (updateData.discountedPrice !== undefined) updateObj.discountedPrice = updateData.discountedPrice
    if (updateData.image !== undefined) updateObj.image = updateData.image
    if (updateData.options !== undefined) updateObj.options = updateData.options
    if (updateData.isAvailable !== undefined) updateObj.isAvailable = updateData.isAvailable

    // Handle category change
    if (updateData.categoryId) {
      updateObj.categoryId = new ObjectId(updateData.categoryId)
    }

    // Always update timestamp
    updateObj.updated_at = new Date()

    return databaseService.menuItems.updateOne({ _id: new ObjectId(id) }, { $set: updateObj })
  }

  // Delete menu item
  async deleteMenuItem(id: string): Promise<DeleteResult> {
    return databaseService.menuItems.deleteOne({ _id: new ObjectId(id) })
  }

  // Create a new menu category
  async createMenuCategory(categoryData: MenuCategoryReqBody): Promise<InsertOneResult<MenuCategory>> {
    // Find highest order value for this restaurant
    const highestOrderCategory = await databaseService.menuCategories
      .find({ restaurantId: new ObjectId(categoryData.restaurantId) })
      .sort({ order: -1 })
      .limit(1)
      .toArray()

    const nextOrder = highestOrderCategory.length > 0 ? highestOrderCategory[0].order + 1 : 0

    const category = new MenuCategory({
      ...categoryData,
      restaurantId: new ObjectId(categoryData.restaurantId),
      order: categoryData.order !== undefined ? categoryData.order : nextOrder
    })

    return databaseService.menuCategories.insertOne(category)
  }

  // Get all menu categories for a restaurant
  async getMenuCategories(restaurantId: string): Promise<MenuCategory[]> {
    return databaseService.menuCategories
      .find({ restaurantId: new ObjectId(restaurantId) })
      .sort({ order: 1 })
      .toArray()
  }

  // Update menu category
  async updateMenuCategory(id: string, updateData: Partial<MenuCategoryReqBody>): Promise<UpdateResult> {
    const updateObj: any = {}

    // Handle normal fields
    if (updateData.name) updateObj.name = updateData.name
    if (updateData.description !== undefined) updateObj.description = updateData.description
    if (updateData.order !== undefined) updateObj.order = updateData.order

    // Always update timestamp
    updateObj.updated_at = new Date()

    return databaseService.menuCategories.updateOne({ _id: new ObjectId(id) }, { $set: updateObj })
  }

  // Delete menu category
  async deleteMenuCategory(id: string): Promise<DeleteResult> {
    return databaseService.menuCategories.deleteOne({ _id: new ObjectId(id) })
  }

  // Get menu items by category
  async getMenuItemsByCategory(categoryId: string): Promise<MenuItem[]> {
    return databaseService.menuItems
      .find({ categoryId: new ObjectId(categoryId) })
      .sort({ name: 1 })
      .toArray()
  }

  // Get popular menu items for a restaurant
  async getPopularMenuItems(restaurantId: string, limit: number = 10): Promise<MenuItem[]> {
    return databaseService.menuItems
      .find({
        restaurantId: new ObjectId(restaurantId),
        isAvailable: true
      })
      .sort({ popularity: -1 })
      .limit(limit)
      .toArray()
  }

  // Search menu items by name or description
  async searchMenuItems(
    restaurantId: string,
    searchQuery: string,
    { limit = 10 }: { limit: number }
  ): Promise<MenuItem[]> {
    // Create text index if not exists
    const indexes = await databaseService.menuItems.indexes()
    const hasTextIndex = indexes.some((index) => index.name === 'name_description_text')

    if (!hasTextIndex) {
      await databaseService.menuItems.createIndex(
        { name: 'text', description: 'text' },
        { name: 'name_description_text' }
      )
    }

    return databaseService.menuItems
      .find({
        restaurantId: new ObjectId(restaurantId),
        $text: { $search: searchQuery }
      })
      .sort({ score: { $meta: 'textScore' } })
      .limit(limit)
      .toArray()
  }

  // Update menu item popularity
  async updateMenuItemPopularity(id: string, increment: number = 1): Promise<UpdateResult> {
    return databaseService.menuItems.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { popularity: increment },
        $set: { updated_at: new Date() }
      }
    )
  }

  // Reorder menu categories
  async reorderCategories(restaurantId: string, categoryOrder: string[]): Promise<boolean> {
    const bulkOps = categoryOrder.map((categoryId, index) => ({
      updateOne: {
        filter: {
          _id: new ObjectId(categoryId),
          restaurantId: new ObjectId(restaurantId)
        },
        update: {
          $set: { order: index, updated_at: new Date() }
        }
      }
    }))

    const result = await databaseService.menuCategories.bulkWrite(bulkOps)

    return result.modifiedCount === categoryOrder.length
  }

  // Duplicate menu item
  async duplicateMenuItem(id: string, newName?: string): Promise<InsertOneResult<MenuItem>> {
    const sourceItem = await this.getMenuItemById(id)

    if (!sourceItem) {
      throw new Error('Menu item not found')
    }

    // Create a new object without _id
    const { _id, created_at, updated_at, popularity, ...itemData } = sourceItem

    const newItem = new MenuItem({
      ...itemData,
      name: newName || `${sourceItem.name} (Copy)`,
      popularity: 0,
      created_at: new Date(),
      updated_at: new Date()
    })

    return databaseService.menuItems.insertOne(newItem)
  }

  // Batch update menu item availability
  async batchUpdateAvailability(
    restaurantId: string,
    categoryId: string | null,
    isAvailable: boolean
  ): Promise<number> {
    const query: any = {
      restaurantId: new ObjectId(restaurantId)
    }

    if (categoryId) {
      query.categoryId = new ObjectId(categoryId)
    }

    const result = await databaseService.menuItems.updateMany(query, {
      $set: {
        isAvailable,
        updated_at: new Date()
      }
    })

    return result.modifiedCount
  }
}

const menuService = new MenuService()

export default menuService
