import express from "express";
import multer from "multer";
import { StorageController } from "../controllers/storage.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/**
 * @swagger
 * tags:
 *   name: Storage
 *   description: API for document storage operations using MinIO.
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a new document
 *     description: Uploads a document to the storage service.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to upload document.
 */
router.post(
  "/documents",
  authMiddleware,
  upload.single("file"),
  StorageController.upload
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: List documents
 *     description: Returns a list of documents stored in the service.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to list documents.
 */
router.get("/documents", authMiddleware, StorageController.list);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document metadata
 *     description: Retrieves metadata for a specific document by its ID.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document.
 *     responses:
 *       200:
 *         description: Document metadata retrieved successfully.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to retrieve document metadata.
 */
router.get("/documents/:id", authMiddleware, StorageController.get);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update a document
 *     description: Updates the document content and/or metadata. Provide a new file for content or a newName for metadata update.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to update document.
 */
router.put(
  "/documents/:id",
  authMiddleware,
  upload.single("file"),
  StorageController.update
);

/**
 * @swagger
 * /api/documents/{id}:
 *   patch:
 *     summary: Partially update a document
 *     description: Updates parts of a document (e.g., metadata) without replacing the entire file.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to update document.
 */
router.patch(
  "/documents/:id",
  authMiddleware,
  upload.single("file"),
  StorageController.update
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: Deletes a document from the storage service.
 *     tags: [Storage]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the document to delete.
 *     responses:
 *       200:
 *         description: Document deleted successfully.
 *       401:
 *         description: Unauthorized - Invalid or missing token.
 *       403:
 *         description: Forbidden - User doesn't have permissions.
 *       500:
 *         description: Failed to delete document.
 */
router.delete("/documents/:id", authMiddleware, StorageController.delete);

export default router;
