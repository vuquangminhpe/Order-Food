import jwt from 'jsonwebtoken'
import { TokenPayload } from '~/models/request/User.request'

export const signToken = ({
  payload,
  privateKey,
  optional = {
    algorithm: 'HS256'
  }
}: {
  payload: string | Buffer | object
  privateKey: string
  optional?: jwt.SignOptions
}) => {
  return new Promise<string>((resolve, reject) =>
    jwt.sign(payload, privateKey, optional, (error, token) => {
      if (error) reject(error)
      resolve(token as string)
    })
  )
}

export const verifyToken = ({ token, secretOnPublicKey }: { token: string; secretOnPublicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOnPublicKey, (error, decoded) => {
      if (error) throw reject(error)
      resolve(decoded as TokenPayload)
    })
  })
}
