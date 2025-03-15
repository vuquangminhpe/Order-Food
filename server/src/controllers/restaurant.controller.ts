import { Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { ParamsDictionary } from 'express-serve-static-core'
import { RESTAURANT_MESSAGES } from '../constants/messages'
import path from 'path'
import fs from 'fs'
import { RestaurantStatus } from '../models/schemas/Restaurant.schema'
import { OrderStatus, PaymentStatus } from '../models/schemas/Order.schema'
import databaseService from '../services/database.services'
import { RestaurantReqBody, UpdateRestaurantReqBody } from '../models/requests/auth.requests'
import restaurantService from '../services/restaurant.services'
import { deleteFileFromS3, uploadFileS3 } from '../utils/s3'

// Create a new restaurant
export const createRestaurantController = async (
  req: Request<ParamsDictionary, any, RestaurantReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as { user_id: string }
  const restaurantData = req.body

  // Add owner ID to restaurant data
  restaurantData.ownerId = new ObjectId(user_id)

  const result = await restaurantService.createRestaurant(restaurantData)

  // Update user with restaurant ID
  await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $set: { restaurantId: result.insertedId } })

  res.status(201).json({
    message: RESTAURANT_MESSAGES.CREATE_RESTAURANT_SUCCESS,
    result: {
      restaurant_id: result.insertedId.toString()
    }
  })
}

// Get a restaurant by ID
export const getRestaurantByIdController = async (req: Request, res: Response) => {
  const { id } = req.params

  const restaurant = await restaurantService.getRestaurantById(id)

  if (!restaurant) {
    return res.status(404).json({
      message: RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_RESTAURANT_SUCCESS,
    result: restaurant
  })
}

export const updateRestaurantController = async (
  req: Request<ParamsDictionary & { id: string }, any, UpdateRestaurantReqBody>,
  res: Response
) => {
  const { id } = req.params
  const { user_id } = req.decoded_authorization as { user_id: string }
  const updateData = req.body

  const restaurant = await restaurantService.getRestaurantById(id)

  if (!restaurant) {
    return res.status(404).json({
      message: RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: RESTAURANT_MESSAGES.UNAUTHORIZED_TO_UPDATE
    })
  }

  const result = await restaurantService.updateRestaurant(id, updateData)

  res.status(200).json({
    message: RESTAURANT_MESSAGES.UPDATE_RESTAURANT_SUCCESS,
    result
  })
}

export const deleteRestaurantController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { user_id } = req.decoded_authorization as { user_id: string }

  const restaurant = await restaurantService.getRestaurantById(id)

  if (!restaurant) {
    return res.status(404).json({
      message: RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: RESTAURANT_MESSAGES.UNAUTHORIZED_TO_DELETE
    })
  }

  if (restaurant.coverImage) {
    await deleteFileFromS3(restaurant.coverImage)
  }

  if (restaurant.logoImage) {
    await deleteFileFromS3(restaurant.logoImage)
  }

  if (restaurant.images && restaurant.images.length > 0) {
    for (const image of restaurant.images) {
      await deleteFileFromS3(image)
    }
  }

  const result = await restaurantService.deleteRestaurant(id)

  await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, { $unset: { restaurantId: '' } })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.DELETE_RESTAURANT_SUCCESS,
    result
  })
}

export const getAllRestaurantsController = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, sortBy = 'rating', sortOrder = 'desc', minRating, search } = req.query

  const result = await restaurantService.getAllRestaurants({
    page: Number(page),
    limit: Number(limit),
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    minRating: minRating ? Number(minRating) : undefined,
    search: search as string | undefined
  })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_RESTAURANTS_SUCCESS,
    result
  })
}

export const getNearbyRestaurantsController = async (req: Request, res: Response) => {
  const { lat, lng, radius = 5 } = req.query

  if (!lat || !lng) {
    return res.status(400).json({
      message: RESTAURANT_MESSAGES.INVALID_LOCATION
    })
  }

  const result = await restaurantService.getNearbyRestaurants({
    lat: Number(lat),
    lng: Number(lng),
    radius: Number(radius)
  })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_RESTAURANTS_SUCCESS,
    result
  })
}

export const getRestaurantsByCategoryController = async (req: Request, res: Response) => {
  const { category } = req.params
  const { page = 1, limit = 10 } = req.query

  const result = await restaurantService.getRestaurantsByCategory(category, {
    page: Number(page),
    limit: Number(limit)
  })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_RESTAURANTS_SUCCESS,
    result
  })
}

export const getRestaurantMenuController = async (req: Request, res: Response) => {
  const { id } = req.params

  const menu = await restaurantService.getRestaurantMenu(id)

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_MENU_SUCCESS,
    result: menu
  })
}

export const uploadRestaurantImagesController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { imageType } = req.body
  const files = (req as any).files

  if (!files || files.length === 0) {
    return res.status(400).json({
      message: RESTAURANT_MESSAGES.NO_IMAGES_UPLOADED
    })
  }

  try {
    const uploadedUrls: string[] = []

    for (const file of files) {
      const filename = `restaurants/${id}/${imageType}/${Date.now()}-${path.basename(file.path)}`

      await uploadFileS3({
        filename,
        filePath: file.path,
        contentType: file.mimetype
      })

      const fileUrl = `https://${process.env.Bucket_Name}.s3.${process.env.region}.amazonaws.com/${filename}`
      uploadedUrls.push(fileUrl)

      fs.unlinkSync(file.path)
    }

    let updateData: any = {}

    if (imageType === 'logo' && uploadedUrls.length > 0) {
      updateData.logoImage = uploadedUrls[0]
    } else if (imageType === 'cover' && uploadedUrls.length > 0) {
      updateData.coverImage = uploadedUrls[0]
    } else if (imageType === 'gallery') {
      updateData.$push = { images: { $each: uploadedUrls } }
    }

    await restaurantService.updateRestaurant(id, updateData)

    res.status(200).json({
      message: RESTAURANT_MESSAGES.UPLOAD_IMAGES_SUCCESS,
      result: {
        urls: uploadedUrls
      }
    })
  } catch (error) {
    for (const file of files) {
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path)
      }
    }

    throw error
  }
}

export const getRestaurantRatingsController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { page = 1, limit = 10 } = req.query

  const result = await restaurantService.getRestaurantRatings(id, {
    page: Number(page),
    limit: Number(limit)
  })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_RATINGS_SUCCESS,
    result
  })
}

export const getRestaurantOrdersController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { page = 1, limit = 10, status, startDate, endDate } = req.query

  const { user_id } = req.decoded_authorization as { user_id: string }

  const restaurant = await restaurantService.getRestaurantById(id)

  if (!restaurant) {
    return res.status(404).json({
      message: RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: RESTAURANT_MESSAGES.UNAUTHORIZED_ACCESS
    })
  }

  const result = await restaurantService.getRestaurantOrders(id, {
    page: Number(page),
    limit: Number(limit),
    status: status ? (Number(status) as OrderStatus) : undefined,
    startDate: startDate ? new Date(startDate as string) : undefined,
    endDate: endDate ? new Date(endDate as string) : undefined
  })

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_ORDERS_SUCCESS,
    result
  })
}

export const getRestaurantRevenueController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { period = 'monthly', year, month } = req.query

  const { user_id } = req.decoded_authorization as { user_id: string }

  const restaurant = await restaurantService.getRestaurantById(id)

  if (!restaurant) {
    return res.status(404).json({
      message: RESTAURANT_MESSAGES.RESTAURANT_NOT_FOUND
    })
  }

  if (restaurant.ownerId.toString() !== user_id && req.user_role !== 3) {
    return res.status(403).json({
      message: RESTAURANT_MESSAGES.UNAUTHORIZED_ACCESS
    })
  }

  const match: any = {
    restaurantId: new ObjectId(id),
    orderStatus: { $in: [OrderStatus.Delivered] },
    paymentStatus: PaymentStatus.Completed
  }

  if (period === 'daily' && year && month) {
    const startDate = new Date(Number(year), Number(month) - 1, 1)
    const endDate = new Date(Number(year), Number(month), 0)

    match.created_at = {
      $gte: startDate,
      $lte: endDate
    }
  } else if (period === 'monthly' && year) {
    const startDate = new Date(Number(year), 0, 1)
    const endDate = new Date(Number(year), 11, 31)

    match.created_at = {
      $gte: startDate,
      $lte: endDate
    }
  } else if (period === 'yearly') {
    const currentYear = new Date().getFullYear()
    const startDate = new Date(currentYear - 5, 0, 1)

    match.created_at = {
      $gte: startDate
    }
  }

  const revenueData = await databaseService.orders
    .aggregate([
      { $match: match },
      {
        $group: {
          _id:
            period === 'daily'
              ? { $dayOfMonth: '$created_at' }
              : period === 'monthly'
                ? { $month: '$created_at' }
                : { $year: '$created_at' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgOrderValue: { $avg: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ])
    .toArray()

  res.status(200).json({
    message: RESTAURANT_MESSAGES.GET_REVENUE_SUCCESS,
    result: {
      period,
      data: revenueData
    }
  })
}
