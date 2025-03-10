// controllers/storage.controller.js
import {
    uploadDocument,
    updateDocument,
    deleteDocument,
    listDocuments,
    getDocument,
  } from "../services/storage.service.js";
  
  /**
   * Controller for storage operations.
   */
  export const StorageController = {
    async upload(req, res) {
      try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: "No file uploaded" });
        const data = await uploadDocument(file);
        res.status(201).json(data);
      } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({ error: "Failed to upload document" });
      }
    },
    async update(req, res) {
      try {
        const { fileId } = req.params;
        const file = req.file; // optional new content
        const newName = req.body.newName; // optional new name
        const data = await updateDocument(fileId, file, newName);
        res.status(200).json(data);
      } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Failed to update document" });
      }
    },
    async delete(req, res) {
      try {
        const { fileId } = req.params;
        const data = await deleteDocument(fileId);
        res.status(200).json(data);
      } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Failed to delete document" });
      }
    },
    async list(req, res) {
      try {
        const data = await listDocuments(req.query);
        res.status(200).json(data);
      } catch (error) {
        console.error("Error listing documents:", error);
        res.status(500).json({ error: "Failed to list documents" });
      }
    },
    async get(req, res) {
      try {
        const { fileId } = req.params;
        const data = await getDocument(fileId);
        res.status(200).json(data);
      } catch (error) {
        console.error("Error getting document:", error);
        res.status(500).json({ error: "Failed to get document" });
      }
    },
  };
  