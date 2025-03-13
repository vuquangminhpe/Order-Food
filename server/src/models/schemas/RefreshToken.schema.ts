import { ObjectId } from 'mongodb'

interface RefreshTokenType {
  _id?: ObjectId
  user_id: ObjectId
  token: string
  created_at?: Date
  updated_at?: Date
  exp?: Date
}

export default class RefreshToken {
  _id?: ObjectId
  user_id: ObjectId
  token: string
  created_at: Date
  updated_at: Date
  exp: Date

  constructor(refreshToken: RefreshTokenType) {
    const date = new Date()
    const expDate = new Date(date)
    expDate.setDate(expDate.getDate() + 7)

    this._id = refreshToken._id
    this.user_id = refreshToken.user_id
    this.token = refreshToken.token
    this.created_at = refreshToken.created_at || date
    this.updated_at = refreshToken.updated_at || date
    this.exp = refreshToken.exp || expDate
  }
}
