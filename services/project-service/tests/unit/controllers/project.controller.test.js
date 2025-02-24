import * as projectController from "../../../controllers/project.controller.js";
import {
  getProjectsService,
  getProjectByIdService,
  createProjectService,
  updateProjectService,
  patchProjectService,
  deleteProjectService,
} from "../../../services/project.service.js";

jest.mock("../../../services/project.service.js");

describe("🛠 Project Controller Tests", () => {
  let req, res, next;
  const mockProject = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "WorkNest Platform",
    description: "A project management platform",
    createdBy: "user-id-1",
    managerId: "manager-id-1",
    employeeIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "user-id", role: "ROLE_ADMIN" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });
  
  afterAll(() => {
    console.error.mockRestore();
    console.warn.mockRestore();
    console.log.mockRestore();
  });
  

  describe("getProjects", () => {
    test("✅ should return projects successfully (200)", async () => {
      getProjectsService.mockResolvedValue({
        data: [mockProject],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });

      await projectController.getProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [mockProject],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });

    test("🚫 should handle internal server error (500) when error.status is undefined", async () => {
      // Simulate a plain error with no status property.
      getProjectsService.mockRejectedValue(new Error("Database error"));

      await projectController.getProjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("getProjectById", () => {
    test("✅ should return a project by ID successfully (200)", async () => {
      req.params.id = mockProject.id;
      getProjectByIdService.mockResolvedValue(mockProject);

      await projectController.getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    test("🚫 should return 404 when project is not found", async () => {
      req.params.id = "non-existent-id";
      getProjectByIdService.mockResolvedValue(null);

      await projectController.getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Project not found" });
    });

    test("🚫 should handle internal server error for getProjectById (500) when error.status is undefined", async () => {
      req.params.id = mockProject.id;
      getProjectByIdService.mockRejectedValue(new Error("Database error"));

      await projectController.getProjectById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("createProject", () => {
    test("✅ should create a project successfully (201)", async () => {
      req.body = { name: "New Project", description: "A new project" };
      createProjectService.mockResolvedValue(mockProject);

      // createProject is an array of middleware and a handler; invoke the handler at index 2.
      await projectController.createProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    test("🚫 should handle duplicate project name error (409) on create", async () => {
      req.body = { name: "Duplicate Project", description: "A duplicate project" };
      createProjectService.mockRejectedValue({ status: 409, message: "A project with this name already exists" });

      await projectController.createProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists" });
    });

    test("🚫 should handle internal server error on create (500) when error.status is undefined", async () => {
      req.body = { name: "New Project", description: "A new project" };
      createProjectService.mockRejectedValue(new Error("Database error"));

      await projectController.createProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("updateProject", () => {
    test("✅ should update a project successfully (200)", async () => {
      req.params.id = mockProject.id;
      req.body = { name: "Updated Project" };
      updateProjectService.mockResolvedValue(mockProject);

      await projectController.updateProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    test("🚫 should handle duplicate project name error (409) on update", async () => {
      updateProjectService.mockRejectedValue({ status: 409, message: "A project with this name already exists" });

      await projectController.updateProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists" });
    });

    test("🚫 should handle internal server error on update (500) when error.status is undefined", async () => {
      updateProjectService.mockRejectedValue(new Error("Database error"));

      await projectController.updateProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("patchProject", () => {
    test("✅ should patch a project successfully (200)", async () => {
      req.params.id = mockProject.id;
      req.body = { description: "Updated description" };
      patchProjectService.mockResolvedValue(mockProject);

      await projectController.patchProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockProject);
    });

    test("🚫 should handle duplicate project name error (409) on patch", async () => {
      patchProjectService.mockRejectedValue({ status: 409, message: "A project with this name already exists" });

      await projectController.patchProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists" });
    });

    test("🚫 should handle internal server error on patch (500) when error.status is undefined", async () => {
      patchProjectService.mockRejectedValue(new Error("Database error"));

      await projectController.patchProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("deleteProject", () => {
    test("✅ should delete a project successfully (200)", async () => {
      req.params.id = mockProject.id;
      deleteProjectService.mockResolvedValue({ message: "Project deleted successfully" });

      await projectController.deleteProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Project deleted successfully" });
    });

    test("🚫 should handle internal server error on delete (500) when error.status is undefined", async () => {
      deleteProjectService.mockRejectedValue(new Error("Database error"));

      await projectController.deleteProject[2](req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });
});
