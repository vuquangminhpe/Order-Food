import { ObjectId } from 'mongodb'
import { UserRole, UserVerifyStatus } from '../schemas/Users.schema'
import { RestaurantStatus } from '../schemas/Restaurant.schema'
import { OrderAddress } from './order.requests'
import { OrderStatus, PaymentMethod } from '../schemas/Order.schema'

export interface LoginReqBody {
  email: string
  password: string
}

export interface RegisterReqBody {
  name: string
  email: string
  password: string
  phone: string
  role?: UserRole
  verify: UserVerifyStatus.Unverified
}

export interface RefreshTokenReqBody {
  refresh_token: string
}

export interface VerifyEmailReqBody {
  token: string
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface ResetPasswordReqBody {
  password: string
  confirm_password: string
}

export interface ChangePasswordReqBody {
  old_password: string
  password: string
  confirm_password: string
}

export interface UpdateProfileReqBody {
  name?: string
  phone?: string
  date_of_birth?: string
}

export interface RestaurantReqBody {
  name: string
  description?: string
  address: string
  location: {
    lat: number
    lng: number
  }
  categories?: string[]
  openingHours: {
    day: number
    open: string
    close: string
    isClosed: boolean
  }[]
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  phoneNumber?: string
  ownerId: string | ObjectId
}

export interface UpdateRestaurantReqBody {
  name?: string
  description?: string
  address?: string
  location?: {
    lat: number
    lng: number
  }
  categories?: string[]
  openingHours?: {
    day: number
    open: string
    close: string
    isClosed: boolean
  }[]
  status?: RestaurantStatus
  deliveryFee?: number
  minOrderAmount?: number
  estimatedDeliveryTime?: number
  phoneNumber?: string
}

export interface UploadRestaurantImagesReqBody {
  imageType: 'logo' | 'cover' | 'gallery'
}

export interface MenuItemReqBody {
  restaurantId: string | ObjectId
  name: string
  description?: string
  price: number
  image?: string
  discountedPrice?: number
  categoryId: string | ObjectId
  options?: MenuItemOption[]
  isAvailable?: boolean
}
export interface MenuItemOptionItem {
  name: string
  price: number
}
export interface MenuItemOption {
  title: string
  required: boolean
  multiple: boolean
  items: MenuItemOptionItem[]
}
export interface MenuCategoryReqBody {
  restaurantId: string | ObjectId
  name: string
  description?: string
  order?: number
}

export interface UpdateMenuItemAvailabilityReqBody {
  isAvailable: boolean
}

export interface BatchUpdateMenuItemsReqBody {
  items: {
    id: string
    updates: Partial<MenuItemReqBody>
  }[]
}

export interface OrderReqBody {
  restaurantId: string | ObjectId
  items: {
    menuItemId: string | ObjectId
    quantity: number
    options?: {
      title: string
      items: {
        name: string
        price: number
      }[]
    }[]
  }[]
  deliveryAddress: OrderAddress
  paymentMethod: PaymentMethod
  discount?: number
  serviceCharge?: number
  notes?: string
  scheduledFor?: Date
}

export interface UpdateOrderStatusReqBody {
  status: OrderStatus
  reason?: string
}

export interface CancelOrderReqBody {
  reason?: string
}

export interface RateOrderReqBody {
  rating: number
  review?: string
  foodRating?: number
  deliveryRating?: number
}

export interface AssignDeliveryPersonReqBody {
  deliveryPersonId: string
}

export interface UpdateDeliveryLocationReqBody {
  lat: number
  lng: number
}

export interface PaymentReqBody {
  orderId: string
  amount: number
  orderInfo?: string
}

export interface AddAddressReqBody {
  title: string
  address: string
  lat: number
  lng: number
  isDefault: boolean
}

export interface UpdateAddressReqBody {
  title?: string
  address?: string
  lat?: number
  lng?: number
  isDefault?: boolean
}

export interface UpdateDeliveryStatusReqBody {
  isAvailable: boolean
}

export interface UpdateLocationReqBody {
  lat: number
  lng: number
}

export interface BanUserReqBody {
  reason: string
}
