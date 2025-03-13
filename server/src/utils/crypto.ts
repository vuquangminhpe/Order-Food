import crypto from 'crypto'
import { envConfig } from '../constants/config'

export const hashPassword = (password: string): string => {
  return crypto
    .createHmac('sha256', envConfig.password_secret as string)
    .update(password)
    .digest('hex')
}

export const verifyPassword = (password: string, hashedPassword: string): boolean => {
  const hashed = hashPassword(password)
  return hashed === hashedPassword
}

export const generateRandomToken = (length: number = 32): string => {
  return crypto.randomBytes(length).toString('hex')
}

export const generateRandomCode = (length: number = 6): string => {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, '0')
}

export const generateRandomString = (
  length: number = 10,
  chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
): string => {
  let result = ''
  const randomBytes = crypto.randomBytes(length)

  for (let i = 0; i < length; i++) {
    const randomIndex = randomBytes[i] % chars.length
    result += chars.charAt(randomIndex)
  }

  return result
}
