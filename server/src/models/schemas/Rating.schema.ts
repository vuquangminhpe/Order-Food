import { ObjectId } from 'mongodb'

interface RatingType {
  _id?: ObjectId
  userId: ObjectId
  restaurantId: ObjectId
  orderId: ObjectId
  rating: number
  review?: string
  foodRating?: number
  deliveryRating?: number
  photos?: string[]
  created_at?: Date
  updated_at?: Date
  isVisible?: boolean
}

export default class Rating {
  _id?: ObjectId
  userId: ObjectId
  restaurantId: ObjectId
  orderId: ObjectId
  rating: number
  review: string
  foodRating: number
  deliveryRating: number
  photos: string[]
  created_at: Date
  updated_at: Date
  isVisible: boolean

  constructor(rating: RatingType) {
    const date = new Date()
    this._id = rating._id
    this.userId = rating.userId
    this.restaurantId = rating.restaurantId
    this.orderId = rating.orderId
    this.rating = rating.rating
    this.review = rating.review || ''
    this.foodRating = rating.foodRating || rating.rating
    this.deliveryRating = rating.deliveryRating || rating.rating
    this.photos = rating.photos || []
    this.created_at = rating.created_at || date
    this.updated_at = rating.updated_at || date
    this.isVisible = rating.isVisible !== undefined ? rating.isVisible : true
  }
}
