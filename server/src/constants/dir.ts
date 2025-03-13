import path from 'path'

export const ROOT_DIR = path.resolve(__dirname, '..')

export const UPLOAD_DIR = path.resolve(ROOT_DIR, 'uploads')
export const UPLOAD_IMAGE_DIR = path.resolve(UPLOAD_DIR, 'images')
export const UPLOAD_TEMP_DIR = path.resolve(UPLOAD_DIR, 'temp')
export const UPLOAD_VIDEO_DIR = path.resolve(UPLOAD_DIR, 'videos')
export const UPLOAD_VIDEO_HLS_DIR = path.resolve(UPLOAD_VIDEO_DIR, 'hls')

export const PUBLIC_DIR = path.resolve(ROOT_DIR, 'public')
export const PUBLIC_IMAGES_DIR = path.resolve(PUBLIC_DIR, 'images')

export const TEMPLATE_DIR = path.resolve(ROOT_DIR, 'templates')
export const EMAIL_TEMPLATE_DIR = path.resolve(TEMPLATE_DIR, 'emails')
