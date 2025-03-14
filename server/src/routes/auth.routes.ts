import express from 'express'
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator
} from '../middlewares/validation.middlewares'
import {
  registerController,
  loginController,
  logoutController,
  verifyEmailController,
  refreshTokenController,
  forgotPasswordController,
  resetPasswordController
} from '../controllers/auth.controller'
import { wrapAsync } from '../middlewares/error.middlewares'
import {
  authMiddleware,
  refreshTokenMiddleware,
  verifyEmailTokenMiddleware,
  forgotPasswordTokenMiddleware
} from '../middlewares/auth.middlewares'

const authRouter = express.Router()

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
authRouter.post('/register', registerValidator, wrapAsync(registerController))

/**
 * @route POST /auth/login
 * @desc Log in and get tokens
 * @access Public
 */
authRouter.post('/login', loginValidator, wrapAsync(loginController))

/**
 * @route POST /auth/logout
 * @desc Log out and invalidate refresh token
 * @access Private
 */
authRouter.post('/logout', authMiddleware, refreshTokenValidator, wrapAsync(logoutController))

/**
 * @route POST /auth/refresh-token
 * @desc Get new access token using refresh token
 * @access Public
 */
authRouter.post('/refresh-token', refreshTokenValidator, refreshTokenMiddleware, wrapAsync(refreshTokenController))

/**
 * @route GET /auth/verify-email/:token
 * @desc Verify user email
 * @access Public
 */
authRouter.get('/verify-email/:token', verifyEmailTokenMiddleware, wrapAsync(verifyEmailController))

/**
 * @route POST /auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
authRouter.post('/forgot-password', forgotPasswordValidator, wrapAsync(forgotPasswordController))

/**
 * @route POST /auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
authRouter.post(
  '/reset-password',
  resetPasswordValidator,
  forgotPasswordTokenMiddleware,
  wrapAsync(resetPasswordController)
)

export default authRouter
