import { MongoClient, Db, Collection } from 'mongodb'
import Restaurant from '../models/schemas/Restaurant.schema'
import MenuItem, { MenuCategory } from '../models/schemas/Menu.schema'
import Order from '../models/schemas/Order.schema'
import DeliveryTracking from '../models/schemas/DeliveryTracking.schema'
import RefreshToken from '../models/schemas/RefreshToken.schema'
import User from '../models/schemas/Users.schema'
import Rating from '../models/schemas/Rating.schema'
import Refund from '../models/schemas/Refund.schema'

// Hardcode collection names để tránh phụ thuộc vào envConfig
const COLLECTIONS = {
  users: 'users',
  refreshTokens: 'refresh_tokens',
  restaurants: 'restaurants',
  menuItems: 'menu_items',
  menuCategories: 'menu_categories',
  orders: 'orders',
  deliveryTracking: 'delivery_tracking',
  ratings: 'ratings',
  refunds: 'refunds'
}

// URI MongoDB với database name đã được bao gồm
const uri =
  'mongodb+srv://minhvqhe176726:minhvqhe176726@management-employee.31yis.mongodb.net/food_delivery?retryWrites=true&w=majority&appName=management-employee'

class DatabaseService {
  private client: MongoClient
  private db: Db | null = null
  public connected: boolean = false
  private connectionPromise: Promise<boolean> | null = null

  constructor() {
    this.client = new MongoClient(uri)
  }

  async connect(): Promise<boolean> {
    // Nếu đã kết nối, trả về true ngay lập tức
    if (this.connected) return true

    // Nếu đang trong quá trình kết nối, trả về promise đang chờ
    if (this.connectionPromise) return this.connectionPromise

    // Tạo một promise kết nối mới
    this.connectionPromise = new Promise(async (resolve, reject) => {
      try {
        // Kết nối đến MongoDB
        await this.client.connect()

        // Lấy database
        this.db = this.client.db()

        // Kiểm tra kết nối
        await this.db.command({ ping: 1 })

        // Đánh dấu đã kết nối
        this.connected = true
        console.log('Connected to MongoDB successfully!')

        // Thiết lập các chỉ mục trong môi trường development
        if (process.env.NODE_ENV !== 'production') {
          await this.setupIndexes()
        }

        resolve(true)
      } catch (error) {
        console.error('Failed to connect to MongoDB:', error)
        this.connectionPromise = null
        reject(error)
      }
    })

    return this.connectionPromise
  }

  private async setupIndexes() {
    try {
      console.log('Setting up database indexes...')
      await this.indexUsers()
      await this.indexRestaurants()
      await this.indexMenuItems()
      await this.indexOrders()
      console.log('All indexes set up successfully')
    } catch (error) {
      console.error('Error setting up indexes:', error)
    }
  }

  // Getters với kiểm tra kết nối
  get users(): Collection<User> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.users)
  }

  get refreshTokens(): Collection<RefreshToken> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.refreshTokens)
  }

  get restaurants(): Collection<Restaurant> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.restaurants)
  }

  get menuItems(): Collection<MenuItem> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.menuItems)
  }

  get menuCategories(): Collection<MenuCategory> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.menuCategories)
  }

  get orders(): Collection<Order> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.orders)
  }

  get deliveryTracking(): Collection<DeliveryTracking> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.deliveryTracking)
  }

  get ratings(): Collection<Rating> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.ratings)
  }

  get refunds(): Collection<Refund> {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')
    return this.db.collection(COLLECTIONS.refunds)
  }

  // Các phương thức để thiết lập chỉ mục
  async indexUsers() {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')

    try {
      await this.users.createIndex({ email: 1 }, { unique: true })
      await this.users.createIndex({ phone: 1 }, { unique: true })
      await this.users.createIndex({ role: 1 })
      await this.users.createIndex({ 'currentLocation.updatedAt': 1 }, { expireAfterSeconds: 86400 }) // 24 hours
      console.log('User indexes created')
    } catch (error) {
      console.error('Error creating user indexes:', error)
    }
  }

  async indexRestaurants() {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')

    try {
      await this.restaurants.createIndex({ ownerId: 1 })
      await this.restaurants.createIndex({ name: 1 })
      await this.restaurants.createIndex({ categories: 1 })
      await this.restaurants.createIndex({ 'location.lat': 1, 'location.lng': 1 }, { name: 'geospatial' })
      console.log('Restaurant indexes created')
    } catch (error) {
      console.error('Error creating restaurant indexes:', error)
    }
  }

  async indexMenuItems() {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')

    try {
      await this.menuItems.createIndex({ restaurantId: 1 })
      await this.menuItems.createIndex({ categoryId: 1 })
      await this.menuItems.createIndex({ name: 'text', description: 'text' })
      console.log('Menu item indexes created')
    } catch (error) {
      console.error('Error creating menu item indexes:', error)
    }
  }

  async indexOrders() {
    if (!this.db) throw new Error('Database not connected. Call connect() first.')

    try {
      await this.orders.createIndex({ userId: 1 })
      await this.orders.createIndex({ restaurantId: 1 })
      await this.orders.createIndex({ deliveryPersonId: 1 })
      await this.orders.createIndex({ orderStatus: 1 })
      await this.orders.createIndex({ created_at: 1 })
      console.log('Order indexes created')
    } catch (error) {
      console.error('Error creating order indexes:', error)
    }
  }

  // Method để đóng kết nối
  async close() {
    if (this.client) {
      await this.client.close()
      this.connected = false
      this.db = null
      this.connectionPromise = null
      console.log('MongoDB connection closed')
    }
  }
}

// Singleton instance
const databaseService = new DatabaseService()

export default databaseService
