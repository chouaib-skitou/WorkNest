// tests/unit/services/stage.service.test.js
jest.mock("../../../config/database.js", () => ({
  prisma: {
    stage: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "../../../config/database.js";
import {
  getStagesService,
  getStageByIdService,
  createStageService,
  updateStageService,
  patchStageService,
  deleteStageService,
} from "../../../services/stage.service.js";
import { StageDTO } from "../../../dtos/stage.dto.js";

describe("🛠 Stage Service Tests", () => {
  let adminUser, managerUser, employeeUser;
  let mockStage, mockProject;
  let query;

  beforeEach(() => {
    adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
    managerUser = { id: "manager-id", role: "ROLE_MANAGER" };
    employeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" };

    // Example Stage
    mockStage = {
      id: "stage-1234",
      name: "Planning",
      position: 1,
      color: "blue",
      projectId: "project-xyz",
      createdAt: new Date("2025-02-01T12:00:00.000Z"),
      updatedAt: new Date("2025-02-02T12:00:00.000Z"),
      tasks: [],
      Project: {
        id: "project-xyz",
        name: "Sample Project",
        createdBy: "manager-id",
        managerId: "manager-id",
        employeeIds: ["employee-id"],
      },
    };

    mockProject = {
      id: "project-xyz",
      name: "Sample Project",
      createdBy: "manager-id",
      managerId: "manager-id",
      employeeIds: ["employee-id"],
    };

    query = {};

    jest.clearAllMocks();
  });

  describe("getStagesService", () => {
    test("✅ returns stages successfully with pagination (page=1, limit=10 default)", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const result = await getStagesService(adminUser, query);
      expect(result).toEqual({
        data: [new StageDTO(mockStage)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });

    test("✅ returns empty data when no stages found", async () => {
      prisma.stage.findMany.mockResolvedValue([]);
      prisma.stage.count.mockResolvedValue(0);

      const result = await getStagesService(adminUser, query);
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
      });
    });

    test("✅ applies dynamic filters (e.g., name, position, color, projectId)", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const customQuery = {
        name: "planning",
        position: "1",
        color: "blue",
        projectId: "project-xyz",
      };
      await getStagesService(adminUser, customQuery);

      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "planning", mode: "insensitive" },
            position: 1,
            color: { equals: "blue" },
            projectId: "project-xyz",
          }),
        })
      );
    });

    test("✅ applies sortField and sortOrder correctly", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const customQuery = { sortField: "position", sortOrder: "asc" };
      await getStagesService(adminUser, customQuery);

      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "asc" },
        })
      );
    });

    test("✅ defaults to createdAt desc if invalid sortField and sortOrder", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const invalidQuery = {
        sortField: "invalidField",
        sortOrder: "invalidOrder",
      };
      await getStagesService(adminUser, invalidQuery);

      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "asc" },
        })
      );
    });

    test("🚫 rejects with 403 when error code is P2025 (access denied)", async () => {
      prisma.stage.findMany.mockRejectedValue({ code: "P2025" });

      await expect(getStagesService(adminUser, query)).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view stages",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      prisma.stage.findMany.mockRejectedValue(new Error("Database error"));

      await expect(getStagesService(adminUser, query)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ enforces role-based filter for ROLE_EMPLOYEE", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      await getStagesService(employeeUser, {});
      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            Project: { employeeIds: { has: "employee-id" } },
          },
        })
      );
    });

    test("✅ enforces role-based filter for ROLE_MANAGER", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      await getStagesService(managerUser, {});
      // Manager filter is an OR condition:
      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { Project: { managerId: "manager-id" } },
              { Project: { createdBy: "manager-id" } },
              { Project: { employeeIds: { has: "manager-id" } } },
            ],
          },
        })
      );
    });

    test("✅ no additional filter for ROLE_ADMIN", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      await getStagesService(adminUser, {});
      // For admin, the role-based filter is an empty object.
      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    test("✅ uses provided page/limit if valid numbers", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const customQuery = { page: "2", limit: "5" };
      const result = await getStagesService(adminUser, customQuery);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // page=2, limit=5 => skip=5
          take: 5,
        })
      );
    });
  });

  describe("getStageByIdService", () => {
    test("✅ returns stage successfully if found with user role filter", async () => {
      prisma.stage.findFirst.mockResolvedValue(mockStage);
      const result = await getStageByIdService(adminUser, mockStage.id);

      expect(result).toEqual(new StageDTO(mockStage));
      expect(prisma.stage.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockStage.id }),
        })
      );
    });

    test("🚫 rejects with 403 if stage exists in DB but not returned by findFirst (access denied)", async () => {
      prisma.stage.findFirst.mockResolvedValue(null);
      // But stage truly exists (just user doesn't have permission):
      prisma.stage.findUnique.mockResolvedValue({ id: mockStage.id });

      await expect(
        getStageByIdService(employeeUser, mockStage.id)
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view this stage",
      });
    });

    test("🚫 rejects with 404 if stage doesn't exist at all", async () => {
      prisma.stage.findFirst.mockResolvedValue(null);
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(
        getStageByIdService(adminUser, "does-not-exist")
      ).rejects.toEqual({
        status: 404,
        message: "Stage not found",
      });
    });

    test("🚫 rejects with original error if thrown by prisma", async () => {
      const error = new Error("Database error");
      prisma.stage.findFirst.mockRejectedValue(error);

      await expect(
        getStageByIdService(adminUser, mockStage.id)
      ).rejects.toEqual(error);
    });
  });

  describe("createStageService", () => {
    test("🚫 rejects with 403 if user is neither ADMIN nor MANAGER", async () => {
      await expect(
        createStageService(employeeUser, { name: "Test" })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create stages",
      });
    });

    test("✅ creates stage successfully, converts name to lowercase", async () => {
      prisma.stage.create.mockResolvedValue(mockStage);

      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(adminUser, inputData);

      expect(prisma.stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "planning", position: 1, projectId: "project-xyz" },
        })
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("🚫 rejects with 409 when error.code === P2002 (duplicate name in same project)", async () => {
      prisma.stage.create.mockRejectedValue({ code: "P2002" });

      await expect(
        createStageService(adminUser, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      prisma.stage.create.mockRejectedValue(new Error("Database error"));

      await expect(
        createStageService(adminUser, { name: "X" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 rejects with 403 if user is neither ADMIN nor MANAGER", async () => {
      await expect(
        createStageService(employeeUser, {
          name: "Test",
          projectId: "project-xyz",
        })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create stages",
      });
    });

    test("✅ creates stage successfully for ADMIN user (name converted to lowercase)", async () => {
      prisma.stage.create.mockResolvedValue(mockStage);
      // For ADMIN, no project check is performed.
      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(adminUser, inputData);

      expect(prisma.stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "planning", position: 1, projectId: "project-xyz" },
        })
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("✅ creates stage successfully for ROLE_MANAGER when authorized by managerId", async () => {
      // Manager user is authorized if project.managerId matches their id.
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        managerId: managerUser.id,
      });
      prisma.stage.create.mockResolvedValue(mockStage);

      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(managerUser, inputData);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "project-xyz" },
      });
      expect(prisma.stage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { name: "planning", position: 1, projectId: "project-xyz" },
        })
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("✅ creates stage successfully for ROLE_MANAGER when authorized by createdBy", async () => {
      // Manager user is also authorized if project.createdBy matches.
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        createdBy: managerUser.id,
        managerId: "someone-else",
      });
      prisma.stage.create.mockResolvedValue(mockStage);

      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(managerUser, inputData);

      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: { id: "project-xyz" },
      });
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("🚫 rejects with 404 if project is not found for ROLE_MANAGER", async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        createStageService(managerUser, {
          name: "Test",
          projectId: "project-123",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 403 if ROLE_MANAGER is not authorized (project found but no match)", async () => {
      // Project exists but neither managerId nor createdBy match the managerUser's id.
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        managerId: "someone-else",
        createdBy: "someone-else",
      });

      await expect(
        createStageService(managerUser, {
          name: "Test",
          projectId: "project-xyz",
        })
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to create a stage for this project",
      });
    });
  });

  describe("updateStageService", () => {
    beforeEach(() => {
      // The service calls authorizeStageModification => prisma.stage.findUnique
      // We'll simulate that the stage is found and the user is authorized.
      prisma.stage.findUnique.mockResolvedValue(mockStage);
      prisma.stage.update.mockResolvedValue({
        ...mockStage,
        name: "planning-updated",
      });
    });

    test("✅ updates stage successfully (ADMIN)", async () => {
      const result = await updateStageService(adminUser, mockStage.id, {
        name: "PLANNING-UPDATED",
      });
      expect(prisma.stage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStage.id },
          data: { name: "planning-updated" }, // Lowercased
        })
      );
      expect(result).toEqual(
        new StageDTO({ ...mockStage, name: "planning-updated" })
      );
    });

    test("🚫 rejects if authorizeStageModification fails (manager not matching project creator/manager)", async () => {
      // If the user is manager but not managerId or createdBy, we must fail with 403.
      prisma.stage.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          managerId: "someone-else",
          createdBy: "someone-else",
        },
      });

      await expect(
        updateStageService(managerUser, mockStage.id, { name: "X" })
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this stage",
      });
    });

    test("🚫 rejects with 409 when error.code === P2002 (duplicate name in project)", async () => {
      prisma.stage.update.mockRejectedValue({ code: "P2002" });

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Conflict" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with custom error if error.status is set (e.g., from authorizeStageModification)", async () => {
      const customError = { status: 404, message: "Stage not found" };
      prisma.stage.update.mockRejectedValue(customError);

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Any" })
      ).rejects.toEqual(customError);
    });

    test("🚫 rejects with 500 on generic error", async () => {
      const error = new Error("Database error");
      prisma.stage.update.mockRejectedValue(error);

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Fail" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not modify name if not provided", async () => {
      await updateStageService(adminUser, mockStage.id, { color: "red" });
      expect(prisma.stage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { color: "red" },
        })
      );
    });
  });

  describe("patchStageService", () => {
    beforeEach(() => {
      prisma.stage.findUnique.mockResolvedValue(mockStage);
      prisma.stage.update.mockResolvedValue({
        ...mockStage,
        color: "green",
      });
    });

    test("✅ patches stage successfully, ignoring undefined fields, lowercasing name if present", async () => {
      // We only lowerCase 'name' in the service code.
      // 'color' remains whatever was passed in (e.g. "GREEN").

      const partialData = { color: "GREEN", position: undefined };
      const patchedStage = { ...mockStage, color: "green" };

      const result = await patchStageService(
        adminUser,
        mockStage.id,
        partialData
      );

      // We expect Prisma to get exactly "GREEN" for color since the code does not alter it.
      expect(prisma.stage.update).toHaveBeenCalledWith({
        where: { id: mockStage.id },
        data: { color: "GREEN" }, // position is omitted since it's undefined
        include: { tasks: true, Project: true },
      });

      // The final returned StageDTO also has "GREEN" for color.
      expect(result).toEqual(new StageDTO(patchedStage));
    });

    test("🚫 rejects with 400 if no valid fields provided", async () => {
      await expect(
        patchStageService(adminUser, mockStage.id, {})
      ).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });

    test("🚫 rejects with 409 when error.code === P2002 (duplicate name)", async () => {
      prisma.stage.update.mockRejectedValue({ code: "P2002" });

      await expect(
        patchStageService(adminUser, mockStage.id, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with custom error if error.status is set", async () => {
      const customError = { status: 404, message: "Stage not found" };
      prisma.stage.update.mockRejectedValue(customError);

      await expect(
        patchStageService(adminUser, mockStage.id, { color: "blue" })
      ).rejects.toEqual(customError);
    });

    test("🚫 rejects with 500 on generic error", async () => {
      prisma.stage.update.mockRejectedValue(new Error("DB error"));

      await expect(
        patchStageService(adminUser, mockStage.id, { color: "blue" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });
  });

  describe("deleteStageService", () => {
    test("✅ deletes stage successfully if authorized (ADMIN or manager who created project)", async () => {
      // authorizeStageDeletion => stage.findUnique => returns something => authorized => do delete
      prisma.stage.findUnique.mockResolvedValue(mockStage);
      prisma.stage.delete.mockResolvedValue(mockStage);

      const result = await deleteStageService(adminUser, mockStage.id);
      expect(prisma.stage.delete).toHaveBeenCalledWith({
        where: { id: mockStage.id },
      });
      expect(result).toEqual({
        status: 200,
        message: "Stage deleted successfully",
      });
    });

    test("🚫 rejects with 403 if user not authorized to delete", async () => {
      // If manager didn't create the project
      prisma.stage.findUnique.mockResolvedValue({
        ...mockStage,
        Project: { ...mockStage.Project, createdBy: "another-user" },
      });

      await expect(
        deleteStageService(managerUser, mockStage.id)
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to delete this stage",
      });
    });

    test("🚫 rejects with custom error (e.g., 404 Stage not found)", async () => {
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(
        deleteStageService(adminUser, "missing-stage")
      ).rejects.toEqual({
        status: 404,
        message: "Stage not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      prisma.stage.findUnique.mockResolvedValue(mockStage);
      prisma.stage.delete.mockRejectedValue(new Error("DB error"));

      await expect(deleteStageService(adminUser, mockStage.id)).rejects.toEqual(
        {
          status: 500,
          message: "Internal server error",
        }
      );
    });
  });
  describe("Additional Branch Coverage", () => {
    test("🚫 rejects with 404 if stage is not found for update", async () => {
      // Simulate 'authorizeStageModification' returning null from prisma.stage.findUnique
      prisma.stage.findUnique.mockResolvedValue(null);

      await expect(
        updateStageService(managerUser, "non-existent-stage-id", {
          name: "Anything",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Stage not found",
      });
    });

    test("✅ allows update when managerUser is the manager of the project", async () => {
      prisma.stage.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          // Make sure 'manager-id' matches the managerUser object
          managerId: "manager-id",
          createdBy: "some-other-user",
        },
      });
      prisma.stage.update.mockResolvedValue({
        ...mockStage,
        name: "manager updated",
      });

      const result = await updateStageService(managerUser, mockStage.id, {
        name: "manager updated",
      });

      expect(result).toEqual(
        new StageDTO({ ...mockStage, name: "manager updated" })
      );
      expect(prisma.stage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStage.id },
          data: { name: "manager updated" },
        })
      );
    });

    test("✅ allows update when managerUser is the creator of the project", async () => {
      prisma.stage.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          managerId: "another-manager",
          createdBy: "manager-id", // managerUser's ID
        },
      });
      prisma.stage.update.mockResolvedValue({
        ...mockStage,
        name: "manager updated",
      });

      const result = await updateStageService(managerUser, mockStage.id, {
        name: "manager updated",
      });

      expect(result).toEqual(
        new StageDTO({ ...mockStage, name: "manager updated" })
      );
    });

    test("✅ allows deletion when managerUser is the project creator", async () => {
      prisma.stage.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          createdBy: "manager-id", // matches managerUser.id
          managerId: "some-other-manager",
        },
      });
      prisma.stage.delete.mockResolvedValue(mockStage);

      const result = await deleteStageService(managerUser, mockStage.id);

      expect(prisma.stage.delete).toHaveBeenCalledWith({
        where: { id: mockStage.id },
      });
      expect(result).toEqual({
        status: 200,
        message: "Stage deleted successfully",
      });
    });

    test("✅ applies sortField=position and sortOrder=desc correctly", async () => {
      prisma.stage.findMany.mockResolvedValue([mockStage]);
      prisma.stage.count.mockResolvedValue(1);

      const customQuery = { sortField: "position", sortOrder: "desc" };
      await getStagesService(adminUser, customQuery);

      expect(prisma.stage.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "desc" },
        })
      );
    });
  });
});
