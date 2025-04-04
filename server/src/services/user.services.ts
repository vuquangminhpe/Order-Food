import { ObjectId } from 'mongodb'
import { InsertOneResult, UpdateResult } from 'mongodb'
import databaseService from './database.services'
import { RegisterReqBody, UpdateProfileReqBody } from '../models/requests/auth.requests'
import { uploadFileS3, deleteFileFromS3, uploadBufferToS3 } from '../utils/s3'
import fs from 'fs'
import path from 'path'
import User, { UserRole, UserVerifyStatus } from '../models/schemas/Users.schema'
import { envConfig } from '~/constants/config'

class UserService {
  // Register a new user
  async registerUser(userData: RegisterReqBody): Promise<InsertOneResult<User>> {
    const user = new User({
      ...userData,
      password: userData.password, // Already hashed in controller
      verify: UserVerifyStatus.Unverified,
      role: userData.role || UserRole.Customer
    })

    return databaseService.users.insertOne(user)
  }

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    return databaseService.users.findOne({ _id: new ObjectId(id) })
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return databaseService.users.findOne({ email })
  }

  // Get user by phone
  async getUserByPhone(phone: string): Promise<User | null> {
    return databaseService.users.findOne({ phone })
  }

  // Verify email
  async verifyEmail(user_id: string): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          email_verify_token: '',
          updated_at: new Date()
        }
      }
    )
  }

  // Reset password
  async resetPassword(user_id: string, hashedPassword: string): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashedPassword,
          forgot_password_token: '',
          updated_at: new Date()
        }
      }
    )
  }

  // Change password
  async changePassword(user_id: string, hashedPassword: string): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: hashedPassword,
          updated_at: new Date()
        }
      }
    )
  }

  // Update user profile
  async updateProfile(user_id: string, updateData: Partial<UpdateProfileReqBody>): Promise<UpdateResult> {
    const updateObj: any = {}

    // Handle normal fields
    if (updateData.name) updateObj.name = updateData.name
    if (updateData.phone) updateObj.phone = updateData.phone
    if (updateData.date_of_birth) updateObj.date_of_birth = new Date(updateData.date_of_birth)

    // Always update timestamp
    updateObj.updated_at = new Date()

    return databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: updateObj })
  }

  async uploadAvatar(user_id: string, file: Express.Multer.File): Promise<string> {
    try {
      // Get user to check if they have an existing avatar
      const user = await this.getUserById(user_id)

      // if (user?.avatar) {
      //   // Delete old avatar from S3
      //   await deleteFileFromS3(user.avatar)
      // }

      // Generate a unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
      const ext = path.extname(file.originalname)
      const filename = `users/${user_id}/avatar/${uniqueSuffix}${ext}`

      // Handle upload based on storage type (memory in production, disk in development)
      if (file.buffer) {
        // Memory storage (production) - upload directly from buffer
        await uploadBufferToS3({
          filename,
          buffer: file.buffer,
          contentType: file.mimetype
        })
      } else if (file.path) {
        // Disk storage (development) - upload from file path
        await uploadFileS3({
          filename,
          filePath: file.path,
          contentType: file.mimetype
        })

        // Clean up temp file
        fs.unlinkSync(file.path)
      } else {
        throw new Error('Invalid file object: neither path nor buffer is available')
      }

      // Construct S3 URL
      const fileUrl = `https://${envConfig.Bucket_Name}.s3.${envConfig.region}.amazonaws.com/${filename}`

      // Update user with avatar URL
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            avatar: fileUrl,
            updated_at: new Date()
          }
        }
      )

      return fileUrl
    } catch (error) {
      // Clean up temp file on error if it exists
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }

      console.error('Error uploading avatar:', error)
      throw error
    }
  }

  // Add user address
  async addAddress(
    user_id: string,
    address: {
      title: string
      address: string
      lat: number
      lng: number
      isDefault: boolean
    }
  ): Promise<UpdateResult> {
    // If address is set as default, unset other default addresses
    if (address.isDefault) {
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            'addresses.$[elem].isDefault': false
          }
        },
        {
          arrayFilters: [{ 'elem.isDefault': true }]
        }
      )
    }

    // Add new address
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $push: { addresses: address },
        $set: { updated_at: new Date() }
      }
    )
  }

  // Update user address
  async updateAddress(
    user_id: string,
    addressIndex: number,
    addressUpdate: Partial<{
      title: string
      address: string
      lat: number
      lng: number
      isDefault: boolean
    }>
  ): Promise<UpdateResult> {
    // Create update object
    const updateFields: Record<string, any> = {}

    for (const [key, value] of Object.entries(addressUpdate)) {
      updateFields[`addresses.${addressIndex}.${key}`] = value
    }

    updateFields.updated_at = new Date()

    // If setting as default, unset other default addresses
    if (addressUpdate.isDefault) {
      await databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            'addresses.$[elem].isDefault': false
          }
        },
        {
          arrayFilters: [{ 'elem.isDefault': true, $not: { $eq: { $indexOfArray: ['$addresses', '$$elem'] } } }]
        }
      )
    }

    // Update the address
    return databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: updateFields })
  }

  // Delete user address
  async deleteAddress(user_id: string, addressIndex: number): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $unset: { [`addresses.${addressIndex}`]: 1 },
        $set: { updated_at: new Date() }
      }
    )
  }

  // Update delivery person status
  async updateDeliveryPersonStatus(user_id: string, isAvailable: boolean): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id), role: UserRole.DeliveryPerson },
      {
        $set: {
          isAvailable,
          updated_at: new Date()
        }
      }
    )
  }

  // Update user location (for delivery person)
  async updateLocation(user_id: string, lat: number, lng: number): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          currentLocation: {
            lat,
            lng,
            updatedAt: new Date()
          },
          is_online: true,
          last_active: new Date(),
          updated_at: new Date()
        }
      }
    )
  }

  // Get nearby delivery personnel
  async getNearbyDeliveryPersonnel(
    restaurantLat: number,
    restaurantLng: number,
    radius: number = 5 // in kilometers
  ) {
    const EARTH_RADIUS = 6371 // Earth's radius in kilometers

    // Convert radius to radians
    const radians = radius / EARTH_RADIUS

    // Query for nearby delivery personnel who are available
    const deliveryPersonnel = await databaseService.users
      .find({
        role: UserRole.DeliveryPerson,
        isAvailable: true,
        'currentLocation.lat': { $gte: restaurantLat - radians, $lte: restaurantLat + radians },
        'currentLocation.lng': { $gte: restaurantLng - radians, $lte: restaurantLng + radians }
      })
      .toArray()

    // Filter results by actual distance
    const nearbyPersonnel = deliveryPersonnel.filter((person: any) => {
      const distance = this.calculateDistance(
        restaurantLat,
        restaurantLng,
        person.currentLocation!.lat,
        person.currentLocation!.lng
      )

      // Attach distance to person object
      person.distance = parseFloat(distance.toFixed(2))

      return distance <= radius
    })

    // Sort by distance
    nearbyPersonnel.sort((a: any, b: any) => a.distance - b.distance)

    return nearbyPersonnel
  }

  // Ban user
  async banUser(user_id: string, reason: string): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          verify: UserVerifyStatus.Banned,
          ban_reason: reason,
          updated_at: new Date()
        }
      }
    )
  }

  // Unban user
  async unbanUser(user_id: string): Promise<UpdateResult> {
    return databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          verify: UserVerifyStatus.Verified,
          $unset: { ban_reason: '' },
          updated_at: new Date()
        }
      }
    )
  }

  // Calculate distance between two coordinates using Haversine formula
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS = 6371 // Earth's radius in kilometers

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
  /**
   * Get users by role
   * @param role User role
   * @param page Page number
   * @param limit Items per page
   * @returns Paginated users
   */
  async getUsersByRole(role: UserRole, page: number = 1, limit: number = 10) {
    const query = { role }

    // Count total matching users
    const total = await databaseService.users.countDocuments(query)

    // Get paginated results
    const skip = (page - 1) * limit

    const users = await databaseService.users.find(query).sort({ created_at: -1 }).skip(skip).limit(limit).toArray()

    // Remove sensitive information
    const safeUsers = users.map((user) => {
      const { password, email_verify_token, forgot_password_token, ...safeData } = user
      return safeData
    })

    return {
      users: safeUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }
  /**
   * Get users with pagination and filtering
   * @param options Query options
   * @returns Paginated users
   */
  async getUsers({
    page = 1,
    limit = 10,
    filters = {},
    sortBy = 'created_at',
    sortOrder = 'desc'
  }: {
    page: number
    limit: number
    filters: any
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) {
    const query: any = {}

    // Apply filters
    if (filters.role !== undefined) {
      query.role = filters.role
    }

    if (filters.verify !== undefined) {
      query.verify = filters.verify
    }

    // Apply search
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ]
    }

    // Count total matching users
    const total = await databaseService.users.countDocuments(query)

    // Get paginated results
    const skip = (page - 1) * limit

    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    const users = await databaseService.users.find(query).sort(sort).skip(skip).limit(limit).toArray()

    // Remove sensitive information
    const safeUsers = users.map((user) => {
      const { password, email_verify_token, forgot_password_token, ...safeData } = user
      return safeData
    })

    return {
      users: safeUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    }
  }
}

const userService = new UserService()

export default userService
