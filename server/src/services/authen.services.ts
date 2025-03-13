import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import { signToken, verifyToken } from '../utils/jwt'
import { TokenPayload } from '../types/auth.types'
import RefreshToken from '../models/schemas/RefreshToken.schema'
import { UserVerifyStatus } from '../models/schemas/User.schema'
import crypto from 'crypto'
import { envConfig } from '../constants/config'

class AuthService {
  private accessTokenExpiresIn: string
  private refreshTokenExpiresIn: string
  private emailVerifyTokenExpiresIn: string
  private forgotPasswordTokenExpiresIn: string

  constructor() {
    this.accessTokenExpiresIn = envConfig.access_token_expires_in || '15m'
    this.refreshTokenExpiresIn = envConfig.refresh_token_expires_in || '7d'
    this.emailVerifyTokenExpiresIn = envConfig.email_verify_token_expires_in || '7d'
    this.forgotPasswordTokenExpiresIn = envConfig.forgot_password_token_expires_in || '15m'
  }

  // Sign access and refresh tokens
  async signAccessAndRefreshToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role?: number
  }): Promise<[string, string]> {
    // Get user role if not provided
    if (role === undefined) {
      const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
      role = user?.role
    }

    // Create token payload
    const payload: TokenPayload = {
      user_id,
      token_type: 'access',
      verify,
      role
    }

    // Sign tokens
    const accessToken = await signToken({
      payload,
      privateKey: envConfig.jwt_secret_key as string,
      options: { expiresIn: this.accessTokenExpiresIn }
    })

    const refreshToken = await signToken({
      payload: {
        ...payload,
        token_type: 'refresh'
      },
      privateKey: envConfig.jwt_secret_key as string,
      options: { expiresIn: this.refreshTokenExpiresIn }
    })

    return [accessToken, refreshToken]
  }

  // Login
  async login({ user_id, verify, role }: { user_id: string; verify: UserVerifyStatus; role?: number }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role
    })

    // Store refresh token in database
    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: refresh_token
      })
    )

    return {
      access_token,
      refresh_token
    }
  }

  // Logout
  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { success: true }
  }

  // Refresh token
  async refreshToken({
    user_id,
    verify,
    refresh_token,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    role?: number
  }) {
    // Get new tokens
    const [access_token, new_refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role
    })

    // Update refresh token in database
    await databaseService.refreshTokens.findOneAndUpdate(
      { token: refresh_token },
      {
        $set: {
          token: new_refresh_token,
          updated_at: new Date()
        }
      }
    )

    return {
      access_token,
      refresh_token: new_refresh_token
    }
  }

  // Generate email verification token
  async generateEmailVerifyToken(user_id: string) {
    const token = crypto.randomBytes(32).toString('hex')

    // Update user with verification token
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          email_verify_token: token,
          updated_at: new Date()
        }
      }
    )

    // Create JWT for email verification
    const emailVerifyToken = await signToken({
      payload: {
        user_id,
        token,
        token_type: 'email_verify'
      },
      privateKey: envConfig.jwt_secret_key as string,
      options: { expiresIn: this.emailVerifyTokenExpiresIn }
    })

    return emailVerifyToken
  }

  // Generate forgot password token
  async generateForgotPasswordToken(user_id: string) {
    const token = crypto.randomBytes(32).toString('hex')

    // Update user with forgot password token
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          forgot_password_token: token,
          updated_at: new Date()
        }
      }
    )

    // Create JWT for password reset
    const forgotPasswordToken = await signToken({
      payload: {
        user_id,
        token,
        token_type: 'forgot_password'
      },
      privateKey: envConfig.jwt_secret_key as string,
      options: { expiresIn: this.forgotPasswordTokenExpiresIn }
    })

    return forgotPasswordToken
  }

  // Verify email verify token
  async verifyEmailToken(token: string) {
    try {
      // Verify JWT
      const decoded = await verifyToken({
        token,
        secretOrPublicKey: envConfig.jwt_secret_key as string
      })

      if (decoded.token_type !== 'email_verify' || !decoded.user_id || !decoded.token) {
        return false
      }

      // Check if token matches in database
      const user = await databaseService.users.findOne({
        _id: new ObjectId(decoded.user_id),
        email_verify_token: decoded.token
      })

      return !!user
    } catch (error) {
      return false
    }
  }

  // Verify forgot password token
  async verifyForgotPasswordToken(token: string) {
    try {
      // Verify JWT
      const decoded = await verifyToken({
        token,
        secretOrPublicKey: envConfig.jwt_secret_key as string
      })

      if (decoded.token_type !== 'forgot_password' || !decoded.user_id || !decoded.token) {
        return false
      }

      // Check if token matches in database
      const user = await databaseService.users.findOne({
        _id: new ObjectId(decoded.user_id),
        forgot_password_token: decoded.token
      })

      return !!user
    } catch (error) {
      return false
    }
  }

  // Check if refresh token is valid
  async checkRefreshToken(refresh_token: string) {
    try {
      // Verify JWT
      const decoded = await verifyToken({
        token: refresh_token,
        secretOrPublicKey: envConfig.jwt_secret_key as string
      })

      if (decoded.token_type !== 'refresh' || !decoded.user_id) {
        return false
      }

      // Check if token exists in database
      const token = await databaseService.refreshTokens.findOne({
        token: refresh_token
      })

      return !!token
    } catch (error) {
      return false
    }
  }
}

const authService = new AuthService()

export default authService
