import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import userService from '../services/user.services'
import { USERS_MESSAGES } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { hashPassword, verifyPassword } from '../utils/crypto'
import { AddAddressReqBody, UpdateAddressReqBody, UpdateProfileReqBody } from '../models/requests/auth.requests'
import { UserRole } from '../models/schemas/Users.schema'

// Get user profile
export const getUserProfileController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  console.log('user_id', user_id)

  const user = await userService.getUserById(user_id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  // Remove sensitive information
  const { password, email_verify_token, forgot_password_token, ...userInfo } = user

  res.status(HTTP_STATUS.OK).json({
    message: 'User profile retrieved successfully',
    result: userInfo
  })
}

// Update user profile
export const updateProfileController = async (
  req: Request<ParamsDictionary, any, UpdateProfileReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const updateData = req.body

  const result = await userService.updateProfile(user_id, updateData)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.PROFILE_UPDATED_SUCCESS,
    result
  })
}

// Change password
export const changePasswordController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { old_password, password } = req.body

  // Password verification is done in validation middleware
  const result = await userService.changePassword(user_id, hashPassword(password))

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.PASSWORD_CHANGED_SUCCESS,
    result
  })
}

// Upload avatar
export const uploadAvatarController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }

  if (!req.file) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'No file uploaded'
    })
  }

  const avatarUrl = await userService.uploadAvatar(user_id, req.file)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.AVATAR_UPLOADED_SUCCESS,
    result: {
      avatar_url: avatarUrl
    }
  })
}

// Get user addresses
export const getAddressesController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }

  const user = await userService.getUserById(user_id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Addresses retrieved successfully',
    result: user.addresses || []
  })
}

// Add user address
export const addAddressController = async (req: Request<ParamsDictionary, any, AddAddressReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const addressData = req.body

  const result = await userService.addAddress(user_id, addressData)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.ADDRESS_ADDED_SUCCESS,
    result
  })
}

// Update user address
export const updateAddressController = async (
  req: Request<ParamsDictionary & { index: string }, any, UpdateAddressReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { index } = req.params
  const addressData = req.body

  const user = await userService.getUserById(user_id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  // Check if address exists
  const addressIndex = parseInt(index)
  if (isNaN(addressIndex) || !user.addresses || addressIndex < 0 || addressIndex >= user.addresses.length) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.ADDRESS_NOT_FOUND
    })
  }

  const result = await userService.updateAddress(user_id, addressIndex, addressData)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.ADDRESS_UPDATED_SUCCESS,
    result
  })
}

// Delete user address
export const deleteAddressController = async (req: Request<ParamsDictionary & { index: string }>, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { index } = req.params

  const user = await userService.getUserById(user_id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  // Check if address exists
  const addressIndex = parseInt(index)
  if (isNaN(addressIndex) || !user.addresses || addressIndex < 0 || addressIndex >= user.addresses.length) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.ADDRESS_NOT_FOUND
    })
  }

  const result = await userService.deleteAddress(user_id, addressIndex)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.ADDRESS_DELETED_SUCCESS,
    result
  })
}

// Update delivery status (for delivery personnel)
export const updateDeliveryStatusController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { isAvailable } = req.body

  if (typeof isAvailable !== 'boolean') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'isAvailable must be a boolean'
    })
  }

  const result = await userService.updateDeliveryPersonStatus(user_id, isAvailable)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.STATUS_UPDATED_SUCCESS,
    result
  })
}

// Update location (for delivery personnel)
export const updateLocationController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const { lat, lng } = req.body

  if (!lat || !lng) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Latitude and longitude are required'
    })
  }

  // Validate coordinates
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid coordinates'
    })
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Latitude must be between -90 and 90'
    })
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Longitude must be between -180 and 180'
    })
  }

  const result = await userService.updateLocation(user_id, latitude, longitude)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.LOCATION_UPDATED_SUCCESS,
    result
  })
}

// Get nearby delivery personnel
export const getNearbyDeliveryPersonnelController = async (req: Request, res: Response) => {
  const { lat, lng, radius = 5 } = req.query

  if (!lat || !lng) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Latitude and longitude are required'
    })
  }

  // Validate coordinates
  const latitude = parseFloat(lat as string)
  const longitude = parseFloat(lng as string)
  const searchRadius = parseFloat(radius as string)

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid coordinates'
    })
  }

  if (latitude < -90 || latitude > 90) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Latitude must be between -90 and 90'
    })
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Longitude must be between -180 and 180'
    })
  }

  if (isNaN(searchRadius) || searchRadius <= 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Radius must be a positive number'
    })
  }

  const personnel = await userService.getNearbyDeliveryPersonnel(latitude, longitude, searchRadius)

  res.status(HTTP_STATUS.OK).json({
    message: 'Nearby delivery personnel retrieved successfully',
    result: personnel
  })
}

// Admin controllers

// Get all users
export const getUsersController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role, verify, search, sortBy = 'created_at', sortOrder = 'desc' } = req.query

  // Build filters
  const filters: any = {}

  if (role !== undefined) {
    filters.role = parseInt(role as string)
  }

  if (verify !== undefined) {
    filters.verify = parseInt(verify as string)
  }

  if (search) {
    filters.search = search as string
  }

  const result = await userService.getUsers({
    page: parseInt(page as string),
    limit: parseInt(limit as string),
    filters,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc'
  })

  res.status(HTTP_STATUS.OK).json({
    message: 'Users retrieved successfully',
    result
  })
}

// Get user by ID
export const getUserByIdController = async (req: Request, res: Response) => {
  const { id } = req.params

  const user = await userService.getUserById(id)

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: USERS_MESSAGES.USER_NOT_FOUND
    })
  }

  // Remove sensitive information
  const { password, email_verify_token, forgot_password_token, ...userInfo } = user

  res.status(HTTP_STATUS.OK).json({
    message: 'User retrieved successfully',
    result: userInfo
  })
}

// Ban user
export const banUserController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { reason } = req.body

  if (!reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Ban reason is required'
    })
  }

  const result = await userService.banUser(id, reason)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.USER_BANNED_SUCCESS,
    result
  })
}

// Unban user
export const unbanUserController = async (req: Request, res: Response) => {
  const { id } = req.params

  const result = await userService.unbanUser(id)

  res.status(HTTP_STATUS.OK).json({
    message: USERS_MESSAGES.USER_UNBANNED_SUCCESS,
    result
  })
}

// Get restaurant owners
export const getRestaurantOwnersController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query

  const result = await userService.getUsersByRole(
    UserRole.RestaurantOwner,
    parseInt(page as string),
    parseInt(limit as string)
  )

  res.status(HTTP_STATUS.OK).json({
    message: 'Restaurant owners retrieved successfully',
    result
  })
}

// Get delivery personnel
export const getDeliveryPersonnelController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query

  const result = await userService.getUsersByRole(
    UserRole.DeliveryPerson,
    parseInt(page as string),
    parseInt(limit as string)
  )

  res.status(HTTP_STATUS.OK).json({
    message: 'Delivery personnel retrieved successfully',
    result
  })
}
