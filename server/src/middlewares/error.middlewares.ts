import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { USERS_MESSAGES } from '../constants/messages'

export class ApiError extends Error {
  status: number
  errors?: any

  constructor(message: string, status: number, errors?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export const wrapAsync = (fn: Function) => {
  return function (req: Request, res: Response, next: NextFunction) {
    fn(req, res, next).catch(next)
  }
}

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err)

  res.locals.message = err.message
  res.locals.error = 'development'

  if (err.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: USERS_MESSAGES.VALIDATION_ERROR,
      errors: err.errors
    })
  }

  if (err.name === 'CastError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid ID format'
    })
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USERS_MESSAGES.TOKEN_IS_INVALID
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: 'Token expired'
    })
  }

  if (err.name === 'ApiError') {
    return res.status(err.status).json({
      message: err.message,
      errors: err.errors
    })
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(HTTP_STATUS.CONFLICT).json({
      message: `${field} already exists`
    })
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'File too large'
    })
  }

  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR
  const message = err.message || 'Internal Server Error'

  const errorResponse = {
    message,
    errors: err.errors
  }

  res.status(statusCode).json(errorResponse)
}

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    message: 'Resource not found'
  })
}

export const rateLimitErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.message && err.message.includes('Too many requests')) {
    return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      message: 'Too many requests, please try again later'
    })
  }

  next(err)
}

export const securityErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Invalid CSRF token'
    })
  }

  if (err.name === 'PayloadTooLargeError') {
    return res.status(HTTP_STATUS.PAYLOAD_TOO_LARGE).json({
      message: 'Request payload too large'
    })
  }

  next(err)
}
