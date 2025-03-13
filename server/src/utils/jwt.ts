import jwt from 'jsonwebtoken'
import { TokenData, TokenPayload, VerifyTokenData } from '~/constants/enums'

export const signToken = async ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: TokenData): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        reject(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = async ({ token, secretOrPublicKey }: VerifyTokenData): Promise<TokenPayload> => {
  return new Promise<TokenPayload>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error: any, decoded: any) => {
      if (error) {
        reject(error)
      }
      resolve(decoded as TokenPayload)
    })
  })
}

export const decodeToken = (token: string): TokenPayload | null => {
  try {
    return jwt.decode(token) as TokenPayload
  } catch (error) {
    return null
  }
}

export const getTokenFromHeader = (authorizationHeader: string | undefined): string | null => {
  if (!authorizationHeader) {
    return null
  }

  const parts = authorizationHeader.split(' ')

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

export const verifyAccessToken = async (
  token: string,
  secretKey: string = process.env.JWT_SECRET_KEY as string
): Promise<TokenPayload | null> => {
  try {
    return await verifyToken({
      token,
      secretOrPublicKey: secretKey
    })
  } catch (error) {
    return null
  }
}
