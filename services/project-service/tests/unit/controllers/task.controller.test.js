import * as taskController from "../../../controllers/task.controller.js";
import { prisma } from "../../../config/database.js";
import { TaskDTO } from "../../../dtos/task.dto.js";

jest.mock("../../../config/database.js", () => ({
  prisma: {
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe("🛠 Task Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, headers: {}, query: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  const taskData = {
    id: "task-uuid",
    title: "Task Title",
    description: "Task description",
    priority: "HIGH",
    stageId: "stage-uuid",
    projectId: "project-uuid",
    assignedTo: null,
    images: ["https://example.com/image1.png"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("✅ Get all tasks (200) - Success with pagination", async () => {
    prisma.task.findMany.mockResolvedValue([taskData]);
    prisma.task.count.mockResolvedValue(1);

    req.query.page = "1";
    req.query.limit = "10";

    await taskController.getTasks(req, res);

    expect(res.json).toHaveBeenCalledWith({
      data: [new TaskDTO(taskData)],
      page: 1,
      limit: 10,
      totalCount: 1,
      totalPages: 1,
    });
  });

  test("🚫 Get all tasks - Internal Server Error (500)", async () => {
    prisma.task.findMany.mockRejectedValue(new Error("Database error"));

    await taskController.getTasks(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Get task by ID (200)", async () => {
    req.params.id = taskData.id;
    prisma.task.findUnique.mockResolvedValue(taskData);

    await taskController.getTaskById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(new TaskDTO(taskData));
  });

  test("🚫 Get task by ID - Not Found (404)", async () => {
    req.params.id = taskData.id;
    prisma.task.findUnique.mockResolvedValue(null);

    await taskController.getTaskById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
  });

  test("🚫 Get task by ID - Internal Server Error (500)", async () => {
    req.params.id = taskData.id;
    prisma.task.findUnique.mockRejectedValue(new Error("Database error"));

    await taskController.getTaskById[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Create a task (201)", async () => {
    req.body = {
      title: "Task Title",
      description: "Task Description",
      priority: "HIGH",
      stageId: taskData.stageId,
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo,
      images: taskData.images,
    };

    prisma.task.create.mockResolvedValue(taskData);

    await taskController.createTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task created successfully",
      task: new TaskDTO(taskData),
    });
  });

  test("🚫 Create task - Duplicate Title (409)", async () => {
    req.body = {
      title: "Task Title",
      projectId: taskData.projectId,
    };

    prisma.task.create.mockRejectedValue({ code: "P2002" });

    await taskController.createTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A task with this title already exists for this project",
    });
  });

  test("✅ Update task (200)", async () => {
    req.params.id = taskData.id;
    req.body = { title: "Updated Task", priority: "LOW" };

    prisma.task.update.mockResolvedValue({
      ...taskData,
      title: "updated task",
      priority: "LOW",
    });

    await taskController.updateTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task updated successfully",
      task: new TaskDTO({
        ...taskData,
        title: "updated task",
        priority: "LOW",
      }),
    });
  });

  test("🚫 Update task - Internal Server Error (500)", async () => {
    req.params.id = taskData.id;
    req.body = { title: "Updated Task" };

    prisma.task.update.mockRejectedValue(new Error("Database error"));

    await taskController.updateTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Patch task - Convert title to lowercase", async () => {
    req.params.id = taskData.id;
    req.body = { title: "UPDATED TASK" };

    prisma.task.update.mockResolvedValue({
      ...taskData,
      title: "updated task",
    });

    await taskController.patchTask[2](req, res);

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { title: "updated task" },
      include: { Project: true, Stage: true }, // Add this to match the actual function
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task updated successfully",
      task: new TaskDTO({ ...taskData, title: "updated task" }),
    });
  });

  test("🚫 Patch task - No valid fields provided (400)", async () => {
    req.params.id = taskData.id;
    req.body = {}; // No fields provided

    await taskController.patchTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "No valid fields provided for update",
    });
  });

  test("✅ Delete task (200)", async () => {
    req.params.id = taskData.id;
    prisma.task.delete.mockResolvedValue({});

    await taskController.deleteTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task deleted successfully",
    });
  });

  test("🚫 Delete task - Internal Server Error (500)", async () => {
    req.params.id = taskData.id;
    prisma.task.delete.mockRejectedValue(new Error("Database error"));

    await taskController.deleteTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Create task - Internal Server Error (500)", async () => {
    req.body = {
      title: "New Task",
      description: "Task description",
      priority: "HIGH",
      stageId: "stage-uuid",
      projectId: "project-uuid",
      assignedTo: "user-uuid",
      images: ["https://example.com/task-image.png"],
    };

    prisma.task.create.mockRejectedValue(new Error("Database error"));

    await taskController.createTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("🚫 Update task - Duplicate Title Conflict (409)", async () => {
    req.params.id = "task-uuid";
    req.body = { title: "Updated Task" };

    prisma.task.update.mockRejectedValue({ code: "P2002" });

    await taskController.updateTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A task with this title already exists for this project",
    });
  });

  test("🚫 Patch task - Duplicate Title Conflict (409)", async () => {
    req.params.id = "task-uuid";
    req.body = { title: "Updated Task" };

    prisma.task.update.mockRejectedValue({ code: "P2002" });

    await taskController.patchTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: "A task with this title already exists for this project",
    });
  });

  test("🚫 Patch task - Internal Server Error (500)", async () => {
    req.params.id = "task-uuid";
    req.body = { title: "Updated Task" };

    prisma.task.update.mockRejectedValue(new Error("Database error"));

    await taskController.patchTask[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  test("✅ Patch task - Ignore undefined values", async () => {
    req.params.id = "task-uuid";
    req.body = { priority: "LOW", title: undefined }; // `title` is undefined and should be ignored

    prisma.task.update.mockResolvedValue({
      id: "task-uuid",
      title: "existing task",
      description: "Task description",
      priority: "LOW", // This should be updated
      stageId: "stage-uuid",
      projectId: "project-uuid",
      assignedTo: "user-uuid",
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await taskController.patchTask[2](req, res);

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { priority: "LOW" }, // `title` should NOT be in data
      include: { Stage: true, Project: true },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task updated successfully",
      task: new TaskDTO({
        id: "task-uuid",
        title: "existing task",
        description: "Task description",
        priority: "LOW",
        stageId: "stage-uuid",
        projectId: "project-uuid",
        assignedTo: "user-uuid",
        images: [],
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    });
  });

  test("✅ Update task - No title provided (else path)", async () => {
    req.params.id = "task-uuid";
    req.body = { priority: "LOW" }; // No title in the request

    prisma.task.update.mockResolvedValue({
      ...taskData,
      priority: "LOW",
    });

    await taskController.updateTask[2](req, res);

    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: req.params.id },
      data: { priority: "LOW" }, // Title should NOT be included
      include: { Stage: true, Project: true },
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Task updated successfully",
      task: new TaskDTO({
        ...taskData,
        priority: "LOW",
      }),
    });
  });
});
