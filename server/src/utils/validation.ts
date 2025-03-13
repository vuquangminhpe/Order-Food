import { Request, Response, NextFunction } from 'express'
import { Result, ValidationError, validationResult } from 'express-validator'
import { USERS_MESSAGES } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'

interface ValidationErrorsResponse {
  message: string
  errors: {
    [key: string]: {
      msg: string
      [key: string]: any
    }
  }
}

export const validate = (validations: any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation: any) => validation.run(req)))

    const errors = validationResult(req)

    if (errors.isEmpty()) {
      return next()
    }

    const errorResponse: ValidationErrorsResponse = {
      message: USERS_MESSAGES.VALIDATION_ERROR,
      errors: {}
    }

    errors.array().forEach((error: ValidationError) => {
      const path = (error as any).path
      errorResponse.errors[path] = {
        ...error
      }
    })

    return res.status(HTTP_STATUS.BAD_REQUEST).json(errorResponse)
  }
}

export const formatValidationErrors = (errors: Result<ValidationError>): ValidationErrorsResponse => {
  const errorResponse: ValidationErrorsResponse = {
    message: USERS_MESSAGES.VALIDATION_ERROR,
    errors: {}
  }

  errors.array().forEach((error: ValidationError) => {
    const path = (error as any).path
    errorResponse.errors[path] = {
      ...error
    }
  })

  return errorResponse
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+?\d{1,3})?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/
  return phoneRegex.test(phone)
}

export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
  return passwordRegex.test(password)
}

export const isValidDateString = (dateString: string): boolean => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) return false

  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

export const isValidObjectId = (id: string): boolean => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/
  return objectIdRegex.test(id)
}

export const isValidLatitude = (lat: number): boolean => {
  return lat >= -90 && lat <= 90
}

export const isValidLongitude = (lng: number): boolean => {
  return lng >= -180 && lng <= 180
}
