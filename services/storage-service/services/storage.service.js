import fs from "fs";
import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

// Separate ENV variables
const INTERNAL_ENDPOINT = process.env.MINIO_INTERNAL_ENDPOINT; // e.g. "http://minio:9000"
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL;              // e.g. "http://localhost:9000"
const BUCKET = process.env.MINIO_BUCKET;                      // e.g. "worknest-bucket"

// Configure AWS SDK for S3 to work with MinIO internally
const s3 = new AWS.S3({
  endpoint: INTERNAL_ENDPOINT,
  accessKeyId: process.env.MINIO_ACCESS_KEY,
  secretAccessKey: process.env.MINIO_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: "v4",
});

/**
 * Helper to build a public-facing URL for a given object key.
 * This ensures the user sees a link that includes the bucket name in the path.
 */
function getPublicLink(key) {
  // e.g., returns: "http://localhost:9000/worknest-bucket/myfile.png"
  return `${PUBLIC_URL}/${BUCKET}/${key}`;
}

/**
 * Uploads a document to MinIO.
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

  // Delete temp file from /uploads
  fs.unlink(file.path, (err) => {
    if (err) {
      console.error("Error deleting local file:", err);
    } else {
      console.log("Temporary file deleted successfully.");
    }
  });

  // Return a public-facing link that includes bucket name
  const publicLink = getPublicLink(data.Key);

  return {
    message: "Document created successfully",
    data: {
      id: data.Key,
      name: data.Key,
      location: publicLink,
    },
  };
};

/**
 * Updates a document on MinIO.
 */
export const updateDocument = async (fileId, file, newName) => {
  if (file) {
    const key = newName || fileId;
    const fileStream = fs.createReadStream(file.path);
    const params = {
      Bucket: BUCKET,
      Key: key,
      Body: fileStream,
      ContentType: file.mimetype,
    };

    const data = await s3.upload(params).promise();

    if (newName && newName !== fileId) {
      await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();
      return {
        message: "Document updated and renamed successfully",
        data: {
          id: key,
          name: key,
          location: getPublicLink(key),
        },
      };
    }

    return {
      message: "Document updated successfully",
      data: {
        id: key,
        name: key,
        location: getPublicLink(key),
      },
    };
  } else if (newName) {
    await s3
      .copyObject({
        Bucket: BUCKET,
        CopySource: `${BUCKET}/${fileId}`,
        Key: newName,
      })
      .promise();

    await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();

    return {
      message: "Document renamed successfully",
      data: {
        id: newName,
        name: newName,
        location: getPublicLink(newName),
      },
    };
  }

  throw new Error("Nothing to update");
};

/**
 * Deletes a document from MinIO.
 */
export const deleteDocument = async (fileId) => {
  await s3.deleteObject({ Bucket: BUCKET, Key: fileId }).promise();
  return { message: "File deleted successfully" };
};

/**
 * Lists documents in MinIO.
 */
export const listDocuments = async (queryParams) => {
  const params = {
    Bucket: BUCKET,
    MaxKeys: queryParams.pageSize ? parseInt(queryParams.pageSize, 10) : 10,
    ContinuationToken: queryParams.pageToken || undefined,
  };

  const data = await s3.listObjectsV2(params).promise();

  const files = data.Contents.map((item) => ({
    id: item.Key,
    name: item.Key,
    size: item.Size,
    lastModified: item.LastModified,
    location: getPublicLink(item.Key), // now includes bucket in path
  }));

  return {
    message: "Documents listed successfully",
    data: {
      nextPageToken: data.NextContinuationToken,
      files,
    },
  };
};

/**
 * Retrieves metadata for a specific document in MinIO.
 */
export const getDocument = async (fileId) => {
  const data = await s3.headObject({ Bucket: BUCKET, Key: fileId }).promise();

  return {
    message: "Document metadata retrieved successfully",
    data: {
      id: fileId,
      name: fileId,
      location: getPublicLink(fileId),  // includes bucket
      ...data,
    },
  };
};
