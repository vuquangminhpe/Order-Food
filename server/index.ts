import express from 'express'
import databaseService from './src/services/database.services'
import { defaultErrorHandler } from './src/middlewares/error.middlewares'
import { config } from 'dotenv'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

// Routes
import restaurantRouter from './src/routes/restaurant.routes'
import menuRouter from './src/routes/menu.routes'
import orderRouter from './src/routes/order.routes'
import paymentRouter from './src/routes/payment.routes'
import userRouter from './src/routes/user.routes'
import authRouter from './src/routes/auth.routes'

// Import utils
import './src/utils/s3'
import { envConfig, isProduction } from './src/constants/config'

config()

// Connect to database - chạy khi khởi tạo serverless function
let isConnected = false
const connectToDatabase = async () => {
  if (isConnected) return
  try {
    await databaseService.connect()
    databaseService.indexUsers()
    databaseService.indexRestaurants()
    databaseService.indexMenuItems()
    databaseService.indexOrders()
    isConnected = true
  } catch (error) {
    console.error('Failed to connect to database:', error)
  }
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
})

// Create Express app
const app = express()

// Security middleware
app.use(helmet())

// CORS setup
const corsOptions: CorsOptions = {
  origin: isProduction ? envConfig.client_url : '*',
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Apply rate limiting
if (isProduction) {
  app.use(limiter)
}

// Middleware
app.use(express.json())

// Routes
app.use('/auth', authRouter)
app.use('/users', userRouter)
app.use('/restaurants', restaurantRouter)
app.use('/menu', menuRouter)
app.use('/orders', orderRouter)
app.use('/payments', paymentRouter)

// Add healthcheck route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' })
})

// Error handler
app.use(defaultErrorHandler)

// Chỉ khởi động server nếu đang chạy cục bộ
if (process.env.NODE_ENV !== 'production') {
  const port = envConfig.port || 3002
  app.listen(port, () => {
    console.log(`Development server listening on port ${port}`)
  })
}

// Luôn kết nối database trước khi xử lý requests
app.use(async (req, res, next) => {
  await connectToDatabase()
  return next()
})

export default app
