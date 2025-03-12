import {
  uploadDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  getDocument,
} from "../services/storage.service.js";

/**
 * Storage Controller handles REST API operations for document storage.
 */
export const StorageController = {
  /**
   * Upload a new document.
   * Expects a file under the "file" field in a multipart/form-data request.
   */
  async upload(req, res) {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      const result = await uploadDocument(file);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ error: "Failed to upload document" });
    }
  },

  /**
   * Update an existing document.
   * Expects id in req.params and optionally a new file or newName in req.body.
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const file = req.file; // optional new file content
      const newName = req.body.newName; // optional new name
      const result = await updateDocument(id, file, newName);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ error: "Failed to update document" });
    }
  },

  /**
   * Delete a document.
   * Expects id in req.params.
   */
  async delete(req, res) {
    try {
      const { id } = req.params;
      const result = await deleteDocument(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  },

  /**
   * List all documents.
   * Supports pagination via query parameters.
   */
  async list(req, res) {
    try {
      const result = await listDocuments(req.query);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error listing documents:", error);
      res.status(500).json({ error: "Failed to list documents" });
    }
  },

  /**
   * Get metadata for a specific document.
   * Expects id in req.params.
   */
  async get(req, res) {
    try {
      const { id } = req.params;
      const result = await getDocument(id);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error getting document:", error);
      res.status(500).json({ error: "Failed to get document" });
    }
  },
};
