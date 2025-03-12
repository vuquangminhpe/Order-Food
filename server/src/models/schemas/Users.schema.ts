import { ObjectId } from 'mongodb'

enum UserRole {
  Customer = 0,
  RestaurantOwner = 1,
  DeliveryPerson = 2,
  Admin = 3
}

enum UserVerifyStatus {
  Unverified = 0,
  Verified = 1,
  Banned = 2
}

interface UserType {
  _id?: ObjectId
  name?: string
  email: string
  phone: string
  password: string
  role: UserRole
  addresses?: {
    title: string
    address: string
    lat: number
    lng: number
    isDefault: boolean
  }[]
  avatar?: string
  date_of_birth?: Date
  created_at?: Date
  updated_at?: Date
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus

  isAvailable?: boolean
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: Date
  }

  // For restaurant owner
  restaurantId?: ObjectId
}

export default class User {
  _id?: ObjectId
  name: string
  email: string
  phone: string
  password: string
  role: UserRole
  addresses: {
    title: string
    address: string
    lat: number
    lng: number
    isDefault: boolean
  }[]
  avatar: string
  date_of_birth: Date
  created_at: Date
  updated_at: Date
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus

  isAvailable: boolean
  currentLocation?: {
    lat: number
    lng: number
    updatedAt: Date
  }

  restaurantId?: ObjectId

  constructor(user: UserType) {
    const date = new Date()
    this._id = user._id
    this.name = user.name || ''
    this.email = user.email
    this.phone = user.phone
    this.password = user.password
    this.role = user.role
    this.addresses = user.addresses || []
    this.avatar = user.avatar || ''
    this.date_of_birth = user.date_of_birth || new Date()
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.isAvailable = user.isAvailable || false
    this.currentLocation = user.currentLocation
    this.restaurantId = user.restaurantId
  }
}

export { UserRole, UserVerifyStatus }
