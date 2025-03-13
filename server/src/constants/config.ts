import { config } from 'dotenv'
import argv from 'minimist'
const options = argv(process.argv.slice(2))
export const isProduction = options.env === 'production'

config({
  path: options.env ? `.env.${options.env}` : '.env'
})

export const envConfig = {
  port: process.env.PORT,
  host: process.env.HOST,
  db_username: process.env.DB_USERNAME,
  db_password: process.env.DB_PASSWORD,
  db_name: process.env.DB_Name,
  password_secret: process.env.PASSWORD_SECRET,
  Bucket_Name: process.env.S3_BUCKET_NAME,
  usersCollection: process.env.DB_USERS_COLLECTION as string,
  tweetsCollection: process.env.DB_TWEETS_COLLECTION as string,
  refreshCollection: process.env.DB_REFRESH_TOKENS_COLLECTION as string,
  followersCollection: process.env.DB_FOLLOWERS_COLLECTION as string,
  VideoStatusCollection: process.env.DB_VIDEO_STATUS_COLLECTION as string,
  hashtagsCollection: process.env.DB_HASHTAGS_COLLECTION as string,
  bookmarksCollection: process.env.DB_BOOKMARKS_COLLECTION as string,
  commentCollection: process.env.DB_COMMENTS_COLLECTION as string,
  likesCollection: process.env.DB_LIKES_COLLECTION as string,
  conversationsCollection: process.env.DB_CONVERSATIONS_COLLECTION as string,
  storiesCollection: process.env.DB_STORIES_COLLECTION as string,
  notificationCollection: process.env.DB_NOTIFICATION_COLLECTION as string,
  region: process.env.AWS_REGION,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  fromAddress: process.env.SES_FROM_ADDRESS,
  client_redirect: process.env.CLIENT_REDIRECT_CALLBACK,
  secretOnPublicKey_Forgot: process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN,
  secretOnPublicKey_Refresh: process.env.JWT_SECRET_REFRESH_TOKEN,
  secretOnPublicKey_Email: process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN,
  privateKey_access_token: process.env.JWT_SECRET_ACCESS_TOKEN,
  expiresIn_access_token: process.env.ACCESS_TOKEN_EXPIRES_IN,
  privateKey_refresh_token: process.env.JWT_SECRET_REFRESH_TOKEN,
  expiresIn_refresh_token: process.env.REFRESH_TOKEN_EXPIRES_IN,
  expiresIn_forgot_token: process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN,
  expiresIn_email_token: process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN,
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  redirect_uri: process.env.GOOGLE_REDIRECT_URI,
  client_url: process.env.CLIENT_URL
}
