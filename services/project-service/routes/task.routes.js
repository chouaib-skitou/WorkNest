import express from "express";
import {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  patchTask,
  deleteTask,
} from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: API for managing tasks within stages and projects
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Retrieve all tasks with pagination
 *     description: Fetches a paginated list of tasks. Tasks are filtered based on the user's role.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: The number of tasks per page.
 *     responses:
 *       200:
 *         description: A paginated list of tasks retrieved successfully.
 *       400:
 *         description: Invalid request parameters.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authMiddleware, getTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     description: Fetches details of a specific task, including any relevant stage/project info.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to retrieve.
 *     responses:
 *       200:
 *         description: Task retrieved successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to view the task.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", authMiddleware, getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task within a project stage. Only Admins and Managers can create tasks.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - priority
 *               - stageId
 *               - projectId
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Design UI"
 *               description:
 *                 type: string
 *                 example: "Create wireframes for the dashboard"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: "HIGH"
 *               stageId:
 *                 type: string
 *                 example: "d7d6f728-8e2d-4b8a-a349-fd1a534b7e5a"
 *               projectId:
 *                 type: string
 *                 example: "6ca55721-cf0b-419f-8c7d-266cc6432956"
 *               assignedTo:
 *                 type: string
 *                 example: "b1d2c3e4-5678-9fgh-ijkl-mnopqrstuvwx"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example: ["https://example.com/task-image.png"]
 *     responses:
 *       201:
 *         description: Task created successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified.
 *       409:
 *         description: A task with this title already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.post("/", authMiddleware, createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task (Full Update)
 *     description: Replaces all fields of an existing task.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated Task Title"
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: "MEDIUM"
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to update the task.
 *       404:
 *         description: Task not found.
 *       409:
 *         description: A task with this title already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.put("/:id", authMiddleware, updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   patch:
 *     summary: Partially update a task
 *     description: Updates specific fields of an existing task.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Patched Task Title"
 *               description:
 *                 type: string
 *                 example: "Patched description"
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 example: "LOW"
 *               stageId:
 *                 type: string
 *                 example: "b7d6f111-8e2d-4b8a-a349-fd1a534b7e5a"
 *               assignedTo:
 *                 type: string
 *                 example: "b1d2c3e4-5678-9fgh-ijkl-mnopqrstuvwx"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example: ["https://example.com/task-patch-image.png"]
 *     responses:
 *       200:
 *         description: Task updated successfully.
 *       400:
 *         description: Invalid or expired token, or no valid fields provided for update.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to update the task.
 *       404:
 *         description: Task not found.
 *       409:
 *         description: A task with this title already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.patch("/:id", authMiddleware, patchTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Removes a task from a project. Only Admins can delete any task; Managers can delete only tasks from projects they created.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the task to delete.
 *     responses:
 *       200:
 *         description: Task deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to delete the task.
 *       404:
 *         description: Task not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:id", authMiddleware, deleteTask);

export default router;
