import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { ObjectId } from 'mongodb'
import { LoginReqBody, RegisterReqBody } from '../models/requests/auth.requests'
import User, { UserRole, UserVerifyStatus } from '../models/schemas/User.schema'
import { USERS_MESSAGES } from '../constants/messages'
import authService from '../services/auth.services'
import userService from '../services/user.services'
import { hashPassword } from '../utils/crypto'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const { name, email, password, phone, role } = req.body

  const result = await userService.registerUser({
    name,
    email,
    password: hashPassword(password),
    phone,
    role: role || UserRole.Customer,
    verify: UserVerifyStatus.Unverified
  })

  const user_id = result.insertedId.toString()
  const email_verify_token = await authService.generateEmailVerifyToken(user_id)

  res.status(201).json({
    message: USERS_MESSAGES.REGISTER_SUCCESS,
    result: {
      user_id,
      email_verify_token
    }
  })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId

  console.log(`User logged in with user_id: ${user_id.toString()}`)

  const result = await authService.login({
    user_id: user_id.toString(),
    verify: user.verify
  })

  res.status(200).json({
    message: USERS_MESSAGES.LOGIN_SUCCESS,
    result
  })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const result = await authService.logout(refresh_token)

  res.status(200).json({
    message: USERS_MESSAGES.LOGOUT_SUCCESS,
    result
  })
}

export const verifyEmailController = async (req: Request, res: Response) => {
  const { token } = req.params
  const user_id = req.decoded_verify_email_token.user_id

  const result = await userService.verifyEmail(user_id)

  res.status(200).json({
    message: USERS_MESSAGES.EMAIL_VERIFY_SUCCESS,
    result
  })
}

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refresh_token } = req.body
  const { user_id, verify } = req.decoded_refresh_token

  const result = await authService.refreshToken({
    user_id,
    verify,
    refresh_token
  })

  res.status(200).json({
    message: USERS_MESSAGES.REFRESH_TOKEN_SUCCESS,
    result
  })
}

export const forgotPasswordController = async (req: Request, res: Response) => {
  const { email } = req.body
  const user = await userService.getUserByEmail(email)

  if (!user) {
    return res.status(200).json({
      message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD
    })
  }

  const forgot_password_token = await authService.generateForgotPasswordToken(user._id!.toString())

  res.status(200).json({
    message: USERS_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD,
    result: {
      forgot_password_token
    }
  })
}

export const resetPasswordController = async (req: Request, res: Response) => {
  const { password } = req.body
  const { user_id } = req.decoded_forgot_password_token

  const result = await userService.resetPassword(user_id, hashPassword(password))

  res.status(200).json({
    message: USERS_MESSAGES.RESET_PASSWORD_SUCCESS,
    result
  })
}
