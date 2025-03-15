import { Request, Response, NextFunction } from 'express'
import { Result, ValidationChain, ValidationError, validationResult } from 'express-validator'
import { USERS_MESSAGES } from '../constants/messages'
import HTTP_STATUS from '../constants/httpStatus'
import { EntityError, ErrorWithStatus } from '../models/Errors'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validation.run(req)
    const errors = validationResult(req)
    const entityError = new EntityError({ errors: {} })
    if (errors.isEmpty()) {
      return next()
    }
    const errorsObject = errors.mapped()
    for (const key in errorsObject) {
      const { msg } = errorsObject[key]
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }
      entityError.errors[key] = errorsObject[key]
    }

    next(entityError)
  }
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
