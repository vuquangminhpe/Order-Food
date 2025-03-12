import { ObjectId } from 'mongodb'

enum RestaurantStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
  Closed = 3
}

interface RestaurantType {
  _id?: ObjectId
  ownerId: ObjectId
  name: string
  description?: string
  address: string
  location: {
    lat: number
    lng: number
  }
  coverImage?: string
  logoImage?: string
  images?: string[]
  categories?: string[]
  openingHours: {
    day: number 
    open: string 
    close: string 
    isClosed: boolean
  }[]
  status?: RestaurantStatus
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  rating?: number
  totalRatings?: number
  phoneNumber?: string
  created_at?: Date
  updated_at?: Date
}

export default class Restaurant {
  _id?: ObjectId
  ownerId: ObjectId
  name: string
  description: string
  address: string
  location: {
    lat: number
    lng: number
  }
  coverImage: string
  logoImage: string
  images: string[]
  categories: string[]
  openingHours: {
    day: number  
    open: string 
    close: string 
    isClosed: boolean
  }[]
  status: RestaurantStatus
  deliveryFee: number
  minOrderAmount: number
  estimatedDeliveryTime: number
  rating: number
  totalRatings: number
  phoneNumber: string
  created_at: Date
  updated_at: Date

  constructor(restaurant: RestaurantType) {
    const date = new Date()
    this._id = restaurant._id
    this.ownerId = restaurant.ownerId
    this.name = restaurant.name
    this.description = restaurant.description || ''
    this.address = restaurant.address
    this.location = restaurant.location
    this.coverImage = restaurant.coverImage || ''
    this.logoImage = restaurant.logoImage || ''
    this.images = restaurant.images || []
    this.categories = restaurant.categories || []
    this.openingHours = restaurant.openingHours
    this.status = restaurant.status || RestaurantStatus.Pending
    this.deliveryFee = restaurant.deliveryFee || 0
    this.minOrderAmount = restaurant.minOrderAmount || 0
    this.estimatedDeliveryTime = restaurant.estimatedDeliveryTime || 30
    this.rating = restaurant.rating || 0
    this.totalRatings = restaurant.totalRatings || 0
    this.phoneNumber = restaurant.phoneNumber || ''
    this.created_at = restaurant.created_at || date
    this.updated_at = restaurant.updated_at || date
  }
}

export { RestaurantStatus }