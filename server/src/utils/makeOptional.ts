import { NextFunction, Request, Response } from 'express'

type MiddlewareFunction = (req: Request, res: Response, next: NextFunction) => Promise<void> | void

export const makeOptional = (middleware: MiddlewareFunction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.headers.authorization) {
        await middleware(req, res, next)
      } else {
        next()
      }
    } catch (error) {
      next()
    }
  }
}
