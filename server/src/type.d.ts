import { Request } from 'express'

declare module 'express' {
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
