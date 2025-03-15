import { Request } from 'express'

import { verifyToken } from './jwt'
import { JsonWebTokenError } from 'jsonwebtoken'
import _ from 'lodash'

export const numberEnumToArray = (numberEnum: { [key: string]: string | number }) => {
  return Object.values(numberEnum).filter((value) => typeof value === 'number') as number[]
}

// export const verifyAccessToken = async (access_token: string, req?: Request) => {
//   if (!access_token) {
//     throw new ErrorWithStatus({
//       message: USERS_MESSAGES.ACCESS_TOKEN_IS_VALID,
//       status: HTTP_STATUS.UNAUTHORIZED
//     })
//   }
//   try {
//     const decode_authorization = await verifyToken({
//       token: access_token,
//       secretOnPublicKey: envConfig.secretAccessKey as string
//     })
//     if (req) {
//       ;(req as Request).decode_authorization = decode_authorization
//       return true
//     }
//     return decode_authorization
//   } catch (error) {
//     throw new ErrorWithStatus({
//       message: _.capitalize((error as JsonWebTokenError).message),
//       status: HTTP_STATUS.UNAUTHORIZED
//     })
//   }
// }
