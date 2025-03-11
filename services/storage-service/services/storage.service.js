// services/storage.service.js
import fs from "fs";
import AWS from "aws-sdk";
import dotenv from "dotenv";
dotenv.config();

// Configure AWS SDK for S3 to work with MinIO
const s3 = new AWS.S3({
  endpoint: process.env.MINIO_ENDPOINT, // e.g., "http://minio:9000"
  accessKeyId: process.env.MINIO_ACCESS_KEY, // e.g., "root" (or "rootroot")
  secretAccessKey: process.env.MINIO_SECRET_KEY, // e.g., "rootroot" (min 8 characters)
  s3ForcePathStyle: true, // required for MinIO
  signatureVersion: "v4",
});

const BUCKET = process.env.MINIO_BUCKET; // e.g., "worknest_bucket"

/**
 * Uploads a document to MinIO.
 * @param {Object} file - The file object from multer.
 * @returns {Promise<Object>} - Returns an object containing the file's key, name, and location.
 */
export const uploadDocument = async (file) => {
  const fileStream = fs.createReadStream(file.path);
  const params = {
    Bucket: BUCKET,
    Key: file.originalname,
    Body: fileStream,
    ContentType: file.mimetype,
  };
  const data = await s3.upload(params).promise();
  return { id: data.Key, name: data.Key, location: data.Location };
};

/**
 * Updates a document on MinIO.
 * If a new file is provided, its content will replace the existing one.
 * If a new name is provided, the file is renamed by copying then deleting the original.
 * @param {string} fileId - The current key (filename) of the document.
 * @param {Object} file - Optional file object for new content.
 * @param {string} newName - Optional new name for the document.
 * @returns {Promise<Object>} - Returns updated file metadata.
 */
export const updateDocument = async (fileId, file, newName) => {
  if (file) {
    // Use newName if provided, otherwise use the existing fileId.
    const key = newName || fileId;
    const fileStream = fs.createReadStream(file.path);
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    };
    const data = await s3.upload(params).promise();
    // If renaming, delete the old file
    if (newName && newName !== fileId) {
      await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();
    }
    return { id: key, name: key, location: data.Location };
  } else if (newName) {
    // Rename the file by copying then deleting the original
    await s3.copyObject({
      Bucket: BUCKET,
      CopySource: `${BUCKET}/${fileId}`,
      Key: newName,
    }).promise();
    await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();
    return { id: newName, name: newName };
  }
  throw new Error("Nothing to update");
};

/**
 * Deletes a document from MinIO.
 * @param {string} fileId - The key (filename) of the document.
 * @returns {Promise<Object>} - Returns a confirmation message.
 */
export const deleteDocument = async (fileId) => {
  await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();
  return { message: "File deleted successfully" };
};

/**
 * Lists documents stored in MinIO.
 * Supports pagination using continuation tokens.
 * @param {Object} queryParams - { pageSize, pageToken }.
 * @returns {Promise<Object>} - Returns an object containing a list of files and a nextPageToken.
 */
export const listDocuments = async (queryParams) => {
  const params = {
    Bucket: BUCKET,
    MaxKeys: queryParams.pageSize ? parseInt(queryParams.pageSize) : 10,
    ContinuationToken: queryParams.pageToken || undefined,
  };
  const data = await s3.listObjectsV2(params).promise();
  return {
    nextPageToken: data.NextContinuationToken,
    files: data.Contents.map(item => ({
      id: item.Key,
      name: item.Key,
      size: item.Size,
      lastModified: item.LastModified,
    })),
  };
};

/**
 * Retrieves metadata for a specific document stored in MinIO.
 * @param {string} fileId - The key (filename) of the document.
 * @returns {Promise<Object>} - Returns file metadata.
 */
export const getDocument = async (fileId) => {
  const data = await s3.headObject({ Bucket: BUCKET, Key: fileId }).promise();
  return { id: fileId, name: fileId, ...data };
};
