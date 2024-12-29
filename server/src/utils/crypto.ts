import { createHash } from 'crypto'
import { envConfig } from '~/constants/config'

function sha256(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

export function hashPassword(password: string) {
  return sha256(password) + envConfig.password_secret
}

export function verifyPassword(inputPassword: string, hashedPassword: string) {
  const inputHash = sha256(inputPassword) + envConfig.password_secret
  return inputHash === hashedPassword
}
