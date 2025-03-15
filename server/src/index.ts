import express from 'express'

import { config } from 'dotenv'
import cors, { CorsOptions } from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'

// Routes

// Import utils
import './utils/s3'
import databaseService from '~/services/database.services'
import { envConfig, isProduction } from '~/constants/config'
import authRouter from '~/routes/auth.routes'
import userRouter from '~/routes/user.routes'
import restaurantRouter from '~/routes/restaurant.routes'
import menuRouter from '~/routes/menu.routes'
import orderRouter from '~/routes/order.routes'
import paymentRouter from '~/routes/payment.routes'
import { defaultErrorHandler } from '~/middlewares/error.middlewares'
import initSocket from '~/utils/socket'

config()

// Connect to database
databaseService
  .connect()
  .then(() => {
    databaseService.indexUsers()
    databaseService.indexRestaurants()
    databaseService.indexMenuItems()
    databaseService.indexOrders()
  })
  .catch(console.error)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
})

// Create Express app
const app = express()
const httpServer = createServer(app)
const port = envConfig.port || 3002

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

// Error handler
app.use(defaultErrorHandler)

// Initialize Socket.io
export const io = initSocket(httpServer)

// Start server
httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
export default app
