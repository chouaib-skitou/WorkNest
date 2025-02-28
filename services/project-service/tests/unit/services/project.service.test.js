// tests/unit/services/project.service.test.js

jest.mock("../../../config/database.js", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(), // Added missing method
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../../config/database.js";
import { ProjectDTO, GetAllProjectsDTO } from "../../../dtos/project.dto.js";
import {
  getProjectsService,
  getProjectByIdService,
  createProjectService,
  updateProjectService,
  patchProjectService,
  deleteProjectService,
} from "../../../services/project.service.js";

describe("🛠 Project Service Tests", () => {
  let adminUser, employeeUser, managerUser, query, mockProject;

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    // jest.spyOn(console, "log").mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    // console.log.mockRestore();
  });
  
  beforeEach(() => {
    adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
    employeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" };
    managerUser = { id: "manager-id", role: "ROLE_MANAGER" };

    query = {};

    mockProject = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "WorkNest Platform",
      description: "A project management platform",
      createdBy: "creator-id",
      managerId: "manager-id",
      employeeIds: ["employee-id"],
      createdAt: new Date("2025-02-01T12:00:00.000Z"),
      updatedAt: new Date("2025-02-02T12:00:00.000Z"),
    };

    jest.clearAllMocks();
  });

  // --- getProjectsService ---
  describe("getProjectsService", () => {
    test("✅ returns projects successfully when projects exist", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const result = await getProjectsService(adminUser, query);

      expect(result).toEqual({
        data: [new GetAllProjectsDTO(mockProject)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      // Admin has no role-based filter so check that employeeIds filter is not applied.
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ employeeIds: expect.any(Object) }),
        })
      );
    });

    test("✅ returns empty result when no projects found", async () => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);

      const result = await getProjectsService(adminUser, query);
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
      });
    });

    test("✅ applies name filter correctly", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const customQuery = { name: "WorkNest" };
      await getProjectsService(adminUser, customQuery);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "WorkNest", mode: "insensitive" },
          }),
        })
      );
    });

    test("✅ applies description filter correctly", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const customQuery = { description: "management" };
      await getProjectsService(adminUser, customQuery);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: "management", mode: "insensitive" },
          }),
        })
      );
    });

    test("✅ applies createdAt filter correctly when valid date provided", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const dateStr = "2025-02-01";
      const customQuery = { createdAt: dateStr };
      const date = new Date(dateStr);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      await getProjectsService(adminUser, customQuery);
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: { gte: startOfDay, lte: endOfDay },
          }),
        })
      );
    });

    test("✅ ignores invalid createdAt filter", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const customQuery = { createdAt: "invalid-date" };
      await getProjectsService(adminUser, customQuery);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    test("✅ applies valid custom sort field", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const customQuery = { sortField: "name", sortOrder: "asc" };
      await getProjectsService(adminUser, customQuery);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });

    test("✅ defaults to createdAt sort field when unknown field provided", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const customQuery = { sortField: "invalidField", sortOrder: "desc" };
      await getProjectsService(adminUser, customQuery);

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    test("🚫 rejects with 403 when error code is P2025", async () => {
      const error = { code: "P2025" };
      prisma.project.findMany.mockRejectedValue(error);

      await expect(getProjectsService(adminUser, query)).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view projects",
      });
    });

    test("🚫 rejects with 500 for generic errors", async () => {
      const error = new Error("Database error");
      prisma.project.findMany.mockRejectedValue(error);

      await expect(getProjectsService(adminUser, query)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  // --- getProjectByIdService ---
  describe("getProjectByIdService", () => {
    test("✅ returns project successfully when found with role filter", async () => {
      prisma.project.findFirst.mockResolvedValue(mockProject);

      const result = await getProjectByIdService(adminUser, mockProject.id);
      expect(result).toEqual(new ProjectDTO(mockProject));
      expect(prisma.project.findFirst).toHaveBeenCalled();
    });

    test("🚫 rejects with 403 if findFirst returns null but project exists (access denied)", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      // Simulate project exists in DB (without role filter)
      prisma.project.findUnique.mockResolvedValue({ id: mockProject.id });

      await expect(getProjectByIdService(adminUser, mockProject.id)).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view this project",
      });
      expect(prisma.project.findUnique).toHaveBeenCalled();
    });

    test("🚫 rejects with 404 if project does not exist", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(getProjectByIdService(adminUser, "non-existent-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      const error = new Error("Database error");
      prisma.project.findFirst.mockRejectedValue(error);

      await expect(getProjectByIdService(adminUser, mockProject.id)).rejects.toEqual(error);
    });
  });

  // --- createProjectService ---
  describe("createProjectService", () => {
    test("🚫 rejects with 403 if user is not allowed to create project", async () => {
      await expect(createProjectService(employeeUser, { name: "Test" })).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create projects",
      });
    });

    test("✅ creates project successfully", async () => {
      prisma.project.create.mockResolvedValue(mockProject);
      const inputData = { name: "New Project", description: "A new project" };
      const result = await createProjectService(adminUser, inputData);
      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { ...inputData, name: "new project", createdBy: adminUser.id },
      });
      expect(result).toEqual(new ProjectDTO(mockProject));
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      prisma.project.create.mockRejectedValue({ code: "P2002" });
      await expect(createProjectService(adminUser, { name: "Duplicate" })).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 500 for generic error", async () => {
      prisma.project.create.mockRejectedValue(new Error("Database error"));
      await expect(createProjectService(adminUser, { name: "Some Project" })).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  // --- updateProjectService ---
  describe("updateProjectService", () => {
    beforeEach(() => {
      // Simulate authorization: findUnique returns a project so that update proceeds.
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });
    });

    test("✅ updates project successfully and converts name to lowercase", async () => {
      const inputData = { name: "UPPERCASE", description: "desc" };
      const expectedData = { name: "uppercase", description: "desc" };
      prisma.project.update.mockResolvedValue({ ...mockProject, ...expectedData });

      const result = await updateProjectService(adminUser, mockProject.id, inputData);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expectedData,
      });
      expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2002" });

      await expect(
        updateProjectService(adminUser, mockProject.id, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 404 when project not found (P2025)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2025" });

      await expect(
        updateProjectService(adminUser, "non-existent-id", { name: "Some Project" })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic update error", async () => {
      prisma.project.update.mockRejectedValue(new Error("Database error"));

      await expect(
        updateProjectService(adminUser, mockProject.id, { name: "Updated Project" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if modification not allowed", async () => {
      // Simulate authorization rejection: findUnique returns null.
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        updateProjectService(adminUser, mockProject.id, { name: "Updated Project" })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  });

  // --- patchProjectService ---
  describe("patchProjectService", () => {
    beforeEach(() => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });
    });

    test("✅ patches project successfully, filtering undefined fields and lowercasing name", async () => {
      const inputData = { name: "MiXeDcAsE", description: undefined, extra: "value" };
      const expectedData = { name: "mixedcase", extra: "value" };
      prisma.project.update.mockResolvedValue({ ...mockProject, ...expectedData });

      const result = await patchProjectService(adminUser, mockProject.id, inputData);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expectedData,
      });
      expect(result).toEqual(new ProjectDTO({ ...mockProject, ...expectedData }));
    });

    test("🚫 rejects with 400 when no valid fields provided", async () => {
      await expect(patchProjectService(adminUser, mockProject.id, {})).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2002" });
      await expect(
        patchProjectService(adminUser, mockProject.id, { name: "Duplicate", extra: "value" })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 404 when project not found (P2025)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2025" });
      await expect(
        patchProjectService(adminUser, mockProject.id, { name: "Nonexistent", extra: "value" })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic patch error", async () => {
      prisma.project.update.mockRejectedValue(new Error("Database error"));
      await expect(
        patchProjectService(adminUser, mockProject.id, { name: "Test", extra: "value" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if patch not allowed", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(
        patchProjectService(adminUser, mockProject.id, { name: "Test", extra: "value" })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  });

  // --- deleteProjectService ---
  describe("deleteProjectService", () => {
    test("✅ deletes project successfully", async () => {
      // Simulate valid project for deletion.
      prisma.project.findUnique.mockResolvedValue({ id: mockProject.id, createdBy: adminUser.id });
      prisma.project.delete.mockResolvedValue({});

      const result = await deleteProjectService(adminUser, mockProject.id);
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: mockProject.id } });
    });

    test("🚫 rejects with 404 when project not found on delete (P2025)", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(deleteProjectService(adminUser, "non-existent-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic delete error", async () => {
      prisma.project.findUnique.mockResolvedValue({ id: mockProject.id, createdBy: adminUser.id });
      prisma.project.delete.mockRejectedValue(new Error("Database error"));

      await expect(deleteProjectService(adminUser, mockProject.id)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error from deletion", async () => {
      // Simulate a scenario where the user is not allowed to delete.
      prisma.project.findUnique.mockResolvedValue({ id: mockProject.id, createdBy: "another-user" });
      await expect(deleteProjectService(managerUser, mockProject.id)).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to delete this project",
      });
    });
  });

  describe("Additional Branch Coverage", () => {
    // Test role-based filtering
    test("should apply ROLE_EMPLOYEE filter", async () => {
      const employeeUser = { id: "emp-123", role: "ROLE_EMPLOYEE" };
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      await getProjectsService(employeeUser, {});
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeIds: { has: "emp-123" } },
        })
      );
    });
  
    test("should apply ROLE_MANAGER filter", async () => {
      const managerUser = { id: "mgr-456", role: "ROLE_MANAGER" };
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      await getProjectsService(managerUser, {});
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { managerId: "mgr-456" },
              { employeeIds: { has: "mgr-456" } },
              { createdBy: "mgr-456" },
            ],
          },
        })
      );
    });
  
    test("should not apply any filter for ROLE_ADMIN", async () => {
      const adminUser = { id: "adm-789", role: "ROLE_ADMIN" };
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
  
      await getProjectsService(adminUser, {});
      // For admin, the where clause should be an empty object.
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });
  
    // Test authorizeProjectModification branches via updateProjectService.
    test("should log admin branch in updateProjectService", async () => {
      const adminUser = { id: "adm-789", role: "ROLE_ADMIN" };
      const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({ ...mockProject, description: "changed" });
  
      await updateProjectService(adminUser, mockProject.id, { description: "changed" });
      expect(spyLog).toHaveBeenCalledWith("Admin updating project: " + mockProject.id);
      spyLog.mockRestore();
    });
  
    test("should log manager authorized branch in updateProjectService", async () => {
      const managerUser = { id: "mgr-456", role: "ROLE_MANAGER" };
      const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
      // Simulate authorized manager: either managerId or createdBy equals managerUser.id.
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        managerId: "other", 
        createdBy: "mgr-456"
      });
      prisma.project.update.mockResolvedValue({ ...mockProject, description: "mgr update" });
  
      await updateProjectService(managerUser, mockProject.id, { description: "mgr update" });
      expect(spyLog).toHaveBeenCalledWith("Manager updating project they manage or created: " + mockProject.id);
      spyLog.mockRestore();
    });
  
    test("should leave data unchanged when no name provided in updateProjectService", async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({ ...mockProject, description: "no name change" });
  
      const result = await updateProjectService(adminUser, mockProject.id, { description: "no name change" });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: { description: "no name change" },
      });
      expect(result).toEqual(new ProjectDTO({ ...mockProject, description: "no name change" }));
    });
  
    test("should leave data unchanged when no name provided in patchProjectService", async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({ ...mockProject, description: "patched" });
  
      const result = await patchProjectService(adminUser, mockProject.id, { description: "patched" });
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: { description: "patched" },
      });
      expect(result).toEqual(new ProjectDTO({ ...mockProject, description: "patched" }));
    });
  
    // Test deleteProjectService branch for not found.
    test("should reject deleteProjectService with 404 when project not found", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(deleteProjectService(adminUser, "non-existent-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  });

  describe("Additional Branch Coverage for Authorization and Delete Error Handling", () => {
    test("updateProjectService: unauthorized modification for ROLE_MANAGER", async () => {
      // Simulate that the project exists but neither managerId nor createdBy match the user's id.
      prisma.project.findUnique.mockResolvedValue({
        id: "test-id",
        managerId: "someone-else",
        createdBy: "another-user",
      });
      const managerUser = { id: "mgr-123", role: "ROLE_MANAGER" };
  
      await expect(
        updateProjectService(managerUser, "test-id", { name: "New Name" })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to update this project",
      });
    });
  
    test("deleteProjectService: authorized deletion for ROLE_MANAGER (project created by manager)", async () => {
      // For deletion, if a manager's id equals existingProject.createdBy, the branch should log and return the project.
      prisma.project.findUnique.mockResolvedValue({ id: "test-id", createdBy: "mgr-123" });
      const managerUser = { id: "mgr-123", role: "ROLE_MANAGER" };
      // We'll simulate a successful deletion.
      prisma.project.delete.mockResolvedValue({ id: "test-id" });
      
      const result = await deleteProjectService(managerUser, "test-id");
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: "test-id" } });
    });
  
    test("deleteProjectService: returns 404 if delete fails with error code P2025", async () => {
      // Simulate that the project is found (authorization passed) but the deletion fails with code P2025.
      prisma.project.findUnique.mockResolvedValue({ id: "test-id", createdBy: "admin-id" });
      prisma.project.delete.mockRejectedValue({ code: "P2025" });
      const adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
  
      await expect(deleteProjectService(adminUser, "test-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("should use provided numeric page and limit when they are >= 1", async () => {
      // Provide valid numeric values (>= 1)
      const validQuery = { page: "2", limit: "5" };
      
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);
    
      const result = await getProjectsService(adminUser, validQuery);
    
      // Because page=2 and limit=5 are >=1, we expect the 'else' path
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
    
  }); 
});
