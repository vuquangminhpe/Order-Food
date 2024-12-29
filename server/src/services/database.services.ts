import { envConfig } from '../constants/config'
import { MongoClient, Db, Collection } from 'mongodb'

const uri =
  'mongodb+srv://minhvqhe176726:minhvqhe176726@management-employee.31yis.mongodb.net/?retryWrites=true&w=majority&appName=management-employee'

class DatabaseServices {
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
    } catch (error) {
      console.log(error)

      return error
    }
  }
  get users(): Collection<any> {
    return this.db.collection(envConfig.usersCollection)
  }
}

const databaseServices = new DatabaseServices()

export default databaseServices
