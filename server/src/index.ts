import { envConfig } from '~/constants/config'
import { config } from 'dotenv'
import databaseServices from './services/database.services'
import express from 'express'
import { createServer } from 'http'

config()
databaseServices.connect()

const app = express()
const port = envConfig.port || 3002

const httpServer = createServer(app)

httpServer.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
