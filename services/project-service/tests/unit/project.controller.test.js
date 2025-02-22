import * as projectController from "../../controllers/project.controller.js";
import { prisma } from "../../config/database.js";
import { ProjectDTO } from "../../dtos/project.dto.js";

jest.mock("../../config/database.js", () => ({
  prisma: {
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("🛠 Project Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const projectData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "WorkNest Platform",
    description: "A project management platform",
    createdBy: "user-id-1",
    image: "https://example.com/project-image.png",
    documents: ["https://example.com/doc1.pdf"],
    managerId: "manager-id-1",
    employeeIds: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("✅ Get all projects (200)", async () => {
    prisma.project.findMany.mockResolvedValue([projectData]);

    await projectController.getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith([new ProjectDTO(projectData)]);
  });

  test("🚫 Get all projects - Internal Server Error (500)", async () => {
    prisma.project.findMany.mockRejectedValue(new Error("Database error"));

    await projectController.getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Get project by ID (200)", async () => {
    req.params.id = projectData.id;
    prisma.project.findUnique.mockResolvedValue(projectData);

    await projectController.getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(new ProjectDTO(projectData));
  });

  test("🚫 Get project by ID - Not Found (404)", async () => {
    req.params.id = projectData.id;
    prisma.project.findUnique.mockResolvedValue(null);

    await projectController.getProjectById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Project not found" });
  });

  test("✅ Create a project (201)", async () => {
    req.body = {
      name: "WorkNest Platform",
      description: "A project management platform",
      createdBy: "user-id-1",
    };
    prisma.project.create.mockResolvedValue(projectData);

    await projectController.createProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Project created successfully",
      project: new ProjectDTO(projectData),
    });
  });

  test("🚫 Create project - Duplicate Name (409)", async () => {
    req.body = {
      name: "WorkNest Platform",
      description: "A project management platform",
      createdBy: "user-id-1",
    };
    prisma.project.create.mockRejectedValue({ code: "P2002" });

    await projectController.createProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists for this user" });
  });
  
  test("✅ Update project (200)", async () => {
    req.params.id = projectData.id;
    req.body = { name: "Updated WorkNest Platform" };

    prisma.project.update.mockResolvedValue({ ...projectData, name: "updated worknest platform" });

    await projectController.updateProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Project updated successfully",
      project: new ProjectDTO({ ...projectData, name: "updated worknest platform" }),
    });
  });

  test("🚫 Update project - Duplicate Name (409)", async () => {
    req.params.id = projectData.id;
    req.body = { name: "Duplicate WorkNest Platform" };

    prisma.project.update.mockRejectedValue({ code: "P2002" });

    await projectController.updateProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists for this user" });
  });

  test("✅ Patch project (200)", async () => {
    req.params.id = projectData.id;
    req.body = { description: "Updated Description" };

    prisma.project.update.mockResolvedValue({ ...projectData, description: "Updated Description" });

    await projectController.patchProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Project updated successfully",
      project: new ProjectDTO({ ...projectData, description: "Updated Description" }),
    });
  });

  test("🚫 Patch project - Duplicate Name (409)", async () => {
    req.params.id = projectData.id;
    req.body = { name: "Duplicate WorkNest Platform" };

    prisma.project.update.mockRejectedValue({ code: "P2002" });

    await projectController.patchProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: "A project with this name already exists for this user" });
  });

  test("✅ Delete project (200)", async () => {
    req.params.id = projectData.id;
    prisma.project.delete.mockResolvedValue({});

    await projectController.deleteProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ message: "Project deleted successfully" });
  });

  test("🚫 Delete project - Internal Server Error (500)", async () => {
    req.params.id = projectData.id;
    prisma.project.delete.mockRejectedValue(new Error("Database error"));

    await projectController.deleteProject[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Create project - Internal Server Error (500)", async () => {
    req.body = {
      name: "WorkNest Platform",
      description: "A project management platform",
      createdBy: "user-id-1",
    };
    prisma.project.create.mockRejectedValue(new Error("Database error"));
  
    await projectController.createProject[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  
  test("🚫 Update project - Internal Server Error (500)", async () => {
    req.params.id = projectData.id;
    req.body = { name: "Updated WorkNest Platform" };
  
    prisma.project.update.mockRejectedValue(new Error("Database error"));
  
    await projectController.updateProject[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  
  test("🚫 Patch project - No valid fields provided (400)", async () => {
    req.params.id = projectData.id;
    req.body = {}; // No valid fields
  
    await projectController.patchProject[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "No valid fields provided for update" });
  });
  
  test("🚫 Patch project - Internal Server Error (500)", async () => {
    req.params.id = projectData.id;
    req.body = { name: "Updated WorkNest Platform" };
  
    prisma.project.update.mockRejectedValue(new Error("Database error"));
  
    await projectController.patchProject[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  
  test("🚫 Delete project - Internal Server Error (500)", async () => {
    req.params.id = projectData.id;
    prisma.project.delete.mockRejectedValue(new Error("Database error"));
  
    await projectController.deleteProject[2](req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  
  test("🚫 Get project by ID - Internal Server Error (500)", async () => {
    req.params.id = projectData.id;
    prisma.project.findUnique.mockRejectedValue(new Error("Database error"));
  
    await projectController.getProjectById(req, res);
  
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
