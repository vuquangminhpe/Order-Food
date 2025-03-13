import { ObjectId } from 'mongodb'
import { InsertOneResult, UpdateResult, DeleteResult } from 'mongodb'
import Restaurant, { RestaurantStatus } from '../models/schemas/Restaurant.schema'
import databaseService from './database.services'
import { RestaurantReqBody, UpdateRestaurantReqBody } from '~/models/requests/auth.requests'

class RestaurantService {
  // Create a new restaurant
  async createRestaurant(restaurantData: RestaurantReqBody): Promise<InsertOneResult<Restaurant>> {
    const restaurant = new Restaurant({
      ...restaurantData,
      ownerId: new ObjectId(restaurantData.ownerId)
    })

    return databaseService.restaurants.insertOne(restaurant)
  }

  // Get restaurant by ID
  async getRestaurantById(id: string): Promise<Restaurant | null> {
    return databaseService.restaurants.findOne({ _id: new ObjectId(id) })
  }

  // Update restaurant
  async updateRestaurant(id: string, updateData: Partial<UpdateRestaurantReqBody>): Promise<UpdateResult> {
    const updateObj: any = {}

    // Handle normal fields
    if (updateData.name) updateObj.name = updateData.name
    if (updateData.description !== undefined) updateObj.description = updateData.description
    if (updateData.address) updateObj.address = updateData.address
    if (updateData.location) updateObj.location = updateData.location
    if (updateData.categories) updateObj.categories = updateData.categories
    if (updateData.openingHours) updateObj.openingHours = updateData.openingHours
    if (updateData.status !== undefined) updateObj.status = updateData.status
    if (updateData.deliveryFee !== undefined) updateObj.deliveryFee = updateData.deliveryFee
    if (updateData.minOrderAmount !== undefined) updateObj.minOrderAmount = updateData.minOrderAmount
    if (updateData.estimatedDeliveryTime !== undefined)
      updateObj.estimatedDeliveryTime = updateData.estimatedDeliveryTime
    if (updateData.phoneNumber) updateObj.phoneNumber = updateData.phoneNumber

    // Always update timestamp
    updateObj.updated_at = new Date()

    return databaseService.restaurants.updateOne({ _id: new ObjectId(id) }, { $set: updateObj })
  }

  // Delete restaurant
  async deleteRestaurant(id: string): Promise<DeleteResult> {
    return databaseService.restaurants.deleteOne({ _id: new ObjectId(id) })
  }

  // Get all restaurants with pagination and filtering
  async getAllRestaurants({
    page = 1,
    limit = 10,
    sortBy = 'rating',
    sortOrder = 'desc',
    minRating,
    search
  }: {
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
    minRating?: number
    search?: string
  }) {
    const query: any = { status: RestaurantStatus.Approved }

    // Filter by rating
    if (minRating !== undefined) {
      query.rating = { $gte: minRating }
    }

    // Search by name or categories
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categories: { $regex: search, $options: 'i' } }
      ]
    }

    // Count total matching documents
    const total = await databaseService.restaurants.countDocuments(query)

    // Get paginated results
    const skip = (page - 1) * limit

    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const restaurants = await databaseService.restaurants.find(query).sort(sort).skip(skip).limit(limit).toArray()

    return {
      restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get restaurants near a specific location
  async getNearbyRestaurants({
    lat,
    lng,
    radius = 5 // radius in kilometers
  }: {
    lat: number
    lng: number
    radius: number
  }) {
    const EARTH_RADIUS = 6371 // Earth's radius in kilometers

    // Convert radius to radians
    const radians = radius / EARTH_RADIUS

    // Query for nearby restaurants
    const restaurants = await databaseService.restaurants
      .find({
        status: RestaurantStatus.Approved,
        'location.lat': { $gte: lat - radians, $lte: lat + radians },
        'location.lng': { $gte: lng - radians, $lte: lng + radians }
      })
      .toArray()

    // Filter results by actual distance
    const nearbyRestaurants = restaurants.filter((restaurant: any) => {
      const distance = this.calculateDistance(lat, lng, restaurant.location.lat, restaurant.location.lng)

      // Attach distance to restaurant object
      restaurant.distance = parseFloat(distance.toFixed(2))

      return distance <= radius
    })

    // Sort by distance
    nearbyRestaurants.sort((a: any, b: any) => a.distance - b.distance)

    return nearbyRestaurants
  }

  // Get restaurants by category
  async getRestaurantsByCategory(category: string, { page = 1, limit = 10 }: { page: number; limit: number }) {
    const query = {
      categories: { $regex: category, $options: 'i' },
      status: RestaurantStatus.Approved
    }

    // Count total matching documents
    const total = await databaseService.restaurants.countDocuments(query)

    // Get paginated results
    const skip = (page - 1) * limit

    const restaurants = await databaseService.restaurants
      .find(query)
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      restaurants,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get restaurant menu
  async getRestaurantMenu(restaurantId: string) {
    // Get all categories for this restaurant
    const categories = await databaseService.menuCategories
      .find({ restaurantId: new ObjectId(restaurantId) })
      .sort({ order: 1 })
      .toArray()

    // Get all menu items for this restaurant
    const menuItems = await databaseService.menuItems.find({ restaurantId: new ObjectId(restaurantId) }).toArray()

    // Group menu items by category
    const menuByCategory = categories.map((category) => {
      const items = menuItems.filter((item) => item.categoryId.toString() === category._id!.toString())

      return {
        category,
        items
      }
    })

    return menuByCategory
  }

  // Get restaurant ratings
  async getRestaurantRatings(restaurantId: string, { page = 1, limit = 10 }: { page: number; limit: number }) {
    const query = { restaurantId: new ObjectId(restaurantId) }

    // Count total ratings
    const total = await databaseService.ratings.countDocuments(query)

    // Get paginated ratings
    const skip = (page - 1) * limit

    const ratings = await databaseService.ratings.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray()

    // Get user details for each rating
    const ratingsWithUserDetails = await Promise.all(
      ratings.map(async (rating) => {
        const user = await databaseService.users.findOne({ _id: rating.userId }, { projection: { name: 1, avatar: 1 } })

        return {
          ...rating,
          user: {
            name: user?.name || 'Anonymous',
            avatar: user?.avatar || ''
          }
        }
      })
    )

    return {
      ratings: ratingsWithUserDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Get restaurant orders
  async getRestaurantOrders(
    restaurantId: string,
    {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate
    }: {
      page: number
      limit: number
      status?: number
      startDate?: Date
      endDate?: Date
    }
  ) {
    const query: any = { restaurantId: new ObjectId(restaurantId) }

    // Filter by status
    if (status !== undefined) {
      query.orderStatus = status
    }

    // Filter by date range
    if (startDate || endDate) {
      query.created_at = {}

      if (startDate) {
        query.created_at.$gte = startDate
      }

      if (endDate) {
        query.created_at.$lte = endDate
      }
    }

    // Count total matching orders
    const total = await databaseService.orders.countDocuments(query)

    // Get paginated orders
    const skip = (page - 1) * limit

    const orders = await databaseService.orders.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray()

    // Get additional information for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const user = await databaseService.users.findOne({ _id: order.userId }, { projection: { name: 1, phone: 1 } })

        let deliveryPerson = null
        if (order.deliveryPersonId) {
          deliveryPerson = await databaseService.users.findOne(
            { _id: order.deliveryPersonId },
            { projection: { name: 1, phone: 1 } }
          )
        }

        return {
          ...order,
          user: {
            name: user?.name,
            phone: user?.phone
          },
          deliveryPerson: deliveryPerson
            ? {
                name: deliveryPerson.name,
                phone: deliveryPerson.phone
              }
            : null
        }
      })
    )

    return {
      orders: ordersWithDetails,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS = 6371

    const dLat = this.degToRad(lat2 - lat1)
    const dLng = this.degToRad(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = EARTH_RADIUS * c

    return distance
  }

  private degToRad(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}

const restaurantService = new RestaurantService()

export default restaurantService
