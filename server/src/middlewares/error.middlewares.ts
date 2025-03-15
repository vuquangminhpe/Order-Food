import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { USERS_MESSAGES } from '../constants/messages'
import { omit } from 'lodash'
import { ErrorWithStatus } from '../models/Errors'

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

export const defaultErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  try {
    if (err instanceof ErrorWithStatus) {
      res.status(err.status).json(omit(err, ['status']))
    }
    const finalError: any = {}

    Object.getOwnPropertyNames(err).forEach((key) => {
      if (
        !Object.getOwnPropertyDescriptor(err, key)?.configurable ||
        !Object.getOwnPropertyDescriptor(err, key)?.writable
      ) {
        return
      }
      finalError[key] = err[key]
    })
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: err.message,
      errorInfo: omit(finalError, ['stack'])
    })
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Internal server error',
      errorInfo: omit(error as any, ['stack'])
    })
  }
}
