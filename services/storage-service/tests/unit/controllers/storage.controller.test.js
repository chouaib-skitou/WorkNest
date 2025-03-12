jest.mock("../../../services/storage.service.js", () => ({
  uploadDocument: jest.fn(),
  updateDocument: jest.fn(),
  deleteDocument: jest.fn(),
  listDocuments: jest.fn(),
  getDocument: jest.fn(),
}));

import { StorageController } from "../../../controllers/storage.controller.js";
import {
  uploadDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  getDocument,
} from "../../../services/storage.service.js";

describe("Storage Controller", () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("upload", () => {
    it("should upload a file successfully", async () => {
      const mockFile = { originalname: "test.txt" };
      const uploadResult = {
        message: "Document created successfully",
        data: {
          id: "test.txt",
          name: "test.txt",
          location: "http://example.com/test.txt",
        },
      };

      mockRequest.file = mockFile;
      uploadDocument.mockResolvedValueOnce(uploadResult);

      await StorageController.upload(mockRequest, mockResponse);

      expect(uploadDocument).toHaveBeenCalledWith(mockFile);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(uploadResult);
    });

    it("should return 400 when no file is provided", async () => {
      mockRequest.file = undefined;

      await StorageController.upload(mockRequest, mockResponse);

      expect(uploadDocument).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "No file uploaded",
      });
    });

    it("should handle errors during upload", async () => {
      const mockFile = { originalname: "test.txt" };
      const uploadError = new Error("Upload failed");

      mockRequest.file = mockFile;
      uploadDocument.mockRejectedValueOnce(uploadError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await StorageController.upload(mockRequest, mockResponse);

      expect(uploadDocument).toHaveBeenCalledWith(mockFile);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error uploading document:",
        uploadError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to upload document",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("update", () => {
    it("should update a document successfully with new file and name", async () => {
      const docId = "original.txt";
      const mockFile = { originalname: "new.txt" };
      const mockNewName = "renamed.txt";
      const updateResult = {
        message: "Document updated and renamed successfully",
        data: { id: "renamed.txt", name: "renamed.txt" },
      };

      mockRequest.params = { id: docId };
      mockRequest.file = mockFile;
      mockRequest.body = { newName: mockNewName };
      updateDocument.mockResolvedValueOnce(updateResult);

      await StorageController.update(mockRequest, mockResponse);

      expect(updateDocument).toHaveBeenCalledWith(docId, mockFile, mockNewName);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updateResult);
    });

    it("should update with just new file (no rename)", async () => {
      const docId = "original.txt";
      const mockFile = { originalname: "new.txt" };
      const updateResult = {
        message: "Document updated successfully",
        data: { id: "original.txt", name: "original.txt" },
      };

      mockRequest.params = { id: docId };
      mockRequest.file = mockFile;
      mockRequest.body = {};
      updateDocument.mockResolvedValueOnce(updateResult);

      await StorageController.update(mockRequest, mockResponse);

      expect(updateDocument).toHaveBeenCalledWith(docId, mockFile, undefined);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updateResult);
    });

    it("should update with just new name (no file)", async () => {
      const docId = "original.txt";
      const mockNewName = "renamed.txt";
      const updateResult = {
        message: "Document renamed successfully",
        data: { id: "renamed.txt", name: "renamed.txt" },
      };

      mockRequest.params = { id: docId };
      mockRequest.file = undefined;
      mockRequest.body = { newName: mockNewName };
      updateDocument.mockResolvedValueOnce(updateResult);

      await StorageController.update(mockRequest, mockResponse);

      expect(updateDocument).toHaveBeenCalledWith(
        docId,
        undefined,
        mockNewName
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updateResult);
    });

    it("should handle errors during update", async () => {
      const docId = "original.txt";
      const updateError = new Error("Update failed");

      mockRequest.params = { id: docId };
      updateDocument.mockRejectedValueOnce(updateError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await StorageController.update(mockRequest, mockResponse);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to update document",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("delete", () => {
    it("should delete a document successfully", async () => {
      const docId = "delete-me.txt";
      const deleteResult = { message: "File deleted successfully" };

      mockRequest.params = { id: docId };
      deleteDocument.mockResolvedValueOnce(deleteResult);

      await StorageController.delete(mockRequest, mockResponse);

      expect(deleteDocument).toHaveBeenCalledWith(docId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(deleteResult);
    });

    it("should handle errors during delete", async () => {
      const docId = "delete-me.txt";
      const deleteError = new Error("Delete failed");

      mockRequest.params = { id: docId };
      deleteDocument.mockRejectedValueOnce(deleteError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await StorageController.delete(mockRequest, mockResponse);

      expect(deleteDocument).toHaveBeenCalledWith(docId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting document:",
        deleteError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to delete document",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("list", () => {
    it("should list documents successfully", async () => {
      const queryParams = { pageSize: "20", pageToken: "token123" };
      const listResult = {
        message: "Documents listed successfully",
        data: {
          nextPageToken: "next-token",
          files: [{ id: "file1.txt", name: "file1.txt" }],
        },
      };

      mockRequest.query = queryParams;
      listDocuments.mockResolvedValueOnce(listResult);

      await StorageController.list(mockRequest, mockResponse);

      expect(listDocuments).toHaveBeenCalledWith(queryParams);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(listResult);
    });

    it("should handle empty query parameters", async () => {
      const listResult = {
        message: "Documents listed successfully",
        data: {
          files: [{ id: "file1.txt", name: "file1.txt" }],
        },
      };

      mockRequest.query = {};
      listDocuments.mockResolvedValueOnce(listResult);

      await StorageController.list(mockRequest, mockResponse);

      expect(listDocuments).toHaveBeenCalledWith({});
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(listResult);
    });

    it("should handle errors during list", async () => {
      const listError = new Error("List failed");

      mockRequest.query = {};
      listDocuments.mockRejectedValueOnce(listError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await StorageController.list(mockRequest, mockResponse);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing documents:",
        listError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to list documents",
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("get", () => {
    it("should get document metadata successfully", async () => {
      const docId = "get-me.txt";
      const getResult = {
        message: "Document metadata retrieved successfully",
        data: { id: docId, name: docId, ContentType: "text/plain" },
      };

      mockRequest.params = { id: docId };
      getDocument.mockResolvedValueOnce(getResult);

      await StorageController.get(mockRequest, mockResponse);

      expect(getDocument).toHaveBeenCalledWith(docId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(getResult);
    });

    it("should handle errors during get", async () => {
      const docId = "get-me.txt";
      const getError = new Error("Get failed");

      mockRequest.params = { id: docId };
      getDocument.mockRejectedValueOnce(getError);

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      await StorageController.get(mockRequest, mockResponse);

      expect(getDocument).toHaveBeenCalledWith(docId);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting document:",
        getError
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to get document",
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
