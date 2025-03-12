process.env.MINIO_BUCKET = "test-bucket";
process.env.MINIO_ENDPOINT = "http://localhost:9000";
process.env.MINIO_ACCESS_KEY = "test-key";
process.env.MINIO_SECRET_KEY = "test-secret";

jest.mock("aws-sdk", () => {
  const uploadPromise = jest.fn();
  const deletePromise = jest.fn();
  const copyPromise = jest.fn();
  const listPromise = jest.fn();
  const headPromise = jest.fn();

  return {
    S3: jest.fn().mockImplementation(() => ({
      upload: jest.fn(() => ({ promise: uploadPromise })),
      deleteObject: jest.fn(() => ({ promise: deletePromise })),
      copyObject: jest.fn(() => ({ promise: copyPromise })),
      listObjectsV2: jest.fn(() => ({ promise: listPromise })),
      headObject: jest.fn(() => ({ promise: headPromise })),
    })),
    mockPromises: {
      uploadPromise,
      deletePromise,
      copyPromise,
      listPromise,
      headPromise,
    },
  };
});

jest.mock("fs", () => ({
  createReadStream: jest.fn().mockReturnValue("mockFileStream"),
  unlink: jest.fn((path, callback) => callback(null)),
}));

import AWS from "aws-sdk";
import {
  uploadDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  getDocument,
} from "../../../services/storage.service.js";

describe("Storage Service", () => {
  let s3;
  let mockPromises;

  beforeEach(() => {
    jest.clearAllMocks();
    s3 = new AWS.S3();
    mockPromises = AWS.mockPromises;
  });

  describe("uploadDocument", () => {
    const mockFile = {
      path: "/tmp/mock-file",
      originalname: "test-file.txt",
      mimetype: "text/plain",
    };

    it("should upload a document successfully", async () => {
      const mockData = {
        Key: "test-file.txt",
        Location: "http://minio-server/test-bucket/test-file.txt",
      };
      mockPromises.uploadPromise.mockResolvedValueOnce(mockData);

      const result = await uploadDocument(mockFile);

      expect(result).toEqual({
        message: "Document created successfully",
        data: {
          id: mockData.Key,
          name: mockData.Key,
          location: mockData.Location,
        },
      });
    });

    it("should handle fs.unlink error", async () => {
      const mockData = {
        Key: "test-file.txt",
        Location: "http://minio-server/test-bucket/test-file.txt",
      };
      mockPromises.uploadPromise.mockResolvedValueOnce(mockData);

      const fsUnlink = require("fs").unlink;
      fsUnlink.mockImplementationOnce((path, callback) => {
        callback(new Error("Unlink error"));
      });

      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await uploadDocument(mockFile);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting local file:",
        expect.any(Error)
      );
      expect(result).toEqual({
        message: "Document created successfully",
        data: {
          id: mockData.Key,
          name: mockData.Key,
          location: mockData.Location,
        },
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle upload error", async () => {
      const error = new Error("Upload failed");
      mockPromises.uploadPromise.mockRejectedValueOnce(error);

      await expect(uploadDocument(mockFile)).rejects.toThrow("Upload failed");
    });
  });

  describe("updateDocument", () => {
    const fileId = "existing-file.txt";
    const mockFile = {
      path: "/tmp/mock-file",
      originalname: "new-file.txt",
      mimetype: "text/plain",
    };
    const newName = "renamed-file.txt";

    it("should update document content only (no rename)", async () => {
      const mockData = {
        Key: fileId,
        Location: `http://minio-server/test-bucket/${fileId}`,
      };
      mockPromises.uploadPromise.mockResolvedValueOnce(mockData);

      const result = await updateDocument(fileId, mockFile);

      expect(result).toEqual({
        message: "Document updated successfully",
        data: {
          id: fileId,
          name: fileId,
          location: mockData.Location,
        },
      });
    });

    it("should update document content and rename", async () => {
      const mockData = {
        Key: newName,
        Location: `http://minio-server/test-bucket/${newName}`,
      };
      mockPromises.uploadPromise.mockResolvedValueOnce(mockData);
      mockPromises.deletePromise.mockResolvedValueOnce({});

      const result = await updateDocument(fileId, mockFile, newName);

      expect(result).toEqual({
        message: "Document updated and renamed successfully",
        data: {
          id: newName,
          name: newName,
          location: mockData.Location,
        },
      });
    });

    it("should rename document only (no new content)", async () => {
      mockPromises.copyPromise.mockResolvedValueOnce({});
      mockPromises.deletePromise.mockResolvedValueOnce({});

      const result = await updateDocument(fileId, null, newName);

      expect(result).toEqual({
        message: "Document renamed successfully",
        data: {
          id: newName,
          name: newName,
        },
      });
    });

    it("should throw error if nothing to update", async () => {
      await expect(updateDocument(fileId)).rejects.toThrow("Nothing to update");
    });

    it("should handle update errors", async () => {
      const error = new Error("Update failed");
      mockPromises.uploadPromise.mockRejectedValueOnce(error);

      await expect(updateDocument(fileId, mockFile)).rejects.toThrow(
        "Update failed"
      );
    });

    it("should handle copy errors when renaming", async () => {
      const error = new Error("Copy failed");
      mockPromises.copyPromise.mockRejectedValueOnce(error);

      await expect(updateDocument(fileId, null, newName)).rejects.toThrow(
        "Copy failed"
      );
    });

    it("should handle delete errors during rename", async () => {
      mockPromises.copyPromise.mockResolvedValueOnce({});

      const error = new Error("Delete failed");
      mockPromises.deletePromise.mockRejectedValueOnce(error);

      await expect(updateDocument(fileId, null, newName)).rejects.toThrow(
        "Delete failed"
      );
    });
  });

  describe("deleteDocument", () => {
    const fileId = "file-to-delete.txt";

    it("should delete a document successfully", async () => {
      mockPromises.deletePromise.mockResolvedValueOnce({});

      const result = await deleteDocument(fileId);

      expect(result).toEqual({
        message: "File deleted successfully",
      });
    });

    it("should handle delete errors", async () => {
      const error = new Error("Delete failed");
      mockPromises.deletePromise.mockRejectedValueOnce(error);

      await expect(deleteDocument(fileId)).rejects.toThrow("Delete failed");
    });
  });

  describe("listDocuments", () => {
    it("should list documents with default pagination", async () => {
      const mockDate = new Date();
      const mockData = {
        Contents: [
          { Key: "file1.txt", Size: 100, LastModified: mockDate },
          { Key: "file2.txt", Size: 200, LastModified: mockDate },
        ],
        NextContinuationToken: "token123",
      };
      mockPromises.listPromise.mockResolvedValueOnce(mockData);

      const result = await listDocuments({});

      expect(result).toEqual({
        message: "Documents listed successfully",
        data: {
          nextPageToken: "token123",
          files: [
            {
              id: "file1.txt",
              name: "file1.txt",
              size: 100,
              lastModified: mockDate,
            },
            {
              id: "file2.txt",
              name: "file2.txt",
              size: 200,
              lastModified: mockDate,
            },
          ],
        },
      });
    });

    it("should list documents with custom pagination", async () => {
      const mockDate = new Date();
      const mockData = {
        Contents: [{ Key: "file1.txt", Size: 100, LastModified: mockDate }],
        NextContinuationToken: "token456",
      };
      mockPromises.listPromise.mockResolvedValueOnce(mockData);

      const result = await listDocuments({
        pageSize: "5",
        pageToken: "token123",
      });

      expect(result).toEqual({
        message: "Documents listed successfully",
        data: {
          nextPageToken: "token456",
          files: [
            {
              id: "file1.txt",
              name: "file1.txt",
              size: 100,
              lastModified: mockDate,
            },
          ],
        },
      });
    });

    it("should handle listing errors", async () => {
      const error = new Error("Listing failed");
      mockPromises.listPromise.mockRejectedValueOnce(error);

      await expect(listDocuments({})).rejects.toThrow("Listing failed");
    });
  });

  describe("getDocument", () => {
    const fileId = "test-file.txt";

    it("should get document metadata successfully", async () => {
      const mockDate = new Date();
      const mockData = {
        ContentType: "text/plain",
        ContentLength: 100,
        LastModified: mockDate,
      };
      mockPromises.headPromise.mockResolvedValueOnce(mockData);

      const result = await getDocument(fileId);

      expect(result).toEqual({
        message: "Document metadata retrieved successfully",
        data: {
          id: fileId,
          name: fileId,
          ContentType: "text/plain",
          ContentLength: 100,
          LastModified: mockDate,
        },
      });
    });

    it("should handle errors when getting document", async () => {
      const error = new Error("Head request failed");
      mockPromises.headPromise.mockRejectedValueOnce(error);

      await expect(getDocument(fileId)).rejects.toThrow("Head request failed");
    });
  });
});
