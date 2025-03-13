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
