import { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { UPLOAD_IMAGE_DIR } from '../constants/dir'
import HTTP_STATUS from '../constants/httpStatus'

// Add necessary type definitions
declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string
        originalname: string
        encoding: string
        mimetype: string
        size: number
        destination: string
        filename: string
        path: string
        buffer: Buffer
      }
    }

    interface Request {
      file?: Multer.File
      files?:
        | {
            [fieldname: string]: Multer.File[]
          }
        | Multer.File[]
    }
  }
}

// Ensure upload directories exist
const createDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

createDir(UPLOAD_IMAGE_DIR)

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    return cb(null as any, UPLOAD_IMAGE_DIR)
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null as any, uniqueSuffix + ext)
  }
})

// File filter functions
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null as any, true)
  } else {
    cb(new Error('Only image files are allowed') as any)
  }
}

const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only video files
  if (file.mimetype.startsWith('video/')) {
    cb(null as any, true)
  } else {
    cb(new Error('Only video files are allowed') as any)
  }
}

// Create multer upload instances
export const uploadImageMiddleware = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

export const uploadVideoMiddleware = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

// Error handling middleware for multer uploads
export const handleUploadError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'File too large. Maximum file size allowed is 5MB for images and 100MB for videos.'
      })
    }

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: `Upload error: ${err.message}`
    })
  } else if (err) {
    // An unknown error occurred
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: err.message || 'An error occurred during file upload'
    })
  }

  // No error
  next()
}

// Middleware to handle file size validation
export const validateFileSize = (maxSizeInBytes: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if file exists
    if (!req.file) {
      return next()
    }

    // Check file size
    if (req.file.size > maxSizeInBytes) {
      // Delete the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting oversized file:', err)
      })

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: `File too large. Maximum file size allowed is ${Math.round(maxSizeInBytes / (1024 * 1024))}MB.`
      })
    }

    next()
  }
}

// Middleware to validate image dimensions
export const validateImageDimensions = (
  minWidth: number = 0,
  minHeight: number = 0,
  maxWidth: number = Infinity,
  maxHeight: number = Infinity
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Check if file exists
    if (!req.file) {
      return next()
    }

    try {
      // We would use a library like sharp or image-size to get dimensions
      // For this example, we'll just pass through
      next()
    } catch (error) {
      // Delete the uploaded file
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting invalid image:', err)
      })

      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Failed to validate image dimensions'
      })
    }
  }
}

// Middleware to clean up temporary files on error
export const cleanupOnError = (req: Request, res: Response, next: NextFunction) => {
  // Add a response listener instead of overriding res.end
  res.on('finish', () => {
    // Check if response status is an error
    if (res.statusCode >= 400) {
      // Clean up files if they exist
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file on error:', err)
        })
      }

      if (req.files) {
        // Handle array of files
        if (Array.isArray(req.files)) {
          req.files.forEach((file: Express.Multer.File) => {
            fs.unlink(file.path, (err) => {
              if (err) console.error('Error deleting file on error:', err)
            })
          })
        } else {
          // Handle object of file arrays
          Object.keys(req.files).forEach((key) => {
            ;(req.files as any)[key].forEach((file: Express.Multer.File) => {
              fs.unlink(file.path, (err) => {
                if (err) console.error('Error deleting file on error:', err)
              })
            })
          })
        }
      }
    }
  })

  next()
}
