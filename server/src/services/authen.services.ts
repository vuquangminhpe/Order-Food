import { ObjectId } from 'mongodb'
import crypto from 'crypto'
import databaseService from './database.services'
import { signToken, verifyToken } from '../utils/jwt'
import { envConfig } from '~/constants/config'
import { UserVerifyStatus } from '~/models/schemas/Users.schema'
import { TokenPayload } from '~/constants/enums'
import RefreshToken from '~/models/schemas/RefreshToken.schema'

class AuthService {
  private accessTokenExpiresIn: string
  private refreshTokenExpiresIn: string
  private emailVerifyTokenExpiresIn: string
  private forgotPasswordTokenExpiresIn: string

  constructor() {
    this.accessTokenExpiresIn = envConfig.expiresIn_access_token || '15m'
    this.refreshTokenExpiresIn = envConfig.expiresIn_refresh_token || '7d'
    this.emailVerifyTokenExpiresIn = envConfig.expiresIn_email_token || '7d'
    this.forgotPasswordTokenExpiresIn = envConfig.expiresIn_forgot_token || '15m'
  }

  async signAccessAndRefreshToken({
    user_id,
    verify,
    role
  }: {
    user_id: string
    verify: UserVerifyStatus
    role?: number
  }): Promise<[string, string]> {
    if (role === undefined) {
      const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })
      role = user?.role
    }

    const payload: TokenPayload = {
      user_id,
      token_type: 'access',
      verify,
      role
    }

    // Sign tokens
    const accessToken = await signToken({
      payload,
      privateKey: envConfig.secretAccessKey as string,
      options: { expiresIn: this.accessTokenExpiresIn }
    })

    const refreshToken = await signToken({
      payload: {
        ...payload,
        token_type: 'refresh'
      },
      privateKey: envConfig.secretAccessKey as string,
      options: { expiresIn: this.refreshTokenExpiresIn }
    })

    return [accessToken, refreshToken]
  }

  async login({ user_id, verify, role }: { user_id: string; verify: UserVerifyStatus; role?: number }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id,
      verify,
      role
    })

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

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { success: true }
  }

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
      privateKey: envConfig.secretOnPublicKey_Email as string,
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
      privateKey: envConfig.secretOnPublicKey_Forgot as string,
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
        secretOrPublicKey: envConfig.secretOnPublicKey_Email as string
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
        secretOrPublicKey: envConfig.secretOnPublicKey_Forgot as string
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
        secretOrPublicKey: envConfig.secretOnPublicKey_Refresh as string
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
