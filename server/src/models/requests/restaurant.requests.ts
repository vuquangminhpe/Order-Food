import { ObjectId } from 'mongodb'
import { RestaurantStatus } from '../schemas/Restaurant.schema'

export interface RestaurantFilterOptions {
  page: number
  limit: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  minRating?: number
  search?: string
}

export interface NearbyRestaurantOptions {
  lat: number
  lng: number
  radius: number
}

export interface CategoryFilterOptions {
  page: number
  limit: number
}

export interface RestaurantWithDistance {
  _id: ObjectId
  name: string
  description: string
  address: string
  location: {
    lat: number
    lng: number
  }
  coverImage: string
  logoImage: string
  categories: string[]
  rating: number
  totalRatings: number
  deliveryFee: number
  minOrderAmount: number
  estimatedDeliveryTime: number
  distance: number
}

export interface RestaurantsListResponse {
  restaurants: any[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface RestaurantDetailsResponse {
  _id: string
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
  owner?: {
    name: string
    email: string
    phone: string
  }
}

export interface RestaurantMenuResponse {
  restaurant_id: string
  menu: {
    category: {
      _id: string
      name: string
      description: string
      order: number
    }
    items: any[]
  }[]
}

export interface RestaurantRatingsResponse {
  ratings: {
    _id: string
    orderId: ObjectId
    userId: ObjectId
    restaurantId: ObjectId
    rating: number
    review: string
    foodRating: number
    deliveryRating: number
    created_at: Date
    user: {
      name: string
      avatar: string
    }
  }[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface RestaurantOrdersResponse {
  orders: any[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}

export interface RestaurantOrdersFilterOptions {
  page: number
  limit: number
  status?: number
  startDate?: Date
  endDate?: Date
}

export interface RestaurantRevenueResponse {
  period: 'daily' | 'monthly' | 'yearly'
  data: {
    _id: number
    totalOrders: number
    totalRevenue: number
    avgOrderValue: number
  }[]
}
