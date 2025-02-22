import * as projectController from "../../../controllers/project.controller.js";
import { prisma } from "../../../config/database.js";
import { ProjectDTO } from "../../../dtos/project.dto.js";

jest.mock("../../../config/database.js", () => ({
    prisma: {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    },
  }));
  

describe("🛠 Project Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {}, query: {} };
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

  test("✅ Get all projects (200) - Success with pagination", async () => {
    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);

    req.query.page = "1";
    req.query.limit = "10";
    req.query.sortField = "name";
    req.query.sortOrder = "asc";

    await projectController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ Get all projects (200) - No projects found", async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);

    await projectController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [],
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  test("🚫 Get all projects - Invalid `createdAt` filter", async () => {
    req.query.createdAt = "invalid-date";
    
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);

    await projectController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [],
      page: 1,
      limit: 10,
      totalCount: 0,
      totalPages: 0,
    });
  });

  test("🚫 Get all projects - Invalid sorting field (fallback to default)", async () => {
    req.query.sortField = "invalidField"; // Prisma will ignore invalid fields
    req.query.sortOrder = "desc";

    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);

    await projectController.getProjects(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("🚫 Get all projects - Negative pagination values (fallback to default)", async () => {
    req.query.page = "-1"; // Invalid input
    req.query.limit = "-5"; // Invalid input
  
    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);
  
    await projectController.getProjects(req, res);
  
    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1, // Now correctly defaulting to 1
      limit: 10, // Now correctly defaulting to 10
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ Get all projects - Filter by name", async () => {
    req.query.name = "WorkNest"; // Simulate filtering by name
  
    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);
  
    await projectController.getProjects(req, res);
  
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          name: { contains: "WorkNest", mode: "insensitive" }, // ✅ Covers line 27
        }),
      })
    );
  
    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ Get all projects - Filter by description", async () => {
    req.query.description = "management"; // Simulate filtering by description
  
    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);
  
    await projectController.getProjects(req, res);
  
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          description: { contains: "management", mode: "insensitive" }, // ✅ Covers line 34
        }),
      })
    );
  
    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("✅ Get all projects - Filter by createdAt", async () => {
    req.query.createdAt = "2025-02-22"; // Simulate filtering by date
  
    const startOfDay = new Date(req.query.createdAt);
    startOfDay.setHours(0, 0, 0, 0);
  
    const endOfDay = new Date(req.query.createdAt);
    endOfDay.setHours(23, 59, 59, 999);
  
    prisma.project.findMany.mockResolvedValue([projectData]);
    prisma.project.count.mockResolvedValue(1);
  
    await projectController.getProjects(req, res);
  
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { gte: startOfDay, lte: endOfDay }, // ✅ Covers line 43
        }),
      })
    );
  
    expect(res.json).toHaveBeenCalledWith({
      data: [new ProjectDTO(projectData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });  

  test("🚫 Get all projects - Internal Server Error (500)", async () => {
    prisma.project.findMany.mockRejectedValue(new Error("Database error"));

    await projectController.getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
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

  test("✅ Update project - No name provided (else path)", async () => {
    req.params.id = projectData.id;
    req.body = { description: "Updated description" }; // No `name` field
  
    prisma.project.update.mockResolvedValue({ ...projectData, description: "Updated description" });
  
    await projectController.updateProject[2](req, res);
  
    expect(prisma.project.update).toHaveBeenCalledWith({
      where: { id: projectData.id },
      data: { description: "Updated description" }, // ✅ `name` is not updated (else path)
    });
  
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Project updated successfully",
      project: new ProjectDTO({ ...projectData, description: "Updated description" }),
    });
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
