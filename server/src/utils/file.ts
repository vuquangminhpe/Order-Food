/* eslint-disable no-extra-boolean-cast */
import { Request } from 'express'
import fs from 'fs'
import formidable, { Part } from 'formidable'
import { File } from 'formidable'
import { UPLOAD_IMAGES_DIR, UPLOAD_TEMP_DIR, UPLOAD_VIDEO_DIR, UPLOAD_VIDEO_HLS_DIR } from '~/constants/dir'
import { nanoid } from 'nanoid'
import path from 'path'
export const initFolderImage = () => {
  if (!fs.existsSync(UPLOAD_IMAGES_DIR)) {
    fs.mkdirSync(UPLOAD_IMAGES_DIR, {
      recursive: true
    })
  }
}

export const initFolderVideo = () => {
  if (!fs.existsSync(UPLOAD_VIDEO_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_DIR, {
      recursive: true
    })
  }
}
export const initFolderVideoHls = () => {
  if (!fs.existsSync(UPLOAD_VIDEO_HLS_DIR)) {
    fs.mkdirSync(UPLOAD_VIDEO_HLS_DIR, {
      recursive: true
    })
  }
}

export const handleUploadImage = async (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_TEMP_DIR,
    maxFiles: 10,
    keepExtensions: true,
    maxFileSize: 300 * 1024, // 300KB
    maxTotalFileSize: 300 * 1024 * 4, // 10MB
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'image' && Boolean(mimetype?.includes('image/'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.image)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.image as File[])
    })
  })
}

export const getNameFromFullname = (fullname: string) => {
  const namearr = fullname.split('.')
  namearr.pop()
  return namearr.join('')
}

// C1 : Tạo unique id cho video từ đầu
// c2: Đợi video upload xong r tạo folder, move video vào
export const handleUploadVideo = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 300KB
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename() {
      return idName + '.mp4'
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video as File[])
    })
  })
}

export const handleUploadVideoHLS = async (req: Request) => {
  const idName = nanoid()
  const folderPath = path.resolve(UPLOAD_VIDEO_HLS_DIR, idName)
  fs.mkdirSync(folderPath)
  const form = formidable({
    uploadDir: folderPath,
    maxFiles: 1,
    keepExtensions: true,
    maxFileSize: 50 * 1024 * 1024, // 300KB
    filter: function ({ name, originalFilename, mimetype }: Part) {
      const valid = name === 'video' && Boolean(mimetype?.includes('mp4') || mimetype?.includes('quicktime'))
      if (!valid) {
        form.emit('error' as any, new Error('File type is not valid') as any)
      }
      return valid
    },
    filename() {
      return idName
    }
  })

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err)
      }
      if (!Boolean(files.video)) {
        return reject(new Error('File is empty'))
      }
      resolve(files.video as File[])
    })
  })
}

// Recursive function to get files
export const getFiles = (dir: string, files: string[] = []) => {
  // Get an array of all files and directories in the passed directory using fs.readdirSync
  const fileList = fs.readdirSync(dir)
  // Create the full path of the file/directory by concatenating the passed directory and file/directory name
  for (const file of fileList) {
    const name = `${dir}/${file}`
    // Check if the current file/directory is a directory using fs.statSync
    if (fs.statSync(name).isDirectory()) {
      // If it is a directory, recursively call the getFiles function with the directory path and the files array
      getFiles(name, files)
    } else {
      // If it is a file, push the full path to the files array
      files.push(name)
    }
  }
  return files
}
