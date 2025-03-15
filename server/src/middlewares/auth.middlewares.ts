import { verifyToken } from '../utils/jwt'
import { envConfig } from '../constants/config'
import HTTP_STATUS from '../constants/httpStatus'
import { USERS_MESSAGES } from '../constants/messages'
import { TokenType } from '../constants/enums'
import { validate } from '../utils/validation'
import { checkSchema } from 'express-validator'
import { ErrorWithStatus } from '../models/Errors'

export const authMiddleware = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: {
          errorMessage: new ErrorWithStatus({
            message: USERS_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              return new ErrorWithStatus({
                message: USERS_MESSAGES.TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            const decoded = await verifyToken({
              token: access_token,
              secretOrPublicKey: envConfig.secretAccessKey as string
            })

            if (decoded.token_type !== TokenType.AccessToken) {
              return new ErrorWithStatus({
                message: USERS_MESSAGES.TOKEN_IS_INVALID,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            // https://order-food-git-main-vu-quang-minhs-projects.vercel.app/
            req.decoded_authorization = decoded
            req.user_id = decoded.user_id
            req.user_role = decoded.role
            return true
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenMiddleware = validate(
  checkSchema({
    refresh_token: {
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      },
      custom: {
        options: async (value: string, { req }) => {
          const decoded = await verifyToken({
            token: value,
            secretOrPublicKey: envConfig.secretAccessKey as string
          })

          if (decoded.token_type !== TokenType.RefreshToken) {
            return new ErrorWithStatus({
              message: USERS_MESSAGES.TOKEN_IS_INVALID,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }

          req.decode_refresh_token = decoded

          return true
        }
      }
    }
  })
)

export const verifyEmailTokenMiddleware = validate(
  checkSchema({
    verify_email_token: {
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      },
      custom: {
        options: async (value: string, { req }) => {
          const decoded = await verifyToken({
            token: value,
            secretOrPublicKey: envConfig.secretAccessKey as string
          })

          if (decoded.token_type !== TokenType.VerifyEmailToken) {
            return new ErrorWithStatus({
              message: USERS_MESSAGES.TOKEN_IS_INVALID,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }

          req.decode_verify_email_token = decoded

          return true
        }
      }
    }
  })
)

export const forgotPasswordTokenMiddleware = validate(
  checkSchema({
    forgot_password_token: {
      notEmpty: {
        errorMessage: new ErrorWithStatus({
          message: USERS_MESSAGES.TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      },
      custom: {
        options: async (value: string, { req }) => {
          const decoded = await verifyToken({
            token: value,
            secretOrPublicKey: envConfig.secretAccessKey as string
          })

          if (decoded.token_type !== TokenType.ForgotPasswordToken) {
            return new ErrorWithStatus({
              message: USERS_MESSAGES.TOKEN_IS_INVALID,
              status: HTTP_STATUS.UNAUTHORIZED
            })
          }

          req.decode_forgot_password_token = decoded

          return true
        }
      }
    }
  })
)
