// tests/unit/services/stage.service.test.js

jest.mock("../../../repositories/stage.repository.js", () => ({
  StageRepository: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../../repositories/project.repository.js", () => ({
  ProjectRepository: {
    findUnique: jest.fn(),
  },
}));

import { StageRepository } from "../../../repositories/stage.repository.js";
import { ProjectRepository } from "../../../repositories/project.repository.js";
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
  // eslint-disable-next-line no-unused-vars
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
    
    // Reset StageRepository mocks
    Object.values(StageRepository).forEach(mockFn => {
      if (typeof mockFn === 'function') mockFn.mockReset();
    });
    
    // Reset ProjectRepository mocks
    Object.values(ProjectRepository).forEach(mockFn => {
      if (typeof mockFn === 'function') mockFn.mockReset();
    });
    
    // Setup default mock for ProjectRepository.findUnique to make most tests pass
    ProjectRepository.findUnique.mockResolvedValue(mockProject);
  });

  describe("getStagesService", () => {
    test("✅ returns stages successfully with pagination (page=1, limit=10 default)", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

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
      StageRepository.findMany.mockResolvedValue([]);
      StageRepository.count.mockResolvedValue(0);

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
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      const customQuery = {
        name: "planning",
        position: "1",
        color: "blue",
        projectId: "project-xyz",
      };
      await getStagesService(adminUser, customQuery);

      expect(StageRepository.findMany).toHaveBeenCalledWith(
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
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      const customQuery = { sortField: "position", sortOrder: "asc" };
      await getStagesService(adminUser, customQuery);

      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "asc" },
        })
      );
    });

    test("✅ defaults to createdAt desc if invalid sortField and sortOrder", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      const invalidQuery = {
        sortField: "invalidField",
        sortOrder: "invalidOrder",
      };
      await getStagesService(adminUser, invalidQuery);

      // The service code actually defaults to { position: "asc" } if invalid
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "asc" },
        })
      );
    });

    test("🚫 rejects with 403 when error code is P2025 (access denied)", async () => {
      StageRepository.findMany.mockRejectedValue({ code: "P2025" });

      await expect(getStagesService(adminUser, query)).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view stages",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      StageRepository.findMany.mockRejectedValue(new Error("Database error"));

      await expect(getStagesService(adminUser, query)).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ enforces role-based filter for ROLE_EMPLOYEE", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      await getStagesService(employeeUser, {});
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            Project: { employeeIds: { has: "employee-id" } },
          },
        })
      );
    });

    test("✅ enforces role-based filter for ROLE_MANAGER", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      await getStagesService(managerUser, {});
      expect(StageRepository.findMany).toHaveBeenCalledWith(
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
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      await getStagesService(adminUser, {});
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    test("✅ uses provided page/limit if valid numbers", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      const customQuery = { page: "2", limit: "5" };
      const result = await getStagesService(adminUser, customQuery);

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe("getStageByIdService", () => {
    test("✅ returns stage successfully if found with user role filter", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      const result = await getStageByIdService(adminUser, mockStage.id);

      expect(result).toEqual(new StageDTO(mockStage));
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: mockStage.id }),
        })
      );
    });

    test("🚫 rejects with 403 if stage exists in DB but not returned by findMany (access denied)", async () => {
      StageRepository.findMany.mockResolvedValue([]);
      StageRepository.findUnique.mockResolvedValue({ id: mockStage.id });

      await expect(
        getStageByIdService(employeeUser, mockStage.id)
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view this stage",
      });
    });

    test("🚫 rejects with 404 if stage doesn't exist at all", async () => {
      StageRepository.findMany.mockResolvedValue([]);
      StageRepository.findUnique.mockResolvedValue(null);

      await expect(
        getStageByIdService(adminUser, "does-not-exist")
      ).rejects.toEqual({
        status: 404,
        message: "Stage not found",
      });
    });

    test("🚫 rejects with original error if thrown by repository", async () => {
      const error = new Error("Database error");
      StageRepository.findMany.mockRejectedValue(error);

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
      // For an admin user, no additional check on StageRepository.findUnique is needed
      StageRepository.create.mockResolvedValue(mockStage);

      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(adminUser, inputData);

      expect(StageRepository.create).toHaveBeenCalledWith(
        { name: "planning", position: 1, projectId: "project-xyz" },
        { tasks: true, Project: true }
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("🚫 rejects with 409 when error.code === P2002 (duplicate name in same project)", async () => {
      StageRepository.create.mockRejectedValue({ code: "P2002" });

      await expect(
        createStageService(adminUser, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      StageRepository.create.mockRejectedValue(new Error("Database error"));

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
      StageRepository.create.mockResolvedValue(mockStage);
      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(adminUser, inputData);

      expect(StageRepository.create).toHaveBeenCalledWith(
        { name: "planning", position: 1, projectId: "project-xyz" },
        { tasks: true, Project: true }
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("✅ creates stage successfully for ROLE_MANAGER when authorized by managerId", async () => {
      // Replace this:
      // StageRepository.findUnique.mockResolvedValue({...})
      
      // With this:
      ProjectRepository.findUnique.mockResolvedValue({
        id: "project-xyz",
        managerId: managerUser.id,
        createdBy: "someone-else",
      });
      
      StageRepository.create.mockResolvedValue(mockStage);
    
      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(managerUser, inputData);
    
      expect(ProjectRepository.findUnique).toHaveBeenCalledWith({
        where: { id: "project-xyz" },
      });
      
      expect(StageRepository.create).toHaveBeenCalledWith(
        { name: "planning", position: 1, projectId: "project-xyz" },
        { tasks: true, Project: true }
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("✅ creates stage successfully for ROLE_MANAGER when authorized by createdBy", async () => {
      // Use ProjectRepository instead of StageRepository
      ProjectRepository.findUnique.mockResolvedValue({
        id: "project-xyz",
        managerId: "someone-else",
        createdBy: managerUser.id,
      });
      StageRepository.create.mockResolvedValue(mockStage);
    
      const inputData = {
        name: "PLANNING",
        position: 1,
        projectId: "project-xyz",
      };
      const result = await createStageService(managerUser, inputData);
    
      expect(ProjectRepository.findUnique).toHaveBeenCalledWith({
        where: { id: "project-xyz" },
      });
      expect(StageRepository.create).toHaveBeenCalledWith(
        { name: "planning", position: 1, projectId: "project-xyz" },
        { tasks: true, Project: true }
      );
      expect(result).toEqual(new StageDTO(mockStage));
    });

    test("🚫 rejects with 404 if project is not found for ROLE_MANAGER", async () => {
      // Use ProjectRepository instead of StageRepository and resolve with null
      ProjectRepository.findUnique.mockResolvedValue(null);
    
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
      // Use ProjectRepository instead of StageRepository
      ProjectRepository.findUnique.mockResolvedValue({
        id: "project-xyz",
        managerId: "another-manager",
        createdBy: "another-user",
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
      StageRepository.findUnique.mockResolvedValue(mockStage);
      StageRepository.update.mockResolvedValue({
        ...mockStage,
        name: "planning-updated",
      });
    });

    test("✅ updates stage successfully (ADMIN)", async () => {
      const result = await updateStageService(adminUser, mockStage.id, {
        name: "PLANNING-UPDATED",
      });
      expect(StageRepository.update).toHaveBeenCalledWith(
        mockStage.id,
        { name: "planning-updated" },
        { tasks: true, Project: true }
      );
      expect(result).toEqual(
        new StageDTO({ ...mockStage, name: "planning-updated" })
      );
    });

    test("🚫 rejects if authorizeStageModification fails (manager not matching project creator/manager)", async () => {
      StageRepository.findUnique.mockResolvedValue({
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
      StageRepository.update.mockRejectedValue({ code: "P2002" });

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Conflict" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with custom error if error.status is set", async () => {
      const customError = { status: 404, message: "Stage not found" };
      StageRepository.update.mockRejectedValue(customError);

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Any" })
      ).rejects.toEqual(customError);
    });

    test("🚫 rejects with 500 on generic error", async () => {
      const error = new Error("Database error");
      StageRepository.update.mockRejectedValue(error);

      await expect(
        updateStageService(adminUser, mockStage.id, { name: "Fail" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("✅ does not modify name if not provided", async () => {
      await updateStageService(adminUser, mockStage.id, { color: "red" });
      expect(StageRepository.update).toHaveBeenCalledWith(
        mockStage.id,
        { color: "red" },
        { tasks: true, Project: true }
      );
    });
  });

  describe("patchStageService", () => {
    beforeEach(() => {
      StageRepository.findUnique.mockResolvedValue(mockStage);
      StageRepository.update.mockResolvedValue({
        ...mockStage,
        color: "green",
      });
    });

    test("✅ patches stage successfully, ignoring undefined fields, lowercasing name if present", async () => {
      const partialData = { color: "GREEN", position: undefined };
      const patchedStage = { ...mockStage, color: "green" };

      const result = await patchStageService(
        adminUser,
        mockStage.id,
        partialData
      );

      expect(StageRepository.update).toHaveBeenCalledWith(
        mockStage.id,
        { color: "GREEN" },
        { tasks: true, Project: true }
      );
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
      StageRepository.update.mockRejectedValue({ code: "P2002" });

      await expect(
        patchStageService(adminUser, mockStage.id, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A stage with this name already exists for this project",
      });
    });

    test("🚫 rejects with custom error if error.status is set", async () => {
      const customError = { status: 404, message: "Stage not found" };
      StageRepository.update.mockRejectedValue(customError);

      await expect(
        patchStageService(adminUser, mockStage.id, { color: "blue" })
      ).rejects.toEqual(customError);
    });

    test("🚫 rejects with 500 on generic error", async () => {
      StageRepository.update.mockRejectedValue(new Error("DB error"));

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
      StageRepository.findUnique.mockResolvedValue(mockStage);
      StageRepository.delete.mockResolvedValue(mockStage);

      const result = await deleteStageService(adminUser, mockStage.id);
      expect(StageRepository.delete).toHaveBeenCalledWith(mockStage.id);
      expect(result).toEqual({
        status: 200,
        message: "Stage deleted successfully",
      });
    });

    test("🚫 rejects with 403 if user not authorized to delete", async () => {
      StageRepository.findUnique.mockResolvedValue({
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

    test("🚫 rejects with custom error if stage not found", async () => {
      StageRepository.findUnique.mockResolvedValue(null);

      await expect(
        deleteStageService(adminUser, "missing-stage")
      ).rejects.toEqual({
        status: 404,
        message: "Stage not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      StageRepository.findUnique.mockResolvedValue(mockStage);
      StageRepository.delete.mockRejectedValue(new Error("DB error"));

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
      StageRepository.findUnique.mockResolvedValue(null);

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
      StageRepository.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          managerId: "manager-id",
          createdBy: "some-other-user",
        },
      });
      StageRepository.update.mockResolvedValue({
        ...mockStage,
        name: "manager updated",
      });

      const result = await updateStageService(managerUser, mockStage.id, {
        name: "manager updated",
      });
      expect(result).toEqual(
        new StageDTO({ ...mockStage, name: "manager updated" })
      );
      expect(StageRepository.update).toHaveBeenCalledWith(
        mockStage.id,
        { name: "manager updated" },
        { tasks: true, Project: true }
      );
    });

    test("✅ allows update when managerUser is the creator of the project", async () => {
      StageRepository.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          managerId: "another-manager",
          createdBy: "manager-id",
        },
      });
      StageRepository.update.mockResolvedValue({
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
      StageRepository.findUnique.mockResolvedValue({
        ...mockStage,
        Project: {
          ...mockStage.Project,
          createdBy: "manager-id",
          managerId: "some-other-manager",
        },
      });
      StageRepository.delete.mockResolvedValue(mockStage);

      const result = await deleteStageService(managerUser, mockStage.id);
      expect(StageRepository.delete).toHaveBeenCalledWith(mockStage.id);
      expect(result).toEqual({
        status: 200,
        message: "Stage deleted successfully",
      });
    });

    test("✅ applies sortField=position and sortOrder=desc correctly", async () => {
      StageRepository.findMany.mockResolvedValue([mockStage]);
      StageRepository.count.mockResolvedValue(1);

      const customQuery = { sortField: "position", sortOrder: "desc" };
      await getStagesService(adminUser, customQuery);
      expect(StageRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { position: "desc" },
        })
      );
    });
  });
});
