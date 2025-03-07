// task.controller.js
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createTaskValidation,
  updateTaskValidation,
  patchTaskValidation,
  deleteTaskValidation,
  getTaskByIdValidation,
} from "../validators/task.validator.js";
import {
  getTasksService,
  getTaskByIdService,
  createTaskService,
  updateTaskService,
  patchTaskService,
  deleteTaskService,
} from "../services/task.service.js";

/**
 * Get all tasks with pagination and optional filtering.
 * @route GET /api/tasks
 * @access Protected
 */
export const getTasks = async (req, res,) => {
  try {
    const tasks = await getTasksService(req.user, req.query, req.headers.authorization.split(" ")[1]);
    res.status(200).json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get a task by ID.
 * @route GET /api/tasks/:id
 * @access Protected
 */
export const getTaskById = [
  getTaskByIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await getTaskByIdService(req.user, id, req.headers.authorization.split(" ")[1]);
      if (!task) return res.status(404).json({ error: "Task not found" });
      res.status(200).json(task);
    } catch (error) {
      console.error("Error fetching task by ID:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Create a new task.
 * @route POST /api/tasks
 * @access Protected (Admins and Managers; only Managers with proper project authorization)
 */
export const createTask = [
  createTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const task = await createTaskService(req.user, req.body, req.headers.authorization.split(" ")[1]);
      res.status(201).json({
        message: "Task created successfully",
        task,
      });
    } catch (error) {
      console.error("❌ Error creating task:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Fully update a task.
 * @route PUT /api/tasks/:id
 * @access Protected (Admins and Managers with proper authorization)
 */
export const updateTask = [
  updateTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await updateTaskService(req.user, id, req.body, req.headers.authorization.split(" ")[1]);
      res.status(200).json({
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      console.error("❌ Error updating task:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Partially update a task.
 * @route PATCH /api/tasks/:id
 * @access Protected (Admins, Managers, and Employees with proper authorization)
 */
export const patchTask = [
  patchTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const task = await patchTaskService(req.user, id, req.body, req.headers.authorization.split(" ")[1]);
      res.status(200).json({
        message: "Task updated successfully",
        task,
      });
    } catch (error) {
      console.error("❌ Error patching task:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Delete a task.
 * @route DELETE /api/tasks/:id
 * @access Protected (Admins and Managers who created the associated project)
 */
export const deleteTask = [
  deleteTaskValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const response = await deleteTaskService(req.user, id);
      res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error deleting task:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];
