// tests/unit/controllers/task.controller.test.js
import * as taskController from "../../../controllers/task.controller.js";
import { TaskDTO } from "../../../dtos/task.dto.js";
import {
  getTasksService,
  getTaskByIdService,
  createTaskService,
  updateTaskService,
  patchTaskService,
  deleteTaskService,
} from "../../../services/task.service.js";

jest.mock("../../../services/task.service.js");

describe("🛠 Task Controller Tests", () => {
  let req, res;
  const taskData = {
    id: "task-uuid",
    title: "task title",
    description: "Task description",
    priority: "HIGH",
    stageId: "stage-uuid",
    projectId: "project-uuid",
    assignedTo: "user-uuid",
    images: ["https://example.com/task-image.png"],
    createdAt: new Date("2025-02-22T12:00:00Z"),
    updatedAt: new Date("2025-02-23T14:30:00Z"),
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
    jest.clearAllMocks();
  });

  describe("getTasks", () => {
    test("✅ should return tasks successfully (200)", async () => {
      getTasksService.mockResolvedValue({
        data: [new TaskDTO(taskData)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
      req.query.page = "1";
      req.query.limit = "10";

      await taskController.getTasks(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [new TaskDTO(taskData)],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });

    test("🚫 should handle internal server error (500) in getTasks", async () => {
      getTasksService.mockRejectedValue(new Error("Database error"));
      await taskController.getTasks(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("getTaskById", () => {
    test("✅ should return task by ID successfully (200)", async () => {
      req.params.id = taskData.id;
      getTaskByIdService.mockResolvedValue(new TaskDTO(taskData));
      // getTaskById is an array; invoke its handler at index 2.
      await taskController.getTaskById[2](req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(new TaskDTO(taskData));
    });

    test("🚫 should return 404 when task not found", async () => {
      req.params.id = taskData.id;
      getTaskByIdService.mockResolvedValue(null);
      await taskController.getTaskById[2](req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "Task not found" });
    });

    test("🚫 should handle internal server error in getTaskById (500)", async () => {
      req.params.id = taskData.id;
      getTaskByIdService.mockRejectedValue(new Error("Database error"));
      await taskController.getTaskById[2](req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("createTask", () => {
    test("✅ should create task successfully (201)", async () => {
      req.body = {
        title: "Task Title",
        description: "Task description",
        priority: "HIGH",
        stageId: taskData.stageId,
        projectId: taskData.projectId,
        assignedTo: taskData.assignedTo,
        images: taskData.images,
      };
      createTaskService.mockResolvedValue(new TaskDTO(taskData));
      await taskController.createTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Task created successfully",
        task: new TaskDTO(taskData),
      });
    });

    test("🚫 should handle duplicate task title error (409) in createTask", async () => {
      req.body = {
        title: "Task Title",
        projectId: taskData.projectId,
      };
      createTaskService.mockRejectedValue({
        status: 409,
        message: "A task with this title already exists for this project",
      });
      await taskController.createTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "A task with this title already exists for this project",
      });
    });

    test("🚫 should handle internal server error in createTask (500)", async () => {
      req.body = {
        title: "Task Title",
        description: "Task description",
        priority: "HIGH",
        stageId: taskData.stageId,
        projectId: taskData.projectId,
      };
      createTaskService.mockRejectedValue(new Error("Database error"));
      await taskController.createTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("updateTask", () => {
    test("✅ should update task successfully (200)", async () => {
      req.params.id = taskData.id;
      req.body = { title: "Updated Task", priority: "LOW" };
      updateTaskService.mockResolvedValue(
        new TaskDTO({ ...taskData, title: "updated task", priority: "LOW" })
      );
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

    test("🚫 should handle duplicate task title error (409) in updateTask", async () => {
      req.params.id = taskData.id;
      req.body = { title: "Duplicate Title" };
      updateTaskService.mockRejectedValue({
        status: 409,
        message: "A task with this title already exists for this project",
      });
      await taskController.updateTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "A task with this title already exists for this project",
      });
    });

    test("🚫 should handle internal server error in updateTask (500)", async () => {
      req.params.id = taskData.id;
      req.body = { title: "Updated Task" };
      updateTaskService.mockRejectedValue(new Error("Database error"));
      await taskController.updateTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });

  describe("patchTask", () => {
    test("✅ should patch task successfully (200)", async () => {
      req.params.id = taskData.id;
      req.body = { title: "PATCHED TASK" };
      patchTaskService.mockResolvedValue(
        new TaskDTO({ ...taskData, title: "patched task" })
      );
      await taskController.patchTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Task updated successfully",
        task: new TaskDTO({ ...taskData, title: "patched task" }),
      });
    });

    test("🚫 should handle duplicate task title error (409) in patchTask", async () => {
      req.params.id = taskData.id;
      req.body = { title: "Duplicate Title" };
      patchTaskService.mockRejectedValue({
        status: 409,
        message: "A task with this title already exists for this project",
      });
      await taskController.patchTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "A task with this title already exists for this project",
      });
    });

    test("🚫 should handle internal server error in patchTask (500)", async () => {
      req.params.id = taskData.id;
      req.body = { title: "Updated Task" };
      patchTaskService.mockRejectedValue(new Error("Database error"));
      await taskController.patchTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });

    test("✅ should convert task title to lowercase in patchTask", async () => {
      req.params.id = taskData.id;
      req.body = { title: "UPPERCASE TITLE" };
      patchTaskService.mockResolvedValue(
        new TaskDTO({ ...taskData, title: "uppercase title" })
      );
      await taskController.patchTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: "Task updated successfully",
        task: new TaskDTO({ ...taskData, title: "uppercase title" }),
      });
    });
  });

  describe("deleteTask", () => {
    test("✅ should delete task successfully (200)", async () => {
      req.params.id = taskData.id;
      deleteTaskService.mockResolvedValue({
        status: 200,
        message: "Task deleted successfully",
      });
      await taskController.deleteTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 200,
        message: "Task deleted successfully",
      });
    });

    test("🚫 should handle internal server error in deleteTask (500)", async () => {
      req.params.id = taskData.id;
      deleteTaskService.mockRejectedValue(new Error("Database error"));
      await taskController.deleteTask[2](req, res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });
});
