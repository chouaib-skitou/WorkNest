// tests/unit/services/project.service.test.js

jest.mock("../../../config/database.js", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(), // for getProjectByIdService
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../../config/database.js";
import { ProjectDTO, GetAllProjectsDTO } from "../../../dtos/project.dto.js";
import { fetchUsersByIds } from "../../../services/helpers/user.enrichment.js";
jest.mock("../../../services/helpers/user.enrichment.js", () => ({
  fetchUsersByIds: jest.fn(),
}));

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

  // ----------------------------------------------------------------
  // 1) getProjectsService
  // ----------------------------------------------------------------
  describe("getProjectsService", () => {
    test("✅ returns projects successfully when projects exist", async () => {
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      fetchUsersByIds.mockResolvedValue({
        [mockProject.managerId]: {
          id: mockProject.managerId,
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        [mockProject.createdBy]: {
          id: mockProject.createdBy,
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
      });

      const result = await getProjectsService(adminUser, query, "testtoken");
      const expectedProject = new GetAllProjectsDTO({
        ...mockProject,
        manager: {
          id: mockProject.managerId,
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: mockProject.createdBy,
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
      });

      expect(result).toEqual({
        data: [expectedProject],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            employeeIds: expect.any(Object),
          }),
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
      await getProjectsService(adminUser, customQuery);
      // We expect a filter on createdAt with gte/lte for that day
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
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
      prisma.project.findMany.mockRejectedValue({ code: "P2025" });
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

  describe("getProjectsService edge cases for fetchUsersByIds", () => {
    beforeEach(() => {
      prisma.project.findMany.mockResolvedValue([]);
      prisma.project.count.mockResolvedValue(0);
      fetchUsersByIds.mockResolvedValue({});
    });

    test("managerId is undefined => manager should be null", async () => {
      const projectNoManager = {
        ...mockProject,
        managerId: undefined, // triggers manager: null
      };
      prisma.project.findMany.mockResolvedValue([projectNoManager]);
      prisma.project.count.mockResolvedValue(1);

      fetchUsersByIds.mockResolvedValue({
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
      });

      const result = await getProjectsService(adminUser, {}, "testtoken");
      expect(result.data[0]).toEqual(
        new GetAllProjectsDTO({
          ...projectNoManager,
          manager: null,
          createdBy: {
            id: "creator-id",
            fullName: "Creator Name",
            role: "ROLE_ADMIN",
          },
        })
      );
    });

    test("createdBy is undefined => createdBy should be null", async () => {
      const projectNoCreator = {
        ...mockProject,
        createdBy: undefined, // triggers createdBy: null
      };
      prisma.project.findMany.mockResolvedValue([projectNoCreator]);
      prisma.project.count.mockResolvedValue(1);

      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
      });

      const result = await getProjectsService(adminUser, {}, "testtoken");
      expect(result.data[0]).toEqual(
        new GetAllProjectsDTO({
          ...projectNoCreator,
          manager: {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          createdBy: null,
        })
      );
    });
  });

  // ----------------------------------------------------------------
  // 2) getProjectByIdService
  // ----------------------------------------------------------------
  describe("getProjectByIdService", () => {
    test("✅ returns project successfully when found with role filter", async () => {
      prisma.project.findFirst.mockResolvedValue(mockProject);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        mockProject.id,
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...mockProject,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(result).toEqual(expectedProject);
      expect(prisma.project.findFirst).toHaveBeenCalled();
    });

    test("🚫 rejects with 403 if findFirst returns null but project exists (access denied)", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.findUnique.mockResolvedValue({ id: mockProject.id });

      await expect(
        getProjectByIdService(adminUser, mockProject.id)
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to view this project",
      });
      expect(prisma.project.findUnique).toHaveBeenCalled();
    });

    test("🚫 rejects with 404 if project does not exist", async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(
        getProjectByIdService(adminUser, "non-existent-id")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      const error = new Error("Database error");
      prisma.project.findFirst.mockRejectedValue(error);

      await expect(
        getProjectByIdService(adminUser, mockProject.id)
      ).rejects.toEqual(error);
    });

    // Additional Branch Coverage for managerId/createdBy/employeeIds undefined/empty, fallback
    test("managerId is undefined => manager: null", async () => {
      const projectNoManager = {
        ...mockProject,
        managerId: undefined,
        employeeIds: ["emp-1", "emp-2"],
      };
      prisma.project.findFirst.mockResolvedValue(projectNoManager);
      fetchUsersByIds.mockResolvedValue({
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "emp-1": {
          id: "emp-1",
          fullName: "Employee One",
          role: "ROLE_EMPLOYEE",
        },
        "emp-2": {
          id: "emp-2",
          fullName: "Employee Two",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectNoManager.id,
        "testtoken"
      );
      expect(result.manager).toBeNull();
      expect(result.employees).toHaveLength(2);
    });

    test("createdBy is undefined => createdBy: null", async () => {
      const projectNoCreator = {
        ...mockProject,
        createdBy: undefined,
        employeeIds: ["emp-1"],
      };
      prisma.project.findFirst.mockResolvedValue(projectNoCreator);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "emp-1": {
          id: "emp-1",
          fullName: "Employee One",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectNoCreator.id,
        "testtoken"
      );
      expect(result.createdBy).toBeNull();
      expect(result.manager).toBeDefined();
    });

    test("employeeIds is undefined => employees => []", async () => {
      const projectNoEmployees = {
        ...mockProject,
        employeeIds: undefined,
      };
      prisma.project.findFirst.mockResolvedValue(projectNoEmployees);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectNoEmployees.id,
        "testtoken"
      );
      expect(result.employees).toEqual([]);
    });

    test("employeeIds is empty => employees => []", async () => {
      const projectEmptyEmployees = {
        ...mockProject,
        employeeIds: [],
      };
      prisma.project.findFirst.mockResolvedValue(projectEmptyEmployees);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectEmptyEmployees.id,
        "testtoken"
      );
      expect(result.employees).toEqual([]);
    });

    test("some employee IDs not found => fallback to { id }", async () => {
      const projectWithUnknownEmployees = {
        ...mockProject,
        employeeIds: ["emp-1", "emp-unknown"],
      };
      prisma.project.findFirst.mockResolvedValue(projectWithUnknownEmployees);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "creator-id": {
          id: "creator-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "emp-1": {
          id: "emp-1",
          fullName: "Employee One",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectWithUnknownEmployees.id,
        "testtoken"
      );
      expect(result.employees).toEqual([
        { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
        { id: "emp-unknown" }, // fallback
      ]);
    });
  });

  // ----------------------------------------------------------------
  // 3) createProjectService
  // ----------------------------------------------------------------
  describe("createProjectService", () => {
    test("🚫 rejects with 403 if user is not allowed to create project", async () => {
      await expect(
        createProjectService(employeeUser, { name: "Test" })
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create projects",
      });
    });

    test("✅ creates project successfully", async () => {
      const projectForCreate = { ...mockProject, createdBy: adminUser.id };
      prisma.project.create.mockResolvedValue(projectForCreate);

      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const inputData = { name: "New Project", description: "A new project" };
      const result = await createProjectService(
        adminUser,
        inputData,
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...projectForCreate,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { ...inputData, name: "new project", createdBy: adminUser.id },
      });
      expect(result).toEqual(expectedProject);
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      prisma.project.create.mockRejectedValue({ code: "P2002" });
      await expect(
        createProjectService(adminUser, { name: "Duplicate" })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 500 for generic error", async () => {
      prisma.project.create.mockRejectedValue(new Error("Database error"));
      await expect(
        createProjectService(adminUser, { name: "Some Project" })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    // Additional coverage for managerId/createdBy/employeeIds = undefined or partial
    describe("Branch Coverage for createProjectService", () => {
      test("managerId is undefined => manager: null", async () => {
        const projectNoManager = {
          ...mockProject,
          managerId: undefined,
          createdBy: "creator-123",
          employeeIds: ["emp-1"],
        };
        prisma.project.create.mockResolvedValue(projectNoManager);

        fetchUsersByIds.mockResolvedValue({
          "creator-123": {
            id: "creator-123",
            fullName: "Creator Name",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await createProjectService(
          adminUser,
          { name: "Hello" },
          "testtoken"
        );
        expect(result.manager).toBeNull();
      });

      test("createdBy is undefined => createdBy: null", async () => {
        const projectNoCreator = {
          ...mockProject,
          managerId: "manager-111",
          createdBy: undefined,
          employeeIds: ["emp-1", "emp-2"],
        };
        prisma.project.create.mockResolvedValue(projectNoCreator);

        fetchUsersByIds.mockResolvedValue({
          "manager-111": {
            id: "manager-111",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
          "emp-2": {
            id: "emp-2",
            fullName: "Employee Two",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await createProjectService(
          adminUser,
          { name: "Hello2" },
          "testtoken"
        );
        expect(result.createdBy).toBeNull();
      });

      test("employeeIds is undefined => employees => []", async () => {
        const projectNoEmployees = {
          ...mockProject,
          employeeIds: undefined,
        };
        prisma.project.create.mockResolvedValue(projectNoEmployees);

        fetchUsersByIds.mockResolvedValue({
          "manager-id": {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          "creator-id": {
            id: "creator-id",
            fullName: "Creator Name",
            role: "ROLE_ADMIN",
          },
        });

        const result = await createProjectService(
          adminUser,
          { name: "NoEmployees" },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("employeeIds is an empty array => employees => []", async () => {
        const projectEmptyEmployees = {
          ...mockProject,
          employeeIds: [],
        };
        prisma.project.create.mockResolvedValue(projectEmptyEmployees);

        fetchUsersByIds.mockResolvedValue({
          "manager-id": {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          "creator-id": {
            id: "creator-id",
            fullName: "Creator Name",
            role: "ROLE_ADMIN",
          },
        });

        const result = await createProjectService(
          adminUser,
          { name: "EmptyEmployees", employeeIds: [] },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("some employees not found => fallback to { id }", async () => {
        const projectSomeUnknown = {
          ...mockProject,
          managerId: "manager-xyz",
          createdBy: "creator-xyz",
          employeeIds: ["emp-1", "emp-unknown"],
        };
        prisma.project.create.mockResolvedValue(projectSomeUnknown);

        fetchUsersByIds.mockResolvedValue({
          "manager-xyz": {
            id: "manager-xyz",
            fullName: "Some Manager",
            role: "ROLE_MANAGER",
          },
          "creator-xyz": {
            id: "creator-xyz",
            fullName: "Some Creator",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await createProjectService(
          adminUser,
          { name: "PartialEmployees", employeeIds: ["emp-1", "emp-unknown"] },
          "testtoken"
        );
        expect(result.employees).toEqual([
          { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
          { id: "emp-unknown" },
        ]);
      });
    });
  });

  // ----------------------------------------------------------------
  // 4) updateProjectService
  // ----------------------------------------------------------------
  describe("updateProjectService", () => {
    beforeEach(() => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });
    });

    test("✅ updates project successfully and converts name to lowercase", async () => {
      const inputData = { name: "UPPERCASE", description: "desc" };
      const expectedData = { name: "uppercase", description: "desc" };
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        ...expectedData,
        createdBy: adminUser.id,
      });

      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await updateProjectService(
        adminUser,
        mockProject.id,
        inputData,
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...mockProject,
        ...expectedData,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expectedData,
      });
      expect(result).toEqual(expectedProject);
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
        updateProjectService(adminUser, "non-existent-id", {
          name: "Some Project",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic update error", async () => {
      prisma.project.update.mockRejectedValue(new Error("Database error"));
      await expect(
        updateProjectService(adminUser, mockProject.id, {
          name: "Updated Project",
        })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if modification not allowed", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(
        updateProjectService(adminUser, mockProject.id, {
          name: "Updated Project",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    // Additional Branch Coverage: managerId/createdBy/employeeIds = undefined, fallback
    describe("Branch Coverage for updateProjectService", () => {
      beforeEach(() => {
        // Re-stub findUnique to always return a valid project for these sub-tests
        prisma.project.findUnique.mockResolvedValue({
          id: "proj-up-1",
          managerId: "manager-1",
          createdBy: "admin-id",
        });
      });

      test("managerId is undefined => manager: null", async () => {
        const updatedProject = {
          id: "proj-up-1",
          name: "Updated Name",
          managerId: undefined,
          createdBy: "admin-id",
          employeeIds: ["emp-1"],
        };
        prisma.project.update.mockResolvedValue(updatedProject);

        fetchUsersByIds.mockResolvedValue({
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await updateProjectService(
          adminUser,
          "proj-up-1",
          { name: "Updated Name" },
          "testtoken"
        );
        expect(result.manager).toBeNull();
      });

      test("createdBy is undefined => createdBy: null", async () => {
        const updatedProject = {
          id: "proj-up-2",
          name: "Updated Name",
          managerId: "manager-2",
          createdBy: undefined,
          employeeIds: ["emp-2"],
        };
        prisma.project.update.mockResolvedValue(updatedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-2": {
            id: "manager-2",
            fullName: "Manager Two",
            role: "ROLE_MANAGER",
          },
          "emp-2": {
            id: "emp-2",
            fullName: "Employee Two",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await updateProjectService(
          adminUser,
          "proj-up-2",
          { name: "Updated Name" },
          "testtoken"
        );
        expect(result.manager).toEqual({
          id: "manager-2",
          fullName: "Manager Two",
          role: "ROLE_MANAGER",
        });
        expect(result.createdBy).toBeNull();
      });

      test("employeeIds is undefined => employees => []", async () => {
        const updatedProject = {
          id: "proj-up-3",
          name: "No Employees",
          managerId: "manager-3",
          createdBy: "admin-id",
          employeeIds: undefined,
        };
        prisma.project.update.mockResolvedValue(updatedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-3": {
            id: "manager-3",
            fullName: "Manager Three",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
        });

        const result = await updateProjectService(
          adminUser,
          "proj-up-3",
          { name: "No Employees" },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("employeeIds is an empty array => employees => []", async () => {
        const updatedProject = {
          id: "proj-up-4",
          name: "Empty Employees",
          managerId: "manager-4",
          createdBy: "admin-id",
          employeeIds: [],
        };
        prisma.project.update.mockResolvedValue(updatedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-4": {
            id: "manager-4",
            fullName: "Manager Four",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
        });

        const result = await updateProjectService(
          adminUser,
          "proj-up-4",
          { name: "Empty Employees" },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("some employees not found => fallback to { id }", async () => {
        const updatedProject = {
          id: "proj-up-5",
          name: "Partial Employees",
          managerId: "manager-5",
          createdBy: "admin-id",
          employeeIds: ["emp-1", "emp-missing"],
        };
        prisma.project.update.mockResolvedValue(updatedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-5": {
            id: "manager-5",
            fullName: "Manager Five",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await updateProjectService(
          adminUser,
          "proj-up-5",
          { name: "Partial Employees" },
          "testtoken"
        );
        expect(result.employees).toEqual([
          { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
          { id: "emp-missing" },
        ]);
      });
    });
  });

  // ----------------------------------------------------------------
  // 5) patchProjectService
  // ----------------------------------------------------------------
  describe("patchProjectService", () => {
    beforeEach(() => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });
    });

    test("✅ patches project successfully, filtering undefined fields and lowercasing name", async () => {
      const inputData = {
        name: "MiXeDcAsE",
        description: undefined,
        extra: "value",
      };
      const expectedData = { name: "mixedcase", extra: "value" };
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        ...expectedData,
        createdBy: adminUser.id,
      });

      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await patchProjectService(
        adminUser,
        mockProject.id,
        inputData,
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...mockProject,
        ...expectedData,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: mockProject.id },
        data: expectedData,
      });
      expect(result).toEqual(expectedProject);
    });

    test("🚫 rejects with 400 when no valid fields provided", async () => {
      await expect(
        patchProjectService(adminUser, mockProject.id, {})
      ).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2002" });
      await expect(
        patchProjectService(adminUser, mockProject.id, {
          name: "Duplicate",
          extra: "value",
        })
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 404 when project not found (P2025)", async () => {
      prisma.project.update.mockRejectedValue({ code: "P2025" });
      await expect(
        patchProjectService(adminUser, mockProject.id, {
          name: "Nonexistent",
          extra: "value",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic patch error", async () => {
      prisma.project.update.mockRejectedValue(new Error("Database error"));
      await expect(
        patchProjectService(adminUser, mockProject.id, {
          name: "Test",
          extra: "value",
        })
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if patch not allowed", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(
        patchProjectService(adminUser, mockProject.id, {
          name: "Test",
          extra: "value",
        })
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    // Additional coverage for managerId/createdBy/employeeIds = undefined or fallback
    describe("Branch Coverage for patchProjectService", () => {
      beforeEach(() => {
        prisma.project.findUnique.mockResolvedValue({
          id: "proj-patch-1",
          managerId: "manager-1",
          createdBy: "admin-id",
        });
      });

      test("managerId is undefined => manager: null", async () => {
        const patchedProject = {
          id: "proj-patch-1",
          name: "Patched Name",
          managerId: undefined,
          createdBy: "admin-id",
          employeeIds: ["emp-1"],
        };
        prisma.project.update.mockResolvedValue(patchedProject);

        fetchUsersByIds.mockResolvedValue({
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await patchProjectService(
          adminUser,
          "proj-patch-1",
          { name: "Patched Name" },
          "testtoken"
        );
        expect(result.manager).toBeNull();
      });

      test("createdBy is undefined => createdBy: null", async () => {
        const patchedProject = {
          id: "proj-patch-2",
          name: "Patched Name",
          managerId: "manager-2",
          createdBy: undefined,
          employeeIds: ["emp-2"],
        };
        prisma.project.update.mockResolvedValue(patchedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-2": {
            id: "manager-2",
            fullName: "Manager Two",
            role: "ROLE_MANAGER",
          },
          "emp-2": {
            id: "emp-2",
            fullName: "Employee Two",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await patchProjectService(
          adminUser,
          "proj-patch-2",
          { name: "Patched Name" },
          "testtoken"
        );
        expect(result.createdBy).toBeNull();
      });

      test("employeeIds is undefined => employees => []", async () => {
        const patchedProject = {
          id: "proj-patch-3",
          name: "No Employees Patch",
          managerId: "manager-3",
          createdBy: "admin-id",
          employeeIds: undefined,
        };
        prisma.project.update.mockResolvedValue(patchedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-3": {
            id: "manager-3",
            fullName: "Manager Three",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
        });

        const result = await patchProjectService(
          adminUser,
          "proj-patch-3",
          { description: "Patch" },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("employeeIds is empty => employees => []", async () => {
        const patchedProject = {
          id: "proj-patch-4",
          name: "Empty Patch",
          managerId: "manager-4",
          createdBy: "admin-id",
          employeeIds: [],
        };
        prisma.project.update.mockResolvedValue(patchedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-4": {
            id: "manager-4",
            fullName: "Manager Four",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
        });

        const result = await patchProjectService(
          adminUser,
          "proj-patch-4",
          { description: "Empty Employees" },
          "testtoken"
        );
        expect(result.employees).toEqual([]);
      });

      test("some employees not found => fallback to { id }", async () => {
        const patchedProject = {
          id: "proj-patch-5",
          name: "Partial Patch",
          managerId: "manager-5",
          createdBy: "admin-id",
          employeeIds: ["emp-1", "emp-missing"],
        };
        prisma.project.update.mockResolvedValue(patchedProject);

        fetchUsersByIds.mockResolvedValue({
          "manager-5": {
            id: "manager-5",
            fullName: "Manager Five",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
          "emp-1": {
            id: "emp-1",
            fullName: "Employee One",
            role: "ROLE_EMPLOYEE",
          },
        });

        const result = await patchProjectService(
          adminUser,
          "proj-patch-5",
          { name: "Partial Patch" },
          "testtoken"
        );
        expect(result.employees).toEqual([
          { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
          { id: "emp-missing" },
        ]);
      });
    });
  });

  // ----------------------------------------------------------------
  // 6) deleteProjectService
  // ----------------------------------------------------------------
  describe("deleteProjectService", () => {
    test("✅ deletes project successfully", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        createdBy: adminUser.id,
      });
      prisma.project.delete.mockResolvedValue({});

      const result = await deleteProjectService(adminUser, mockProject.id);
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: mockProject.id },
      });
    });

    test("🚫 rejects with 404 when project not found on delete (P2025)", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(
        deleteProjectService(adminUser, "non-existent-id")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic delete error", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        createdBy: adminUser.id,
      });
      prisma.project.delete.mockRejectedValue(new Error("Database error"));

      await expect(
        deleteProjectService(adminUser, mockProject.id)
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error from deletion", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: mockProject.id,
        createdBy: "another-user",
      });
      await expect(
        deleteProjectService(managerUser, mockProject.id)
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to delete this project",
      });
    });
  });

  // ----------------------------------------------------------------
  // 7) Additional Branch Coverage
  // ----------------------------------------------------------------
  describe("Additional Branch Coverage", () => {
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
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    // authorizeProjectModification logs
    test("should log admin branch in updateProjectService", async () => {
      const adminUser = { id: "adm-789", role: "ROLE_ADMIN" };
      const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        description: "changed",
      });

      await updateProjectService(adminUser, mockProject.id, {
        description: "changed",
      });
      expect(spyLog).toHaveBeenCalledWith(
        "Admin updating project: " + mockProject.id
      );
      spyLog.mockRestore();
    });

    test("should log manager authorized branch in updateProjectService", async () => {
      const managerUser = { id: "mgr-456", role: "ROLE_MANAGER" };
      const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
      prisma.project.findUnique.mockResolvedValue({
        ...mockProject,
        managerId: "other",
        createdBy: "mgr-456",
      });
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        description: "mgr update",
      });

      await updateProjectService(managerUser, mockProject.id, {
        description: "mgr update",
      });
      expect(spyLog).toHaveBeenCalledWith(
        "Manager updating project they manage or created: " + mockProject.id
      );
      spyLog.mockRestore();
    });

    test("should leave data unchanged when no name provided in updateProjectService", async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        description: "no name change",
        createdBy: adminUser.id,
      });
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await updateProjectService(
        adminUser,
        mockProject.id,
        { description: "no name change" },
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...mockProject,
        description: "no name change",
        createdBy: {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(result).toEqual(expectedProject);
    });

    test("should leave data unchanged when no name provided in patchProjectService", async () => {
      prisma.project.findUnique.mockResolvedValue(mockProject);
      prisma.project.update.mockResolvedValue({
        ...mockProject,
        description: "patched",
        createdBy: adminUser.id,
      });
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      const result = await patchProjectService(
        adminUser,
        mockProject.id,
        { description: "patched" },
        "testtoken"
      );
      const expectedProject = new ProjectDTO({
        ...mockProject,
        description: "patched",
        createdBy: {
          id: "admin-id",
          fullName: "Creator Name",
          role: "ROLE_ADMIN",
        },
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        employees: [
          {
            id: "employee-id",
            fullName: "Employee Name",
            role: "ROLE_EMPLOYEE",
          },
        ],
      });

      expect(result).toEqual(expectedProject);
    });

    // deleteProjectService not found scenario
    test("should reject deleteProjectService with 404 when project not found", async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      await expect(
        deleteProjectService(adminUser, "non-existent-id")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });
  });

  // ----------------------------------------------------------------
  // 8) Additional Branch Coverage for Authorization & Delete
  // ----------------------------------------------------------------
  describe("Additional Branch Coverage for Authorization and Delete Error Handling", () => {
    test("updateProjectService: unauthorized modification for ROLE_MANAGER", async () => {
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
        message:
          "Access denied: You do not have permission to update this project",
      });
    });

    test("deleteProjectService: authorized deletion for ROLE_MANAGER (project created by manager)", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: "test-id",
        createdBy: "mgr-123",
      });
      const managerUser = { id: "mgr-123", role: "ROLE_MANAGER" };
      prisma.project.delete.mockResolvedValue({ id: "test-id" });

      const result = await deleteProjectService(managerUser, "test-id");
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(prisma.project.delete).toHaveBeenCalledWith({
        where: { id: "test-id" },
      });
    });

    test("deleteProjectService: returns 404 if delete fails with error code P2025", async () => {
      prisma.project.findUnique.mockResolvedValue({
        id: "test-id",
        createdBy: "admin-id",
      });
      prisma.project.delete.mockRejectedValue({ code: "P2025" });
      const adminUser = { id: "admin-id", role: "ROLE_ADMIN" };

      await expect(deleteProjectService(adminUser, "test-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("should use provided numeric page and limit when they are >= 1", async () => {
      const validQuery = { page: "2", limit: "5" };
      prisma.project.findMany.mockResolvedValue([mockProject]);
      prisma.project.count.mockResolvedValue(1);

      const result = await getProjectsService(adminUser, validQuery);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });
  });
});
