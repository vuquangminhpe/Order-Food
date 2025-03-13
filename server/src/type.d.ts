import { Request } from 'express'
import { TokenPayload } from './models/request/User.request'

declare module 'express' {
  interface Request {
    user?: User
    decode_authorization?: TokenPayload
    decoded_refresh_token?: TokenPayload
    decoded_email_verify_token?: TokenPayload
    decode_forgot_password_token?: TokenPayload
    user_role?: number
  }
}
declare module 'express-serve-static-core' {
  interface Request {
    user?: any
    user_id?: string
    user_role?: number
    decoded_authorization?: {
      user_id: string
      verify: UserVerifyStatus
      role: number
      token_type: string
      iat: number
      exp: number
    }
    decoded_refresh_token?: {
      user_id: string
      verify: UserVerifyStatus
      role: number
      token_type: string
      iat: number
      exp: number
    }
    decoded_verify_email_token?: {
      user_id: string
      token: string
      token_type: string
      iat: number
      exp: number
    }
    decoded_forgot_password_token?: {
      user_id: string
      token: string
      token_type: string
      iat: number
      exp: number
    }
  }
}
