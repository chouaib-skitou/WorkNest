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
  // eslint-disable-next-line no-unused-vars
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {}, query: {}, user: { id: "user-id", role: "ROLE_ADMIN" } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

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

  test("✅ Get all projects (200) - Success", async () => {
    getProjectsService.mockResolvedValue({ data: [mockProject], page: 1, limit: 10, totalCount: 1, totalPages: 1 });

    await projectController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [mockProject],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });
  
  test("🚫 Get all projects - Internal Server Error (500)", async () => {
    getProjectsService.mockRejectedValue(new Error("Database error"));

    await projectController.getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Get project by ID (200) - Success", async () => {
    getProjectByIdService.mockResolvedValue(mockProject);
    req.params.id = mockProject.id;

    await projectController.getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  test("🚫 Get project by ID - Not Found (404)", async () => {
    getProjectByIdService.mockResolvedValue(null);
    req.params.id = "non-existent-id";

    await projectController.getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Project not found" });
  });

  test("🚫 Get project by ID - Internal Server Error (500)", async () => {
    getProjectByIdService.mockRejectedValue(new Error("Database error"));
    req.params.id = mockProject.id;

    await projectController.getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Create project (201) - Success", async () => {
    createProjectService.mockResolvedValue(mockProject);
    req.body = { name: "New Project", description: "A new project" };

    await projectController.createProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  test("🚫 Create project - Duplicate Name (409)", async () => {
    createProjectService.mockRejectedValue({ code: "P2002" });
    req.body = { name: "Duplicate Project", description: "A duplicate project" };

    await projectController.createProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Project name already exists" });
  });

  test("🚫 Create project - Internal Server Error (500)", async () => {
    createProjectService.mockRejectedValue(new Error("Database error"));

    await projectController.createProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Update project (200) - Success", async () => {
    updateProjectService.mockResolvedValue(mockProject);
    req.params.id = mockProject.id;
    req.body = { name: "Updated Project" };

    await projectController.updateProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  test("🚫 Update project - Duplicate Name (409)", async () => {
    updateProjectService.mockRejectedValue({ code: "P2002" });

    await projectController.updateProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Project name already exists" });
  });

  test("🚫 Update project - Internal Server Error (500)", async () => {
    updateProjectService.mockRejectedValue(new Error("Database error"));

    await projectController.updateProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Delete project (200) - Success", async () => {
    deleteProjectService.mockResolvedValue();
    req.params.id = mockProject.id;

    await projectController.deleteProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Project deleted successfully" });
  });

  test("🚫 Delete project - Internal Server Error (500)", async () => {
    deleteProjectService.mockRejectedValue(new Error("Database error"));

    await projectController.deleteProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Patch project (200) - Success", async () => {
    patchProjectService.mockResolvedValue(mockProject);
    req.params.id = mockProject.id;
    req.body = { description: "Updated description" };

    await projectController.patchProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockProject);
  });

  test("🚫 Patch project - Duplicate Name (409)", async () => {
    patchProjectService.mockRejectedValue({ code: "P2002" });

    await projectController.patchProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "Project name already exists" });
  });

  test("🚫 Patch project - Internal Server Error (500)", async () => {
    patchProjectService.mockRejectedValue(new Error("Database error"));

    await projectController.patchProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
