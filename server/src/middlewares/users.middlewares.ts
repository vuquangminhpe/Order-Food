// Add these to your existing validation.middlewares.ts file

import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { USERS_MESSAGES } from '../constants/messages'
import databaseService from '../services/database.services'
import { hashPassword } from '../utils/crypto'
import { isValidDateString, validate } from '../utils/validation'

// User profile validators
export const updateProfileValidator = validate(
  checkSchema(
    {
      name: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Name must be between 1 and 100 characters'
        }
      },
      phone: {
        optional: true,
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!value) return true

            // Skip validation if phone is not changed
            const { user_id } = req.decoded_authorization
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })

            if (user && user.phone === value) {
              return true
            }

            // Check if phone is already used by another user
            const userWithPhone = await databaseService.users.findOne({ phone: value })
            if (userWithPhone) {
              throw new Error(USERS_MESSAGES.PHONE_ALREADY_EXISTS)
            }

            return true
          }
        }
      },
      date_of_birth: {
        optional: true,
        custom: {
          options: (value) => {
            if (!value) return true

            if (!isValidDateString(value)) {
              throw new Error('Invalid date format. Use YYYY-MM-DD')
            }

            const date = new Date(value)
            const now = new Date()

            if (date > now) {
              throw new Error('Date of birth cannot be in the future')
            }

            // Check if user is at least 13 years old
            const minAge = 13
            const minAgeDate = new Date()
            minAgeDate.setFullYear(minAgeDate.getFullYear() - minAge)

            if (date > minAgeDate) {
              throw new Error(`You must be at least ${minAge} years old`)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        notEmpty: {
          errorMessage: 'Old password is required'
        },
        isString: true,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id as string)
            })

            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }

            const hashedPassword = hashPassword(value)
            if (hashedPassword !== user.password) {
              throw new Error(USERS_MESSAGES.INCORRECT_PASSWORD)
            }

            return true
          }
        }
      },
      password: {
        notEmpty: {
          errorMessage: 'New password is required'
        },
        isString: true,
        isLength: {
          options: { min: 6 },
          errorMessage: 'Password must be at least 6 characters'
        },
        custom: {
          options: (value, { req }) => {
            if (value === req.body.old_password) {
              throw new Error('New password must be different from old password')
            }
            return true
          }
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: 'Confirm password is required'
        },
        isString: true,

        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.PASSWORD_MUST_MATCH)
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const addAddressValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: {
          errorMessage: 'Address title is required'
        },
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Title must be between 1 and 100 characters'
        }
      },
      address: {
        notEmpty: {
          errorMessage: 'Address is required'
        },
        isString: true,
        trim: true,
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Address must be between 5 and 200 characters'
        }
      },
      lat: {
        notEmpty: {
          errorMessage: 'Latitude is required'
        },
        isFloat: {
          options: { min: -90, max: 90 },
          errorMessage: 'Latitude must be between -90 and 90'
        }
      },
      lng: {
        notEmpty: {
          errorMessage: 'Longitude is required'
        },
        isFloat: {
          options: { min: -180, max: 180 },
          errorMessage: 'Longitude must be between -180 and 180'
        }
      },
      isDefault: {
        optional: true,
        isBoolean: true,
        errorMessage: 'isDefault must be a boolean'
      }
    },
    ['body']
  )
)

export const updateAddressValidator = validate(
  checkSchema(
    {
      index: {
        in: ['params'],
        isInt: {
          options: { min: 0 },
          errorMessage: 'Address index must be a non-negative integer'
        },
        toInt: true,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
            })

            if (!user) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }

            if (!user.addresses || value >= user.addresses.length) {
              throw new Error(USERS_MESSAGES.ADDRESS_NOT_FOUND)
            }

            return true
          }
        }
      },
      title: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: 'Title must be between 1 and 100 characters'
        }
      },
      address: {
        optional: true,
        isString: true,
        trim: true,
        isLength: {
          options: { min: 5, max: 200 },
          errorMessage: 'Address must be between 5 and 200 characters'
        }
      },
      lat: {
        optional: true,
        isFloat: {
          options: { min: -90, max: 90 },
          errorMessage: 'Latitude must be between -90 and 90'
        }
      },
      lng: {
        optional: true,
        isFloat: {
          options: { min: -180, max: 180 },
          errorMessage: 'Longitude must be between -180 and 180'
        }
      },
      isDefault: {
        optional: true,
        isBoolean: true,
        errorMessage: 'isDefault must be a boolean'
      }
    },
    ['params', 'body']
  )
)

export const updateDeliveryStatusValidator = validate(
  checkSchema(
    {
      isAvailable: {
        notEmpty: {
          errorMessage: 'Availability status is required'
        },
        isBoolean: true,
        errorMessage: 'isAvailable must be a boolean'
      }
    },
    ['body']
  )
)

export const updateLocationValidator = validate(
  checkSchema(
    {
      lat: {
        notEmpty: {
          errorMessage: 'Latitude is required'
        },
        isFloat: {
          options: { min: -90, max: 90 },
          errorMessage: 'Latitude must be between -90 and 90'
        }
      },
      lng: {
        notEmpty: {
          errorMessage: 'Longitude is required'
        },
        isFloat: {
          options: { min: -180, max: 180 },
          errorMessage: 'Longitude must be between -180 and 180'
        }
      }
    },
    ['body']
  )
)
