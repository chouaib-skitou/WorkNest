// services/storage.service.js
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID, 
  process.env.GOOGLE_CLIENT_SECRET, 
  process.env.GOOGLE_REDIRECT_URI
);
oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

const drive = google.drive({ version: "v3", auth: oAuth2Client });

export const uploadDocument = async (file) => {
  const fileMetadata = { name: file.originalname };
  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.path),
  };
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name",
  });
  return response.data;
};

export const updateDocument = async (fileId, file, newName) => {
  const media = file ? { mimeType: file.mimetype, body: fs.createReadStream(file.path) } : undefined;
  const metadata = newName ? { name: newName } : {};
  const response = await drive.files.update({
    fileId,
    requestBody: metadata,
    media,
    fields: "id, name",
  });
  return response.data;
};

export const deleteDocument = async (fileId) => {
  await drive.files.delete({ fileId });
  return { message: "File deleted successfully" };
};

export const listDocuments = async (queryParams) => {
  const { pageSize = 10, pageToken } = queryParams;
  const response = await drive.files.list({
    pageSize,
    pageToken,
    fields: "nextPageToken, files(id, name, mimeType, createdTime)",
  });
  return response.data;
};

export const getDocument = async (fileId) => {
  const response = await drive.files.get({
    fileId,
    fields: "id, name, mimeType, createdTime",
  });
  return response.data;
};
