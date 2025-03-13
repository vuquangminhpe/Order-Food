import { ListObjectVersionsCommand, S3 } from '@aws-sdk/client-s3'
import { config } from 'dotenv'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'
import { Response } from 'express'
import HTTP_STATUS from '~/constants/httpStatus'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'
import { envConfig } from '~/constants/config'
config()
const s3s = new S3Client({
  region: envConfig.region,
  credentials: {
    secretAccessKey: envConfig.secretAccessKey as string,
    accessKeyId: envConfig.accessKeyId as string
  }
})
const s3 = new S3({
  region: envConfig.region,
  credentials: {
    secretAccessKey: envConfig.secretAccessKey as string,
    accessKeyId: envConfig.accessKeyId as string
  }
})
export const uploadFileS3 = async ({
  filename,
  filePath,
  contentType
}: {
  filename: string
  filePath: string
  contentType: string
}) => {
  const parallelUploads3 = await new Upload({
    client: s3,
    params: {
      Bucket: envConfig.Bucket_Name as string,
      Key: filename,
      Body: fs.readFileSync(filePath),
      ContentType: contentType
    },

    // optional tags
    tags: [
      /*...*/
    ],

    // additional optional fields show default values below:

    // (optional) concurrency configuration
    queueSize: 4,

    // (optional) size of each part, in bytes, at least 5MB
    partSize: 1024 * 1024 * 5,

    // (optional) when true, do not automatically call AbortMultipartUpload when
    // a multipart upload fails to complete. You should then manually handle
    // the leftover parts.
    leavePartsOnError: false
  })

  return parallelUploads3.done()
}

export const sendFileFromS3 = async (res: Response, filepath: string) => {
  try {
    const data = await s3.getObject({
      Bucket: envConfig.Bucket_Name as string,
      Key: filepath
    })
    res.setHeader('Content-Type', data.ContentType as string)
    res.setHeader('Content-Length', data.ContentLength as number)
    ;(data.Body as any)?.pipe(res)
  } catch (error) {
    res.status(HTTP_STATUS.NOT_FOUND).send('Not Found')
  }
}
export const deleteFileFromS3 = async (s3Url: string): Promise<void> => {
  try {
    const bucketName = envConfig.Bucket_Name as string
    const urlPattern = `https://${bucketName}.s3.${envConfig.region}.amazonaws.com/`
    const fileKey = s3Url.replace(urlPattern, '')

    await s3.deleteObject({
      Bucket: bucketName,
      Key: fileKey
    })

    console.log(`File ${fileKey} đã được xóa khỏi S3`)
  } catch (error) {
    console.error('Lỗi khi xóa file từ S3:', error)
    throw new Error('Không thể xóa file trên S3')
  }
}

function parseS3Url(s3Url: string): {
  bucket: string
  key: string
} {
  const cleanUrl = s3Url.replace(/^(s3:\/\/|https:\/\/|http:\/\/)/, '').replace(/^[^/]+\.s3\.[^/]+\//, '') // Remove s3 endpoint if present
  const parts = cleanUrl.split('/')
  const bucket = parts[0]
  const key = parts.slice(1).join('/')

  return {
    bucket,
    key: decodeURIComponent(key)
  }
}

export const deleteS3Folder = async (folderPath: string): Promise<void> => {
  try {
    const { bucket, key } = parseS3Url(folderPath)

    const prefix = key.endsWith('/') ? key : key + '/'

    const listVersionsCommand = new ListObjectVersionsCommand({
      Bucket: bucket,
      Prefix: prefix
    })

    const listResponse = await s3.send(listVersionsCommand)

    const objectsToDelete: { Key: string; VersionId?: string }[] = []

    if (listResponse.Versions) {
      objectsToDelete.push(
        ...listResponse.Versions.map((version) => ({
          Key: version.Key!,
          VersionId: version.VersionId
        }))
      )
    }

    if (listResponse.DeleteMarkers) {
      objectsToDelete.push(
        ...listResponse.DeleteMarkers.map((marker) => ({
          Key: marker.Key!,
          VersionId: marker.VersionId
        }))
      )
    }

    if (objectsToDelete.length > 0) {
      const batchSize = 1000
      for (let i = 0; i < objectsToDelete.length; i += batchSize) {
        const batch = objectsToDelete.slice(i, i + batchSize)

        const deleteCommand = new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: batch,
            Quiet: false
          }
        })

        const deleteResponse = await s3.send(deleteCommand)

        console.log(`Đã xóa ${deleteResponse.Deleted?.length || 0} đối tượng`)
      }

      console.log(`Đã xóa toàn bộ nội dung của thư mục ${prefix}`)
    } else {
      console.log('Không tìm thấy các đối tượng để xóa')
    }
  } catch (error) {
    console.error('Lỗi khi xóa thư mục S3:', error)
    throw new Error(`Không thể xóa thư mục: ${(error as any).message}`)
  }
}
