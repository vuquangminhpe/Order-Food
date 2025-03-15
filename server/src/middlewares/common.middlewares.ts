import { Request, Response, NextFunction } from 'express'
import HTTP_STATUS from '../constants/httpStatus'
import { UserRole } from '../models/schemas/Users.schema'

export const checkUserRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void | Promise<void> => {
    const userRole = req.user?.role

    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({ message: 'Forbidden' })
    }

    return next()
  }
}

export const isCustomer = (req: Request, res: Response, next: NextFunction) => {
  const { user_role } = req

  if (!user_role || user_role !== UserRole.Customer) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Forbidden: Only customers can access this resource'
    })
  }

  next()
}

export const isRestaurantOwner = (req: Request, res: Response, next: NextFunction) => {
  const { user_role } = req

  if (!user_role || user_role !== UserRole.RestaurantOwner) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Forbidden: Only restaurant owners can access this resource'
    })
  }

  next()
}

export const isDeliveryPerson = (req: Request, res: Response, next: NextFunction) => {
  const { user_role } = req

  if (!user_role || user_role !== UserRole.DeliveryPerson) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Forbidden: Only delivery personnel can access this resource'
    })
  }

  next()
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const { user_role } = req

  if (!user_role || user_role !== UserRole.Admin) {
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: 'Forbidden: Only administrators can access this resource'
    })
  }

  next()
}

export const isResourceOwner = (getResourceOwnerId: (req: Request) => Promise<string | null>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { user_id, user_role } = req

    if (!user_id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: 'Unauthorized'
      })
    }

    if (user_role === UserRole.Admin) {
      return next()
    }

    const resourceOwnerId = await getResourceOwnerId(req)

    if (!resourceOwnerId) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: 'Resource not found'
      })
    }

    if (resourceOwnerId !== user_id) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: 'Forbidden: You do not have permission to access this resource'
      })
    }

    next()
  }
}
