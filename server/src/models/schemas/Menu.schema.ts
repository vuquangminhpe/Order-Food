import { ObjectId } from 'mongodb'

interface MenuItemType {
  _id?: ObjectId
  restaurantId: ObjectId
  name: string
  description?: string
  price: number
  discountedPrice?: number
  image?: string
  categoryId: ObjectId
  options?: {
    title: string
    required: boolean
    multiple: boolean
    items: {
      name: string
      price: number
    }[]
  }[]
  isAvailable?: boolean
  popularity?: number
  created_at?: Date
  updated_at?: Date
}

export default class MenuItem {
  _id?: ObjectId
  restaurantId: ObjectId
  name: string
  description: string
  price: number
  discountedPrice: number
  image: string
  categoryId: ObjectId
  options: {
    title: string
    required: boolean
    multiple: boolean
    items: {
      name: string
      price: number
    }[]
  }[]
  isAvailable: boolean
  popularity: number
  created_at: Date
  updated_at: Date

  constructor(menuItem: MenuItemType) {
    const date = new Date()
    this._id = menuItem._id
    this.restaurantId = menuItem.restaurantId
    this.name = menuItem.name
    this.description = menuItem.description || ''
    this.price = menuItem.price
    this.discountedPrice = menuItem.discountedPrice || menuItem.price
    this.image = menuItem.image || ''
    this.categoryId = menuItem.categoryId
    this.options = menuItem.options || []
    this.isAvailable = menuItem.isAvailable !== undefined ? menuItem.isAvailable : true
    this.popularity = menuItem.popularity || 0
    this.created_at = menuItem.created_at || date
    this.updated_at = menuItem.updated_at || date
  }
}

interface MenuCategoryType {
  _id?: ObjectId
  restaurantId: ObjectId
  name: string
  description?: string
  order?: number
  created_at?: Date
  updated_at?: Date
}

export class MenuCategory {
  _id?: ObjectId
  restaurantId: ObjectId
  name: string
  description: string
  order: number
  created_at: Date
  updated_at: Date

  constructor(category: MenuCategoryType) {
    const date = new Date()
    this._id = category._id
    this.restaurantId = category.restaurantId
    this.name = category.name
    this.description = category.description || ''
    this.order = category.order || 0
    this.created_at = category.created_at || date
    this.updated_at = category.updated_at || date
  }
}
