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
 *     summary: Retrieve all tasks with pagination and filtering
 *     description: >
 *       Fetches a paginated list of tasks, optionally filtered by title, priority, stageId, or projectId.
 *       Sort results by title, createdAt, or updatedAt.
 *       Tasks are further filtered based on the user's role:
 *       - **ROLE_ADMIN**: sees all tasks
 *       - **ROLE_MANAGER**: sees tasks where user is project manager, project creator, or in the project’s employeeIds
 *       - **ROLE_EMPLOYEE**: sees tasks for projects in which the user is listed in employeeIds
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
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Filter by a partial title match (case-insensitive).
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Filter by exact priority.
 *       - in: query
 *         name: stageId
 *         schema:
 *           type: string
 *         description: Filter by a specific stage ID.
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by a specific project ID.
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [title, createdAt, updatedAt]
 *         description: Sort by title, createdAt, or updatedAt. Defaults to createdAt.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order (asc or desc). Defaults to desc.
 *     responses:
 *       200:
 *         description: A paginated list of tasks retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "abc123-task-uuid"
 *                       title:
 *                         type: string
 *                         example: "Design UI"
 *                       priority:
 *                         type: string
 *                         example: "HIGH"
 *                       stageId:
 *                         type: string
 *                         example: "stage-uuid"
 *                       projectId:
 *                         type: string
 *                         example: "project-uuid"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-02-22T12:00:00Z"
 *                       updatedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-02-23T14:30:00Z"
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 totalCount:
 *                   type: integer
 *                   example: 50
 *                 totalPages:
 *                   type: integer
 *                   example: 5
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
 *     description: >
 *       Fetches details of a specific task, including stage and project info.
 *       User must have permission to view tasks in the corresponding project (role-based).
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
 *     description: >
 *       Creates a new task within a project stage. Only Admins and Managers can create tasks.
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
 *     description: >
 *       Replaces all fields of an existing task.
 *       Only Admins and Managers (project manager or creator) can perform a full update.
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
 *     description: >
 *       Updates specific fields of an existing task.
 *       Only Admins, Managers (project manager/creator, or manager in employee list can only patch stageId),
 *       or Employees (only patch stageId) can do partial updates.
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
 *     description: >
 *       Removes a task from a project.
 *       - Admins can delete any task
 *       - Managers can delete only tasks from projects they created
 *       - Employees cannot delete tasks
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
