import { Request, Response, NextFunction } from 'express'
import { verifyToken, getTokenFromHeader } from '../utils/jwt'
import { envConfig } from '../constants/config'
import HTTP_STATUS from '../constants/httpStatus'
import { USERS_MESSAGES } from '../constants/messages'
import { TokenType } from '~/constants/enums'

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization

    if (!authorization) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_REQUIRED
      })
    }

    const token = getTokenFromHeader(authorization)

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_REQUIRED
      })
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: envConfig.secretAccessKey as string
    })

    if (decoded.token_type !== TokenType.AccessToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_INVALID
      })
    }

    req.decode_authorization = decoded
    req.user_id = decoded.user_id
    req.user_role = decoded.role

    next()
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USERS_MESSAGES.TOKEN_IS_INVALID
    })
  }
}

export const refreshTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_REQUIRED
      })
    }

    const decoded = await verifyToken({
      token: refresh_token,
      secretOrPublicKey: envConfig.secretOnPublicKey_Refresh as string
    })

    if (decoded.token_type !== TokenType.RefreshToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_INVALID
      })
    }

    req.decoded_refresh_token = decoded

    next()
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USERS_MESSAGES.TOKEN_IS_INVALID
    })
  }
}

export const verifyEmailTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_REQUIRED
      })
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: envConfig.secretAccessKey as string
    })

    if (decoded.token_type !== TokenType.EmailVerifyToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_INVALID
      })
    }

    req.decoded_email_verify_token = decoded

    next()
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USERS_MESSAGES.TOKEN_IS_INVALID
    })
  }
}

export const forgotPasswordTokenMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token || req.body.token

    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_REQUIRED
      })
    }

    const decoded = await verifyToken({
      token,
      secretOrPublicKey: envConfig.secretAccessKey as string
    })

    if (decoded.token_type !== TokenType.ForgotPasswordToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: USERS_MESSAGES.TOKEN_IS_INVALID
      })
    }

    req.decode_forgot_password_token = decoded

    next()
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: USERS_MESSAGES.TOKEN_IS_INVALID
    })
  }
}
