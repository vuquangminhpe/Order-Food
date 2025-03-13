import { ObjectId } from 'mongodb'
import { UserRole, UserVerifyStatus } from '../schemas/Users.schema'

export interface UserAddress {
  title: string
  address: string
  lat: number
  lng: number
  isDefault: boolean
}

export interface UserAddressUpdateRequest {
  title?: string
  address?: string
  lat?: number
  lng?: number
  isDefault?: boolean
}

export interface UserLocation {
  lat: number
  lng: number
  updatedAt: Date
}

export interface UserLocationUpdateRequest {
  lat: number
  lng: number
}

export interface UserStatusUpdateRequest {
  isAvailable: boolean
}

export interface UserProfileResponse {
  _id: string
  name: string
  email: string
  phone: string
  role: UserRole
  addresses: UserAddress[]
  avatar: string
  date_of_birth?: Date
  created_at: Date
  verify: UserVerifyStatus
  isAvailable?: boolean
  currentLocation?: UserLocation
  restaurantId?: string
}

export interface UserUpdateProfileRequest {
  name?: string
  phone?: string
  date_of_birth?: string
}

export interface DeliveryPersonnel {
  _id: ObjectId
  name: string
  phone: string
  email: string
  avatar: string
  isAvailable: boolean
  currentLocation: UserLocation
  distance: number
}

export interface NearbyDeliveryPersonnelOptions {
  lat: number
  lng: number
  radius: number
}

export interface NearbyDeliveryPersonnelResponse {
  personnel: DeliveryPersonnel[]
}

export interface UserBanRequest {
  reason: string
}

export interface UserBanResponse {
  success: boolean
  message: string
}

export interface UserListOptions {
  page: number
  limit: number
  role?: UserRole
  verify?: UserVerifyStatus
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface UserListResponse {
  users: UserProfileResponse[]
  pagination: {
    total: number
    page: number
    limit: number
    pages: number
  }
}
