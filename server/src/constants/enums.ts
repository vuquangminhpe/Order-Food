import { JwtPayload } from 'jsonwebtoken'
import { UserRole, UserVerifyStatus } from '~/models/schemas/Users.schema'

export enum TokenType {
  AccessToken = 'access',
  RefreshToken = 'refresh',
  EmailVerifyToken = 'email_verify',
  ForgotPasswordToken = 'forgot_password',
  VerifyEmailToken = 'VerifyEmailToken'
}
export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType | string
  verify?: UserVerifyStatus
  role?: UserRole
  token?: string
}
export interface LoginResponse {
  access_token: string
  refresh_token: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
}

export interface RegisterResponse {
  user_id: string
  verify_email_token?: string
}

export interface TokenData {
  payload: TokenPayload
  privateKey: string
  options?: any
}

export interface VerifyTokenData {
  token: string
  secretOrPublicKey: string
}
