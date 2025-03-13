// tests/unit/services/project.service.test.js

jest.mock("../../../repositories/project.repository.js", () => ({
  ProjectRepository: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

import { ProjectRepository } from "../../../repositories/project.repository.js";
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
  getProjectEmployeesService,
} from "../../../services/project.service.js";

describe("🛠 Project Service Tests", () => {
  let adminUser, employeeUser, managerUser, query, mockProject;

  beforeEach(() => {
    adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
    employeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" };
    managerUser = { id: "manager-id", role: "ROLE_MANAGER" };

    query = {};

    // We'll make the project have createdBy = adminUser.id so it matches the user map in the test
    mockProject = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "WorkNest Platform",
      description: "A project management platform",
      createdBy: adminUser.id, // match user map
      managerId: "manager-id",
      employeeIds: ["employee-id"],
      createdAt: new Date("2025-02-01T12:00:00.000Z"),
      updatedAt: new Date("2025-02-02T12:00:00.000Z"),
    };

    jest.clearAllMocks();
  });

  describe("getProjectsService", () => {
    test("✅ returns projects successfully when projects exist", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      // Manager and createdBy
      fetchUsersByIds.mockResolvedValue({
        [mockProject.managerId]: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        [mockProject.createdBy]: {
          id: "admin-id",
          fullName: "Admin User",
          role: "ROLE_ADMIN",
        },
      });

      const result = await getProjectsService(adminUser, query, "testtoken");
      const expectedProject = new GetAllProjectsDTO({
        ...mockProject,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "admin-id",
          fullName: "Admin User",
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
    });

    test("✅ applies priority filter correctly", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { priority: "MEDIUM" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: "MEDIUM",
          }),
        })
      );
    });

    test("✅ applies status filter correctly", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { status: "IN_PROGRESS" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "IN_PROGRESS",
          }),
        })
      );
    });

    test("✅ returns empty result when no projects found", async () => {
      ProjectRepository.findMany.mockResolvedValue([]);
      ProjectRepository.count.mockResolvedValue(0);

      const result = await getProjectsService(adminUser, query, "testtoken");
      expect(result).toEqual({
        data: [],
        page: 1,
        limit: 10,
        totalCount: 0,
        totalPages: 0,
      });
    });

    test("✅ applies name filter correctly", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { name: "WorkNest" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: "WorkNest", mode: "insensitive" },
          }),
        })
      );
    });

    test("✅ applies description filter correctly", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { description: "management" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            description: { contains: "management", mode: "insensitive" },
          }),
        })
      );
    });

    test("✅ applies createdAt filter correctly when valid date provided", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { createdAt: "2025-02-01" };
      await getProjectsService(adminUser, customQuery, "testtoken");
      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    test("✅ ignores invalid createdAt filter", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { createdAt: "invalid-date" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({
            createdAt: expect.any(Object),
          }),
        })
      );
    });

    test("✅ applies valid custom sort field", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { sortField: "name", sortOrder: "asc" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { name: "asc" },
        })
      );
    });

    test("✅ defaults to createdAt sort field when unknown field provided", async () => {
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const customQuery = { sortField: "invalidField", sortOrder: "desc" };
      await getProjectsService(adminUser, customQuery, "testtoken");

      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: "desc" },
        })
      );
    });

    test("🚫 rejects with 403 when error code is P2025", async () => {
      ProjectRepository.findMany.mockRejectedValue({ code: "P2025" });
      await expect(
        getProjectsService(adminUser, query, "testtoken")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: You do not have permission to view projects",
      });
    });

    test("🚫 rejects with 500 for generic errors", async () => {
      const error = new Error("Database error");
      ProjectRepository.findMany.mockRejectedValue(error);

      await expect(
        getProjectsService(adminUser, query, "testtoken")
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    // Additional coverage for managerId or createdBy = undefined => manager:null or createdBy:null
    describe("Null manager/createdBy in getProjectsService", () => {
      test("managerId is undefined => manager: null in getProjectsService", async () => {
        const projectNoManager = { ...mockProject, managerId: undefined };
        ProjectRepository.findMany.mockResolvedValue([projectNoManager]);
        ProjectRepository.count.mockResolvedValue(1);

        // Only a user for the createdBy
        fetchUsersByIds.mockResolvedValue({
          [adminUser.id]: {
            id: "admin-id",
            fullName: "Admin User",
            role: "ROLE_ADMIN",
          },
        });

        const result = await getProjectsService(adminUser, {}, "testtoken");
        expect(result.data[0].manager).toBeNull();
      });

      test("createdBy is undefined => createdBy: null in getProjectsService", async () => {
        const projectNoCreator = { ...mockProject, createdBy: undefined };
        ProjectRepository.findMany.mockResolvedValue([projectNoCreator]);
        ProjectRepository.count.mockResolvedValue(1);

        // Only a user for the manager
        fetchUsersByIds.mockResolvedValue({
          [mockProject.managerId]: {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
        });

        const result = await getProjectsService(adminUser, {}, "testtoken");
        expect(result.data[0].createdBy).toBeNull();
      });
    });
  });

  describe("getProjectByIdService", () => {
    test("✅ returns project successfully when found with role filter", async () => {
      const projectWithDetails = { ...mockProject, stages: [] };
      ProjectRepository.findUnique.mockResolvedValue(projectWithDetails);
      fetchUsersByIds.mockResolvedValue({
        [mockProject.managerId]: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        [mockProject.createdBy]: {
          id: "admin-id",
          fullName: "Admin User",
          role: "ROLE_ADMIN",
        },
        [mockProject.employeeIds[0]]: {
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
        ...projectWithDetails,
        manager: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        createdBy: {
          id: "admin-id",
          fullName: "Admin User",
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
      expect(ProjectRepository.findUnique).toHaveBeenCalled();
    });

    test("🚫 rejects with 403 if findUnique returns null but project exists (access denied)", async () => {
      ProjectRepository.findUnique
        .mockResolvedValueOnce(null) // role-based lookup => null
        .mockResolvedValueOnce({ id: mockProject.id }); // second => project found

      await expect(
        getProjectByIdService(adminUser, mockProject.id, "testtoken")
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to view this project",
      });
      expect(ProjectRepository.findUnique).toHaveBeenCalledTimes(2);
    });

    test("🚫 rejects with 404 if project does not exist", async () => {
      ProjectRepository.findUnique.mockResolvedValue(null);
      await expect(
        getProjectByIdService(adminUser, "non-existent-id", "testtoken")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 on generic error", async () => {
      const error = new Error("Database error");
      ProjectRepository.findUnique.mockRejectedValue(error);
      await expect(
        getProjectByIdService(adminUser, mockProject.id, "testtoken")
      ).rejects.toEqual(error);
    });

    // Additional Branch Coverage for managerId/createdBy/employeeIds
    test("managerId is undefined => manager: null", async () => {
      const projectNoManager = {
        ...mockProject,
        managerId: undefined,
        stages: [],
        employeeIds: ["emp-1", "emp-2"],
      };
      ProjectRepository.findUnique.mockResolvedValue(projectNoManager);
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
        stages: [],
        employeeIds: ["emp-1"],
      };
      ProjectRepository.findUnique.mockResolvedValue(projectNoCreator);
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
        stages: [],
        employeeIds: undefined,
      };
      ProjectRepository.findUnique.mockResolvedValue(projectNoEmployees);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Admin User",
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
        stages: [],
        employeeIds: [],
      };
      ProjectRepository.findUnique.mockResolvedValue(projectEmptyEmployees);
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Admin User",
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
        stages: [],
        employeeIds: ["emp-1", "emp-unknown"],
      };
      ProjectRepository.findUnique.mockResolvedValue(
        projectWithUnknownEmployees
      );
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
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

      const result = await getProjectByIdService(
        adminUser,
        projectWithUnknownEmployees.id,
        "testtoken"
      );
      expect(result.employees).toEqual([
        { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
        { id: "emp-unknown" },
      ]);
    });
  });

  describe("createProjectService", () => {
    test("🚫 rejects with 403 if user is not allowed to create project", async () => {
      await expect(
        createProjectService(employeeUser, { name: "Test" }, "testtoken")
      ).rejects.toEqual({
        status: 403,
        message: "Access denied: Only admins and managers can create projects",
      });
    });

    test("✅ creates project successfully", async () => {
      const projectForCreate = { ...mockProject, createdBy: adminUser.id };
      ProjectRepository.create.mockResolvedValue(projectForCreate);

      fetchUsersByIds.mockResolvedValue({
        [mockProject.managerId]: {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        [adminUser.id]: {
          id: "admin-id",
          fullName: "Admin User",
          role: "ROLE_ADMIN",
        },
        [mockProject.employeeIds[0]]: {
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
          fullName: "Admin User",
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

      expect(ProjectRepository.create).toHaveBeenCalledWith({
        ...inputData,
        name: "new project",
        createdBy: adminUser.id,
      });
      expect(result).toEqual(expectedProject);
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      ProjectRepository.create.mockRejectedValue({ code: "P2002" });
      await expect(
        createProjectService(adminUser, { name: "Duplicate" }, "testtoken")
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 500 for generic error", async () => {
      ProjectRepository.create.mockRejectedValue(new Error("Database error"));
      await expect(
        createProjectService(adminUser, { name: "Some Project" }, "testtoken")
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    describe("Branch Coverage for createProjectService", () => {
      test("managerId is undefined => manager: null", async () => {
        const projectNoManager = {
          ...mockProject,
          managerId: undefined,
          createdBy: "creator-123",
          employeeIds: ["emp-1"],
        };
        ProjectRepository.create.mockResolvedValue(projectNoManager);

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
        ProjectRepository.create.mockResolvedValue(projectNoCreator);

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
        const projectNoEmployees = { ...mockProject, employeeIds: undefined };
        ProjectRepository.create.mockResolvedValue(projectNoEmployees);

        fetchUsersByIds.mockResolvedValue({
          "manager-id": {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
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
        const projectEmptyEmployees = { ...mockProject, employeeIds: [] };
        ProjectRepository.create.mockResolvedValue(projectEmptyEmployees);

        fetchUsersByIds.mockResolvedValue({
          "manager-id": {
            id: "manager-id",
            fullName: "Manager Name",
            role: "ROLE_MANAGER",
          },
          "admin-id": {
            id: "admin-id",
            fullName: "Admin User",
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
          employeeIds: ["emp-1", "emp-missing"],
        };
        ProjectRepository.create.mockResolvedValue(projectSomeUnknown);

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
          { name: "PartialEmployees", employeeIds: ["emp-1", "emp-missing"] },
          "testtoken"
        );
        expect(result.employees).toEqual([
          { id: "emp-1", fullName: "Employee One", role: "ROLE_EMPLOYEE" },
          { id: "emp-missing" },
        ]);
      });
    });
  });

  describe("updateProjectService", () => {
    beforeEach(() => {
      // By default, findUnique returns a project the user can update
      ProjectRepository.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });
    });

    test("✅ updates project successfully and converts name to lowercase", async () => {
      // This covers the line: if (updateData.name) => toLowerCase()
      const inputData = { name: "UPPERCASE", description: "desc" };
      const expectedData = { name: "uppercase", description: "desc" };
      ProjectRepository.update.mockResolvedValue({
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
          fullName: "Admin User",
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
          fullName: "Admin User",
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

      // ensure we call ProjectRepository.update with the final data
      expect(ProjectRepository.update).toHaveBeenCalledWith(
        mockProject.id,
        expectedData
      );
      expect(result).toEqual(expectedProject);
    });

    test("✅ does not modify project name if updateData.name is not provided", async () => {
      // Suppose the existing project has name = "OriginalName"
      ProjectRepository.findUnique.mockResolvedValue({
        id: mockProject.id,
        managerId: managerUser.id,
        createdBy: adminUser.id,
      });

      // We simulate that the repository returns the same name if we never updated it
      const updatedProject = {
        ...mockProject,
        name: "OriginalName", // unchanged
        description: "updated desc", // we *did* update description
      };

      // The repository update call will get some data that does NOT have "name"
      ProjectRepository.update.mockResolvedValue(updatedProject);

      // We'll also mock fetchUsersByIds to return something for manager & admin
      fetchUsersByIds.mockResolvedValue({
        "manager-id": {
          id: "manager-id",
          fullName: "Manager Name",
          role: "ROLE_MANAGER",
        },
        "admin-id": {
          id: "admin-id",
          fullName: "Admin User",
          role: "ROLE_ADMIN",
        },
        "employee-id": {
          id: "employee-id",
          fullName: "Employee Name",
          role: "ROLE_EMPLOYEE",
        },
      });

      // We pass an update data object WITHOUT a "name" field
      const updateData = { description: "updated desc" };

      const result = await updateProjectService(
        adminUser,
        mockProject.id,
        updateData,
        "testtoken"
      );

      // We confirm the repository update was called with no "name" property
      // => the service didn't do toLowerCase() or anything else for "name"
      expect(ProjectRepository.update).toHaveBeenCalledWith(mockProject.id, {
        description: "updated desc",
      });

      // And confirm the result has the original name
      expect(result.name).toBe("OriginalName");
      expect(result.description).toBe("updated desc");
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      ProjectRepository.update.mockRejectedValue({ code: "P2002" });
      await expect(
        updateProjectService(
          adminUser,
          mockProject.id,
          { name: "Duplicate" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 404 when project not found (P2025)", async () => {
      ProjectRepository.update.mockRejectedValue({ code: "P2025" });
      await expect(
        updateProjectService(
          adminUser,
          "non-existent-id",
          { name: "Some Project" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic update error", async () => {
      ProjectRepository.update.mockRejectedValue(new Error("Database error"));
      await expect(
        updateProjectService(
          adminUser,
          mockProject.id,
          { name: "Updated Project" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if modification not allowed", async () => {
      ProjectRepository.findUnique.mockResolvedValue(null); // Not found or not allowed
      await expect(
        updateProjectService(
          adminUser,
          mockProject.id,
          { name: "Updated Project" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    describe("Branch Coverage for updateProjectService", () => {
      beforeEach(() => {
        ProjectRepository.findUnique.mockResolvedValue({
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
        ProjectRepository.update.mockResolvedValue(updatedProject);

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
        ProjectRepository.update.mockResolvedValue(updatedProject);

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
        ProjectRepository.update.mockResolvedValue(updatedProject);

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

      test("employeeIds is empty => employees => []", async () => {
        const updatedProject = {
          id: "proj-up-4",
          name: "Empty Employees",
          managerId: "manager-4",
          createdBy: "admin-id",
          employeeIds: [],
        };
        ProjectRepository.update.mockResolvedValue(updatedProject);

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
        ProjectRepository.update.mockResolvedValue(updatedProject);

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

  describe("patchProjectService", () => {
    beforeEach(() => {
      ProjectRepository.findUnique.mockResolvedValue({
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
      ProjectRepository.update.mockResolvedValue({
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
          fullName: "Admin User",
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
          fullName: "Admin User",
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

      expect(ProjectRepository.update).toHaveBeenCalledWith(
        mockProject.id,
        expectedData
      );
      expect(result).toEqual(expectedProject);
    });

    test("🚫 rejects with 400 when no valid fields provided", async () => {
      await expect(
        patchProjectService(adminUser, mockProject.id, {}, "testtoken")
      ).rejects.toEqual({
        status: 400,
        message: "No valid fields provided for update",
      });
    });

    test("🚫 rejects with 409 on duplicate name (P2002)", async () => {
      ProjectRepository.update.mockRejectedValue({ code: "P2002" });
      await expect(
        patchProjectService(
          adminUser,
          mockProject.id,
          { name: "Duplicate", extra: "value" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 409,
        message: "A project with this name already exists",
      });
    });

    test("🚫 rejects with 404 when project not found (P2025)", async () => {
      ProjectRepository.update.mockRejectedValue({ code: "P2025" });
      await expect(
        patchProjectService(
          adminUser,
          mockProject.id,
          { name: "Nonexistent", extra: "value" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic patch error", async () => {
      ProjectRepository.update.mockRejectedValue(new Error("Database error"));
      await expect(
        patchProjectService(
          adminUser,
          mockProject.id,
          { name: "Test", extra: "value" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error if patch not allowed", async () => {
      ProjectRepository.findUnique.mockResolvedValue(null);
      await expect(
        patchProjectService(
          adminUser,
          mockProject.id,
          { name: "Test", extra: "value" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    describe("Branch Coverage for patchProjectService", () => {
      beforeEach(() => {
        ProjectRepository.findUnique.mockResolvedValue({
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
        ProjectRepository.update.mockResolvedValue(patchedProject);

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
        ProjectRepository.update.mockResolvedValue(patchedProject);

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
        ProjectRepository.update.mockResolvedValue(patchedProject);

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
        ProjectRepository.update.mockResolvedValue(patchedProject);

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
        ProjectRepository.update.mockResolvedValue(patchedProject);

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

  describe("deleteProjectService", () => {
    test("✅ deletes project successfully", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        id: mockProject.id,
        createdBy: adminUser.id,
      });
      ProjectRepository.delete.mockResolvedValue({});

      const result = await deleteProjectService(adminUser, mockProject.id);
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(ProjectRepository.delete).toHaveBeenCalledWith(mockProject.id);
    });

    test("🚫 rejects with 404 when project not found on delete (P2025)", async () => {
      ProjectRepository.findUnique.mockResolvedValue(null);
      await expect(
        deleteProjectService(adminUser, "non-existent-id")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("🚫 rejects with 500 for generic delete error", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        id: mockProject.id,
        createdBy: adminUser.id,
      });
      ProjectRepository.delete.mockRejectedValue(new Error("Database error"));

      await expect(
        deleteProjectService(adminUser, mockProject.id)
      ).rejects.toEqual({
        status: 500,
        message: "Internal server error",
      });
    });

    test("🚫 propagates authorization error from deletion", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
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

  describe("🛠 Project Service - getProjectEmployeesService Tests", () => {
    // eslint-disable-next-line no-unused-vars
    let adminUser, managerUser, employeeUser, mockProject;

    beforeEach(() => {
      adminUser = { id: "admin-id", role: "ROLE_ADMIN" };
      managerUser = { id: "manager-id", role: "ROLE_MANAGER" };
      employeeUser = { id: "employee-id", role: "ROLE_EMPLOYEE" };

      mockProject = {
        id: "project-123",
        employeeIds: ["emp-1", "emp-2"],
      };

      jest.clearAllMocks();
    });

    test("✅ returns a list of enriched employees (200)", async () => {
      // Project exists and user is authorized => findUnique returns the project
      ProjectRepository.findUnique.mockResolvedValue(mockProject);
      // Suppose we found exactly 2 employees; "emp-1" fully known, "emp-2" partially known
      fetchUsersByIds.mockResolvedValue({
        "emp-1": { id: "emp-1", fullName: "Employee One" },
        "emp-2": { id: "emp-2", fullName: "Employee Two" },
      });

      const result = await getProjectEmployeesService(
        adminUser,
        "project-123",
        "token"
      );
      expect(ProjectRepository.findUnique).toHaveBeenCalledWith({
        where: {
          id: "project-123",
          // Because adminUser => no additional role-based filter => {}
        },
        select: { id: true, employeeIds: true },
      });
      expect(result).toEqual([
        { id: "emp-1", fullName: "Employee One" },
        { id: "emp-2", fullName: "Employee Two" },
      ]);
    });

    test("✅ returns empty array if project has no employees", async () => {
      const projectNoEmployees = { id: "project-abc", employeeIds: [] };
      ProjectRepository.findUnique.mockResolvedValue(projectNoEmployees);

      const result = await getProjectEmployeesService(
        adminUser,
        "project-abc",
        "token"
      );
      expect(result).toEqual([]);
      expect(fetchUsersByIds).not.toHaveBeenCalled(); // No employees => no fetch
    });

    test("🚫 rejects with 403 if project exists but user lacks permission", async () => {
      // First call => null (role-based filter => no project returned),
      // Second call => project does exist => means user is not allowed
      ProjectRepository.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "project-xyz" });

      await expect(
        getProjectEmployeesService(employeeUser, "project-xyz", "token")
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to view this project's employees",
      });

      expect(ProjectRepository.findUnique).toHaveBeenCalledTimes(2);
    });

    test("🚫 rejects with 404 if project not found at all", async () => {
      // Both calls => null => project truly doesn't exist
      ProjectRepository.findUnique.mockResolvedValue(null);

      await expect(
        getProjectEmployeesService(adminUser, "non-existent-id", "token")
      ).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("✅ partially enriched employees if some IDs missing", async () => {
      ProjectRepository.findUnique.mockResolvedValue(mockProject);
      fetchUsersByIds.mockResolvedValue({
        "emp-1": { id: "emp-1", fullName: "Employee One" },
        // "emp-2" is missing => fallback to { id: "emp-2" }
      });

      const result = await getProjectEmployeesService(
        adminUser,
        "project-123",
        "token"
      );
      expect(result).toEqual([
        { id: "emp-1", fullName: "Employee One" },
        { id: "emp-2" }, // fallback
      ]);
    });

    test("🚫 rejects with internal error (500) if findUnique fails unexpectedly", async () => {
      ProjectRepository.findUnique.mockRejectedValue(new Error("DB error"));
      await expect(
        getProjectEmployeesService(adminUser, "project-123", "token")
      ).rejects.toThrow("DB error"); // or toEqual() if you want a custom shape
    });
  });

  describe("Additional Branch Coverage for Authorization and Delete Error Handling", () => {
    test("should apply ROLE_EMPLOYEE filter", async () => {
      const empUser = { id: "emp-123", role: "ROLE_EMPLOYEE" };
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      await getProjectsService(empUser, {}, "testtoken");
      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { employeeIds: { has: "emp-123" } },
        })
      );
    });

    test("should apply ROLE_MANAGER filter", async () => {
      const mgrUser = { id: "mgr-456", role: "ROLE_MANAGER" };
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      await getProjectsService(mgrUser, {}, "testtoken");
      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
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
      const admUser = { id: "adm-789", role: "ROLE_ADMIN" };
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      await getProjectsService(admUser, {}, "testtoken");
      expect(ProjectRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        })
      );
    });

    test("updateProjectService: unauthorized modification for ROLE_MANAGER", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        id: "test-id",
        managerId: "someone-else",
        createdBy: "another-user",
      });
      const mgrUser = { id: "mgr-123", role: "ROLE_MANAGER" };

      await expect(
        updateProjectService(
          mgrUser,
          "test-id",
          { name: "New Name" },
          "testtoken"
        )
      ).rejects.toEqual({
        status: 403,
        message:
          "Access denied: You do not have permission to update this project",
      });
    });

    test("deleteProjectService: authorized deletion for ROLE_MANAGER (project created by manager)", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        id: "test-id",
        createdBy: "mgr-123",
      });
      const mgrUser = { id: "mgr-123", role: "ROLE_MANAGER" };
      ProjectRepository.delete.mockResolvedValue({ id: "test-id" });

      const result = await deleteProjectService(mgrUser, "test-id");
      expect(result).toEqual({ message: "Project deleted successfully" });
      expect(ProjectRepository.delete).toHaveBeenCalledWith("test-id");
    });

    test("deleteProjectService: returns 404 if delete fails with error code P2025", async () => {
      ProjectRepository.findUnique.mockResolvedValue({
        id: "test-id",
        createdBy: "admin-id",
      });
      ProjectRepository.delete.mockRejectedValue({ code: "P2025" });
      const admUser = { id: "admin-id", role: "ROLE_ADMIN" };

      await expect(deleteProjectService(admUser, "test-id")).rejects.toEqual({
        status: 404,
        message: "Project not found",
      });
    });

    test("should use provided numeric page and limit when they are >= 1", async () => {
      const validQuery = { page: "2", limit: "5" };
      ProjectRepository.findMany.mockResolvedValue([mockProject]);
      ProjectRepository.count.mockResolvedValue(1);

      const result = await getProjectsService(
        adminUser,
        validQuery,
        "testtoken"
      );
      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
    });

    // Example test specifically hitting "manager" branch in authorizeProjectModification
    test("should log manager authorized branch in updateProjectService", async () => {
      // The line: if (user.role === 'ROLE_MANAGER' && (existingProject.managerId===user.id||...))
      const managerUserX = { id: "mgr-999", role: "ROLE_MANAGER" };
      // Return a project with managerId = mgr-999
      ProjectRepository.findUnique.mockResolvedValue({
        id: "some-proj-id",
        managerId: "mgr-999",
        createdBy: "another-user",
      });
      // Spy on console.log
      const spyLog = jest.spyOn(console, "log").mockImplementation(() => {});
      // Make sure the update call resolves
      ProjectRepository.update.mockResolvedValue({
        ...mockProject,
        managerId: "mgr-999",
      });
      fetchUsersByIds.mockResolvedValue({});

      await updateProjectService(
        managerUserX,
        "some-proj-id",
        { name: "someName" },
        "token"
      );

      expect(spyLog).toHaveBeenCalledWith(
        "Manager updating project they manage or created: some-proj-id"
      );
      spyLog.mockRestore();
    });
  });

  describe("Task assignedTo enrichment in getProjectByIdService", () => {
    test("✅ enriches task assignedTo field with user details when found", async () => {
      // Create a project that has one stage with two tasks:
      // - One task assigned to a known user ("user-1")
      // - One task assigned to an unknown user ("user-unknown")
      const projectWithTasks = {
        ...mockProject,
        stages: [
          {
            id: "stage-1",
            name: "backlog",
            tasks: [
              { id: "task-1", assignedTo: "user-1", title: "Task 1" },
              { id: "task-2", assignedTo: "user-unknown", title: "Task 2" },
            ],
          },
        ],
      };

      // Simulate that the repository returns the project with its stages and tasks
      ProjectRepository.findUnique.mockResolvedValue(projectWithTasks);

      // Simulate fetching user details: only "user-1" is found
      fetchUsersByIds.mockResolvedValue({
        "user-1": { id: "user-1", fullName: "User One", role: "ROLE_EMPLOYEE" },
      });

      const result = await getProjectByIdService(
        adminUser,
        projectWithTasks.id,
        "testtoken"
      );

      // The first task should have enriched assignedTo, the second falls back to { id: "user-unknown" }
      expect(result.stages[0].tasks[0].assignedTo).toEqual({
        id: "user-1",
        fullName: "User One",
        role: "ROLE_EMPLOYEE",
      });
      expect(result.stages[0].tasks[1].assignedTo).toEqual({
        id: "user-unknown",
      });
    });

    test("✅ returns null for task assignedTo when not provided", async () => {
      // Create a project with one stage and one task that has no assignedTo field.
      const projectWithoutAssignedTask = {
        ...mockProject,
        stages: [
          {
            id: "stage-1",
            name: "backlog",
            tasks: [{ id: "task-3", title: "Task without assignment" }],
          },
        ],
      };

      ProjectRepository.findUnique.mockResolvedValue(
        projectWithoutAssignedTask
      );
      // No user is expected since no assignedTo is provided.
      fetchUsersByIds.mockResolvedValue({});

      const result = await getProjectByIdService(
        adminUser,
        projectWithoutAssignedTask.id,
        "testtoken"
      );
      expect(result.stages[0].tasks[0].assignedTo).toBeNull();
    });

    test("✅ when stage.tasks is an empty array, enrichment returns an empty array", async () => {
      // Simulate a project with a stage that has an empty tasks array.
      const projectEmptyTasks = {
        ...mockProject,
        stages: [
          {
            id: "stage-empty",
            name: "In Progress",
            tasks: [],
          },
        ],
      };
      ProjectRepository.findUnique.mockResolvedValue(projectEmptyTasks);
      fetchUsersByIds.mockResolvedValue({});

      const result = await getProjectByIdService(
        adminUser,
        projectEmptyTasks.id,
        "testtoken"
      );
      // Expect that tasks remains an empty array
      expect(result.stages[0].tasks).toEqual([]);
    });
  });
});
