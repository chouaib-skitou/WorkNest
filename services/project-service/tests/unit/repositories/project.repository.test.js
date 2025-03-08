/**
 * tests/unit/repositories/project.repository.test.js
 */

jest.mock("../../../config/database.js", () => ({
    prisma: {
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  }));
  
  import { prisma } from "../../../config/database.js";
  import { ProjectRepository } from "../../../repositories/project.repository.js";
  
  describe("ProjectRepository", () => {
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    describe("findUnique", () => {
      it("should call prisma.project.findUnique with correct options and return the result", async () => {
        const mockOptions = { where: { id: "abc-123" }, select: { name: true } };
        const mockResult = { id: "abc-123", name: "Sample Project" };
        prisma.project.findUnique.mockResolvedValue(mockResult);
  
        const result = await ProjectRepository.findUnique(mockOptions);
  
        expect(prisma.project.findUnique).toHaveBeenCalledTimes(1);
        expect(prisma.project.findUnique).toHaveBeenCalledWith(mockOptions);
        expect(result).toEqual(mockResult);
      });
  
      it("should return null if no record found", async () => {
        prisma.project.findUnique.mockResolvedValue(null);
        const result = await ProjectRepository.findUnique({ where: { id: "not-found" } });
        expect(result).toBeNull();
      });
  
      it("should propagate errors from prisma.project.findUnique", async () => {
        const error = new Error("Database error");
        prisma.project.findUnique.mockRejectedValue(error);
  
        await expect(
          ProjectRepository.findUnique({ where: { id: "fail" } })
        ).rejects.toThrow("Database error");
      });
    });
  
    describe("findMany", () => {
      it("should call prisma.project.findMany with correct options and return results", async () => {
        const mockOptions = { where: { name: { contains: "test" } }, take: 5 };
        const mockResults = [{ id: "1" }, { id: "2" }];
        prisma.project.findMany.mockResolvedValue(mockResults);
  
        const result = await ProjectRepository.findMany(mockOptions);
  
        expect(prisma.project.findMany).toHaveBeenCalledTimes(1);
        expect(prisma.project.findMany).toHaveBeenCalledWith(mockOptions);
        expect(result).toEqual(mockResults);
      });
  
      it("should return an empty array if no records found", async () => {
        prisma.project.findMany.mockResolvedValue([]);
        const result = await ProjectRepository.findMany({});
        expect(result).toEqual([]);
      });
  
      it("should propagate errors from prisma.project.findMany", async () => {
        const error = new Error("findMany error");
        prisma.project.findMany.mockRejectedValue(error);
  
        await expect(ProjectRepository.findMany({})).rejects.toThrow("findMany error");
      });
    });
  
    describe("count", () => {
      it("should call prisma.project.count with correct options and return the count", async () => {
        const mockOptions = { where: { status: "ACTIVE" } };
        prisma.project.count.mockResolvedValue(42);
  
        const result = await ProjectRepository.count(mockOptions);
  
        expect(prisma.project.count).toHaveBeenCalledTimes(1);
        expect(prisma.project.count).toHaveBeenCalledWith(mockOptions);
        expect(result).toBe(42);
      });
  
      it("should propagate errors from prisma.project.count", async () => {
        const error = new Error("count error");
        prisma.project.count.mockRejectedValue(error);
  
        await expect(ProjectRepository.count({})).rejects.toThrow("count error");
      });
    });
  
    describe("create", () => {
      it("should call prisma.project.create with correct data and return the created project", async () => {
        const mockData = { name: "New Project", description: "Test desc" };
        const mockCreated = { id: "created-123", ...mockData };
        prisma.project.create.mockResolvedValue(mockCreated);
  
        const result = await ProjectRepository.create(mockData);
  
        expect(prisma.project.create).toHaveBeenCalledTimes(1);
        expect(prisma.project.create).toHaveBeenCalledWith({ data: mockData });
        expect(result).toEqual(mockCreated);
      });
  
      it("should propagate errors from prisma.project.create", async () => {
        const error = new Error("create error");
        prisma.project.create.mockRejectedValue(error);
  
        await expect(ProjectRepository.create({ name: "Fail" })).rejects.toThrow("create error");
      });
    });
  
    describe("update", () => {
      it("should call prisma.project.update with correct args and return the updated project", async () => {
        const mockId = "abc-123";
        const mockData = { name: "Updated Name" };
        const mockUpdated = { id: mockId, ...mockData };
  
        prisma.project.update.mockResolvedValue(mockUpdated);
  
        const result = await ProjectRepository.update(mockId, mockData);
  
        expect(prisma.project.update).toHaveBeenCalledTimes(1);
        expect(prisma.project.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: mockData,
        });
        expect(result).toEqual(mockUpdated);
      });
  
      it("should call prisma.project.update with include if provided", async () => {
        const mockId = "abc-123";
        const mockData = { name: "Updated Name" };
        const mockInclude = { stages: true };
        const mockUpdated = { id: mockId, ...mockData, stages: [] };
  
        prisma.project.update.mockResolvedValue(mockUpdated);
  
        const result = await ProjectRepository.update(mockId, mockData, mockInclude);
  
        expect(prisma.project.update).toHaveBeenCalledTimes(1);
        expect(prisma.project.update).toHaveBeenCalledWith({
          where: { id: mockId },
          data: mockData,
          include: mockInclude,
        });
        expect(result).toEqual(mockUpdated);
      });
  
      it("should propagate errors from prisma.project.update", async () => {
        const error = new Error("update error");
        prisma.project.update.mockRejectedValue(error);
  
        await expect(ProjectRepository.update("id-123", {})).rejects.toThrow("update error");
      });
    });
  
    describe("delete", () => {
      it("should call prisma.project.delete with correct id and return the deleted project", async () => {
        const mockId = "abc-123";
        const mockDeleted = { id: mockId, name: "Deleted Project" };
        prisma.project.delete.mockResolvedValue(mockDeleted);
  
        const result = await ProjectRepository.delete(mockId);
  
        expect(prisma.project.delete).toHaveBeenCalledTimes(1);
        expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: mockId } });
        expect(result).toEqual(mockDeleted);
      });
  
      it("should propagate errors from prisma.project.delete", async () => {
        const error = new Error("delete error");
        prisma.project.delete.mockRejectedValue(error);
  
        await expect(ProjectRepository.delete("bad-id")).rejects.toThrow("delete error");
      });
    });
  });
  