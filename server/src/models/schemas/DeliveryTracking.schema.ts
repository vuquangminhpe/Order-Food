import { ObjectId } from 'mongodb'

interface DeliveryTrackingType {
  _id?: ObjectId
  orderId: ObjectId
  deliveryPersonId: ObjectId
  status: string
  locationHistory: {
    lat: number
    lng: number
    timestamp: Date
  }[]
  currentLocation?: {
    lat: number
    lng: number
    timestamp: Date
  }
  estimatedArrival?: Date
  created_at?: Date
  updated_at?: Date
}

export default class DeliveryTracking {
  _id?: ObjectId
  orderId: ObjectId
  deliveryPersonId: ObjectId
  status: string
  locationHistory: {
    lat: number
    lng: number
    timestamp: Date
  }[]
  currentLocation?: {
    lat: number
    lng: number
    timestamp: Date
  }
  estimatedArrival?: Date
  created_at: Date
  updated_at: Date

  constructor(tracking: DeliveryTrackingType) {
    const date = new Date()
    this._id = tracking._id
    this.orderId = tracking.orderId
    this.deliveryPersonId = tracking.deliveryPersonId
    this.status = tracking.status
    this.locationHistory = tracking.locationHistory || []
    this.currentLocation = tracking.currentLocation
    this.estimatedArrival = tracking.estimatedArrival
    this.created_at = tracking.created_at || date
    this.updated_at = tracking.updated_at || date
  }
}
