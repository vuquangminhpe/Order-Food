import { MongoClient, Db, Collection } from 'mongodb'
import Restaurant from '../models/schemas/Restaurant.schema'
import MenuItem, { MenuCategory } from '../models/schemas/Menu.schema'
import Order from '../models/schemas/Order.schema'
import DeliveryTracking from '../models/schemas/DeliveryTracking.schema'
import RefreshToken from '../models/schemas/RefreshToken.schema'
import User from '~/models/schemas/Users.schema'
import { envConfig } from '../constants/config'
import Rating from '../models/schemas/Rating.schema'
import Refund from '../models/schemas/Refund.schema'
import { config } from 'dotenv'
config()
const uri =
  'mongodb+srv://minhvqhe176726:minhvqhe176726@management-employee.31yis.mongodb.net/?retryWrites=true&w=majority&appName=management-employee'

class DatabaseService {
  private client: MongoClient
  private db: Db

  constructor() {
    this.client = new MongoClient(uri)
    this.db = this.client.db(envConfig.db_name)
  }

  async connect() {
    try {
      await this.db.command({ ping: 1 })
      console.log('Pinged your deployment. You successfully connected to MongoDB!')
      return true
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error)
      return error
    }
  }

  get users(): Collection<User> {
    return this.db.collection(envConfig.usersCollection)
  }

  get refreshTokens(): Collection<RefreshToken> {
    return this.db.collection(envConfig.refreshCollection)
  }

  get restaurants(): Collection<Restaurant> {
    return this.db.collection(envConfig.restaurantCollection)
  }

  get menuItems(): Collection<MenuItem> {
    return this.db.collection(envConfig.menuCollection)
  }

  get menuCategories(): Collection<MenuCategory> {
    return this.db.collection(envConfig.menuCategoryCollection)
  }

  get orders(): Collection<Order> {
    return this.db.collection(envConfig.orderCollection)
  }

  get deliveryTracking(): Collection<DeliveryTracking> {
    return this.db.collection(envConfig.deliveryTrackingCollection)
  }
  get ratings(): Collection<Rating> {
    return this.db.collection(envConfig.ratingCollection)
  }
  get refunds(): Collection<Refund> {
    return this.db.collection(envConfig.refundCollection)
  }

  async indexUsers() {
    await this.users.createIndex({ email: 1 }, { unique: true })
    await this.users.createIndex({ phone: 1 }, { unique: true })
    await this.users.createIndex({ role: 1 })
    await this.users.createIndex({ 'currentLocation.updatedAt': 1 }, { expireAfterSeconds: 86400 }) // 24 hours
  }

  async indexRestaurants() {
    await this.restaurants.createIndex({ ownerId: 1 })
    await this.restaurants.createIndex({ name: 1 })
    await this.restaurants.createIndex({ categories: 1 })
    await this.restaurants.createIndex({ 'location.lat': 1, 'location.lng': 1 }, { name: 'geospatial' })
  }

  async indexMenuItems() {
    await this.menuItems.createIndex({ restaurantId: 1 })
    await this.menuItems.createIndex({ categoryId: 1 })
    await this.menuItems.createIndex({ name: 'text', description: 'text' })
  }

  async indexOrders() {
    await this.orders.createIndex({ userId: 1 })
    await this.orders.createIndex({ restaurantId: 1 })
    await this.orders.createIndex({ deliveryPersonId: 1 })
    await this.orders.createIndex({ orderStatus: 1 })
    await this.orders.createIndex({ created_at: 1 })
  }
}

const databaseService = new DatabaseService()

export default databaseService
