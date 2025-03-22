import { checkSchema, ParamSchema } from 'express-validator'
import { validate, isValidDateString, isValidObjectId } from '../utils/validation'
import databaseService from '../services/database.services'
import {
  USERS_MESSAGES,
  RESTAURANT_MESSAGES,
  MENU_MESSAGES,
  ORDER_MESSAGES,
  PAYMENT_MESSAGES
} from '../constants/messages'
import { hashPassword } from '../utils/crypto'
import { ObjectId } from 'mongodb'
import { OrderStatus, PaymentMethod } from '../models/schemas/Order.schema'
import { UserRole } from '../models/schemas/Users.schema'

// Shared schemas
const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.PASSWORD_IS_REQUIRED
  },
  isString: true,
  isLength: {
    options: { min: 8 },
    errorMessage: USERS_MESSAGES.PASSWORD_MIN_LENGTH
  },
  trim: true
}

const emailSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USERS_MESSAGES.EMAIL_IS_REQUIRED
  },
  isEmail: {
    errorMessage: USERS_MESSAGES.EMAIL_IS_VALID
  },
  trim: true,
  normalizeEmail: true
}

const objectIdSchema: ParamSchema = {
  custom: {
    options: (value) => {
      if (!isValidObjectId(value)) {
        throw new Error('Invalid ID format')
      }
      return true
    }
  }
}

// Auth validators
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({
              email: value,
              password: hashPassword(req.body.password)
            })
            console.log('testsafasdf', value, req.body.password, user)

            if (user === null) {
              throw new Error(USERS_MESSAGES.USER_NOT_FOUND)
            }

            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: 'Name is required'
        },
        isString: true,
        trim: true
      },
      email: {
        ...emailSchema,
        custom: {
          options: async (value) => {
            const user = await databaseService.users.findOne({ email: value })
            if (user) {
              throw new Error(USERS_MESSAGES.EMAIL_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.PASSWORD_MUST_MATCH)
            }
            return true
          }
        }
      },
      phone: {
        notEmpty: {
          errorMessage: 'Phone number is required'
        },
        trim: true,
        custom: {
          options: async (value) => {
            const user = await databaseService.users.findOne({ phone: value })
            if (user) {
              throw new Error(USERS_MESSAGES.PHONE_ALREADY_EXISTS)
            }
            return true
          }
        }
      },
      role: {
        optional: true,
        isInt: true,
        custom: {
          options: (value) => {
            if (![UserRole.Customer, UserRole.RestaurantOwner, UserRole.DeliveryPerson].includes(value)) {
              throw new Error('Invalid role')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.TOKEN_IS_REQUIRED
        },
        isString: true,
        trim: true,
        custom: {
          options: async (value, { req }) => {
            try {
              const token = await databaseService.refreshTokens.findOne({ token: value })
              if (!token) {
                throw new Error(USERS_MESSAGES.TOKEN_IS_INVALID)
              }
              return true
            } catch (error) {
              throw new Error(USERS_MESSAGES.TOKEN_IS_INVALID)
            }
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        ...emailSchema
      }
    },
    ['body']
  )
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USERS_MESSAGES.PASSWORD_MUST_MATCH)
            }
            return true
          }
        }
      },
      token: {
        notEmpty: {
          errorMessage: USERS_MESSAGES.TOKEN_IS_REQUIRED
        },
        isString: true,
        trim: true
      }
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema(
    {
      old_password: {
        ...passwordSchema,
        custom: {
          options: async (value, { req }) => {
            const { user_id } = req.decoded_authorization
            const user = await databaseService.users.findOne({
              _id: new ObjectId(user_id)
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
      password: passwordSchema,
      confirm_password: {
        ...passwordSchema,
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

// Restaurant validators
export const restaurantValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: RESTAURANT_MESSAGES.NAME_IS_REQUIRED
        },
        isString: true,
        trim: true
      },
      address: {
        notEmpty: {
          errorMessage: RESTAURANT_MESSAGES.ADDRESS_IS_REQUIRED
        },
        isString: true,
        trim: true
      },
      location: {
        notEmpty: {
          errorMessage: RESTAURANT_MESSAGES.LOCATION_IS_REQUIRED
        },
        isObject: true,
        custom: {
          options: (value) => {
            if (!value.lat || !value.lng) {
              throw new Error('Location must include lat and lng coordinates')
            }

            const lat = parseFloat(value.lat)
            const lng = parseFloat(value.lng)

            if (isNaN(lat) || isNaN(lng)) {
              throw new Error('Coordinates must be valid numbers')
            }

            if (lat < -90 || lat > 90) {
              throw new Error('Latitude must be between -90 and 90')
            }

            if (lng < -180 || lng > 180) {
              throw new Error('Longitude must be between -180 and 180')
            }

            return true
          }
        }
      },
      openingHours: {
        notEmpty: {
          errorMessage: RESTAURANT_MESSAGES.OPENING_HOURS_IS_REQUIRED
        },
        isArray: true,
        custom: {
          options: (value) => {
            if (!Array.isArray(value) || value.length !== 7) {
              throw new Error('Opening hours must be provided for all 7 days of the week')
            }

            for (const day of value) {
              if (
                !day.hasOwnProperty('day') ||
                !day.hasOwnProperty('open') ||
                !day.hasOwnProperty('close') ||
                !day.hasOwnProperty('isClosed')
              ) {
                throw new Error('Each day must include day, open, close, and isClosed properties')
              }

              if (day.day < 0 || day.day > 6) {
                throw new Error('Day must be between 0 (Sunday) and 6 (Saturday)')
              }

              if (!day.isClosed) {
                const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
                if (!timeRegex.test(day.open) || !timeRegex.test(day.close)) {
                  throw new Error('Time must be in HH:MM format (24-hour)')
                }
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateRestaurantValidator = validate(
  checkSchema(
    {
      id: {
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const restaurant = await databaseService.restaurants.findOne({
              _id: new ObjectId(value)
            })

            if (!restaurant) {
              throw new Error(RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['params']
  )
)

// Menu validators
export const menuItemValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: MENU_MESSAGES.NAME_IS_REQUIRED
        },
        isString: true,
        trim: true
      },
      price: {
        notEmpty: {
          errorMessage: MENU_MESSAGES.PRICE_IS_REQUIRED
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: MENU_MESSAGES.INVALID_PRICE
        }
      },
      restaurantId: {
        notEmpty: {
          errorMessage: MENU_MESSAGES.RESTAURANT_ID_IS_REQUIRED
        },
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const restaurant = await databaseService.restaurants.findOne({
              _id: new ObjectId(value)
            })

            if (!restaurant) {
              throw new Error(MENU_MESSAGES.RESTAURANT_NOT_FOUND)
            }

            return true
          }
        }
      },
      categoryId: {
        notEmpty: {
          errorMessage: MENU_MESSAGES.CATEGORY_ID_IS_REQUIRED
        },
        ...objectIdSchema,
        custom: {
          options: async (value, { req }) => {
            const category = await databaseService.menuCategories.findOne({
              _id: new ObjectId(value),
              restaurantId: new ObjectId(req.body.restaurantId)
            })

            if (!category) {
              throw new Error(MENU_MESSAGES.CATEGORY_NOT_FOUND)
            }

            return true
          }
        }
      },
      options: {
        optional: true,
        isArray: true,
        custom: {
          options: (value) => {
            if (!Array.isArray(value)) {
              return true
            }

            for (const option of value) {
              if (!option.title || typeof option.title !== 'string') {
                throw new Error('Option title is required and must be a string')
              }

              if (typeof option.required !== 'boolean') {
                throw new Error('Option required field must be a boolean')
              }

              if (typeof option.multiple !== 'boolean') {
                throw new Error('Option multiple field must be a boolean')
              }

              if (!Array.isArray(option.items) || option.items.length === 0) {
                throw new Error('Option items must be a non-empty array')
              }

              for (const item of option.items) {
                if (!item.name || typeof item.name !== 'string') {
                  throw new Error('Option item name is required and must be a string')
                }

                if (typeof item.price !== 'number' || item.price < 0) {
                  throw new Error('Option item price must be a non-negative number')
                }
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const menuCategoryValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: {
          errorMessage: 'Category name is required'
        },
        isString: true,
        trim: true
      },
      restaurantId: {
        notEmpty: {
          errorMessage: MENU_MESSAGES.RESTAURANT_ID_IS_REQUIRED
        },
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const restaurant = await databaseService.restaurants.findOne({
              _id: new ObjectId(value)
            })

            if (!restaurant) {
              throw new Error(MENU_MESSAGES.RESTAURANT_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

// Order validators
export const orderValidator = validate(
  checkSchema(
    {
      restaurantId: {
        notEmpty: {
          errorMessage: 'Restaurant ID is required'
        },
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const restaurant = await databaseService.restaurants.findOne({
              _id: new ObjectId(value)
            })

            if (!restaurant) {
              throw new Error(ORDER_MESSAGES.RESTAURANT_NOT_FOUND)
            }

            return true
          }
        }
      },
      items: {
        notEmpty: {
          errorMessage: 'Order items are required'
        },
        isArray: {
          options: { min: 1 },
          errorMessage: 'Order must contain at least one item'
        },
        custom: {
          options: async (value, { req }) => {
            if (!Array.isArray(value)) {
              return true
            }

            for (const item of value) {
              if (!item.menuItemId || !isValidObjectId(item.menuItemId)) {
                throw new Error('Invalid menu item ID')
              }

              if (typeof item.quantity !== 'number' || item.quantity < 1) {
                throw new Error('Item quantity must be a positive number')
              }

              // Verify menu item exists and is available
              const menuItem = await databaseService.menuItems.findOne({
                _id: new ObjectId(item.menuItemId),
                restaurantId: new ObjectId(req.body.restaurantId)
              })

              if (!menuItem) {
                throw new Error(ORDER_MESSAGES.MENU_ITEM_NOT_FOUND)
              }

              if (!menuItem.isAvailable) {
                throw new Error(`${ORDER_MESSAGES.MENU_ITEM_NOT_AVAILABLE}: ${menuItem.name}`)
              }

              // Validate options if provided
              if (item.options && Array.isArray(item.options)) {
                for (const option of item.options) {
                  const menuOption = menuItem.options.find((opt) => opt.title === option.title)

                  if (!menuOption) {
                    throw new Error(`${ORDER_MESSAGES.INVALID_OPTION}: ${option.title}`)
                  }

                  if (!Array.isArray(option.items) || option.items.length === 0) {
                    throw new Error(`Option items must be a non-empty array for: ${option.title}`)
                  }

                  // If option is required, check if at least one item is selected
                  if (menuOption.required && option.items.length === 0) {
                    throw new Error(`Option ${option.title} is required`)
                  }

                  // If option doesn't allow multiple selections, check if only one item is selected
                  if (!menuOption.multiple && option.items.length > 1) {
                    throw new Error(`Option ${option.title} doesn't allow multiple selections`)
                  }

                  // Validate each selected item
                  for (const selectedItem of option.items) {
                    const optionItem = menuOption.items.find((item) => item.name === selectedItem.name)

                    if (!optionItem) {
                      throw new Error(`${ORDER_MESSAGES.INVALID_OPTION_ITEM}: ${selectedItem.name}`)
                    }

                    // Ensure price matches
                    if (selectedItem.price !== optionItem.price) {
                      throw new Error(`Price mismatch for ${selectedItem.name}`)
                    }
                  }
                }
              }
            }

            return true
          }
        }
      },
      deliveryAddress: {
        notEmpty: {
          errorMessage: 'Delivery address is required'
        },
        isObject: true,
        custom: {
          options: (value) => {
            if (!value.address || typeof value.address !== 'string') {
              throw new Error('Address is required and must be a string')
            }

            if (!value.lat || !value.lng) {
              throw new Error('Location coordinates are required')
            }

            const lat = parseFloat(value.lat)
            const lng = parseFloat(value.lng)

            if (isNaN(lat) || isNaN(lng)) {
              throw new Error('Coordinates must be valid numbers')
            }

            if (lat < -90 || lat > 90) {
              throw new Error('Latitude must be between -90 and 90')
            }

            if (lng < -180 || lng > 180) {
              throw new Error('Longitude must be between -180 and 180')
            }

            return true
          }
        }
      },
      paymentMethod: {
        notEmpty: {
          errorMessage: 'Payment method is required'
        },
        isInt: true,
        custom: {
          options: (value) => {
            if (![PaymentMethod.CashOnDelivery, PaymentMethod.VNPay].includes(value)) {
              throw new Error('Invalid payment method')
            }
            return true
          }
        }
      }
    },
    ['body']
  )
)

export const updateOrderStatusValidator = validate(
  checkSchema(
    {
      id: {
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(value)
            })

            if (!order) {
              throw new Error(ORDER_MESSAGES.ORDER_NOT_FOUND)
            }

            return true
          }
        }
      },
      status: {
        notEmpty: {
          errorMessage: 'Order status is required'
        },
        isInt: true,
        custom: {
          options: (value) => {
            const validStatuses = Object.values(OrderStatus).filter((v) => !isNaN(Number(v)))
            if (!validStatuses.includes(Number(value))) {
              throw new Error('Invalid order status')
            }
            return true
          }
        }
      }
    },
    ['params', 'body']
  )
)

// Payment validators
export const paymentValidator = validate(
  checkSchema(
    {
      orderId: {
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(value)
            })

            if (!order) {
              throw new Error(PAYMENT_MESSAGES.ORDER_NOT_FOUND)
            }

            return true
          }
        }
      },
      amount: {
        notEmpty: {
          errorMessage: 'Amount is required'
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: PAYMENT_MESSAGES.INVALID_AMOUNT
        },
        custom: {
          options: async (value, { req }) => {
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(req.body.orderId)
            })

            if (!order) {
              throw new Error(PAYMENT_MESSAGES.ORDER_NOT_FOUND)
            }

            // Verify amount matches order total
            if (parseFloat(value) !== order.total) {
              throw new Error(PAYMENT_MESSAGES.INVALID_AMOUNT)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const refundValidator = validate(
  checkSchema(
    {
      orderId: {
        notEmpty: {
          errorMessage: 'Order ID is required'
        },
        ...objectIdSchema,
        custom: {
          options: async (value) => {
            const order = await databaseService.orders.findOne({
              _id: new ObjectId(value)
            })

            if (!order) {
              throw new Error(PAYMENT_MESSAGES.ORDER_NOT_FOUND)
            }

            return true
          }
        }
      },
      amount: {
        notEmpty: {
          errorMessage: 'Amount is required'
        },
        isFloat: {
          options: { min: 0 },
          errorMessage: PAYMENT_MESSAGES.INVALID_AMOUNT
        }
      },
      reason: {
        notEmpty: {
          errorMessage: 'Refund reason is required'
        },
        isString: true,
        trim: true
      }
    },
    ['body']
  )
)
