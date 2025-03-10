// routes/storage.routes.js
import express from "express";
import multer from "multer";
import { StorageController } from "../controllers/storage.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Document Storage
 *   description: API for document storage operations
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a new document
 *     description: Uploads a document to the storage service.
 *     tags: [Storage]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully.
 *       400:
 *         description: No file uploaded.
 *       500:
 *         description: Failed to upload document.
 */
router.post("/documents", upload.single("file"), StorageController.upload);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List documents
 *     description: Returns a list of documents stored in the service.
 *     tags: [Storage]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of documents per page.
 *       - in: query
 *         name: pageToken
 *         schema:
 *           type: string
 *         description: Token for pagination.
 *     responses:
 *       200:
 *         description: A list of documents.
 *       500:
 *         description: Failed to list documents.
 */
router.get("/documents", StorageController.list);

/**
 * @swagger
 * /api/documents/{fileId}:
 *   get:
 *     summary: Get document metadata
 *     description: Retrieves metadata for a specific document by its ID.
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document.
 *     responses:
 *       200:
 *         description: Document metadata retrieved successfully.
 *       500:
 *         description: Failed to retrieve document metadata.
 */
router.get("/documents/:fileId", StorageController.get);

/**
 * @swagger
 * /api/documents/{fileId}:
 *   put:
 *     summary: Update a document
 *     description: Updates the document content and/or metadata. Provide a new file to update content or a newName to update metadata.
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document to update.
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully.
 *       500:
 *         description: Failed to update document.
 */
router.put("/documents/:fileId", upload.single("file"), StorageController.update);

/**
 * @swagger
 * /api/documents/{fileId}:
 *   patch:
 *     summary: Partially update a document
 *     description: Updates parts of a document (e.g. metadata) without replacing the entire file.
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document to update.
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               newName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document updated successfully.
 *       500:
 *         description: Failed to update document.
 */
router.patch("/documents/:fileId", upload.single("file"), StorageController.update);

/**
 * @swagger
 * /api/documents/{fileId}:
 *   delete:
 *     summary: Delete a document
 *     description: Deletes a document from the storage service.
 *     tags: [Storage]
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document to delete.
 *     responses:
 *       200:
 *         description: Document deleted successfully.
 *       500:
 *         description: Failed to delete document.
 */
router.delete("/documents/:fileId", StorageController.delete);

export default router;
