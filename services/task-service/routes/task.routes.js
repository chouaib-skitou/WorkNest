import express from "express";
import { getTasks, getTaskById, createTask, updateTask,deleteTask } from "../controllers/task.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Task
 *   description: Task management operations
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieves a list of all tasks.
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved tasks list.
 *       403:
 *         description: Unauthorized, missing or invalid token.
 */
router.get("/", getTasks);

/**
 * @swagger
 * /tasks/{taskId}:
 *   get:
 *     summary: Get a task by ID
 *     description: Retrieve a specific task using its ID
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the task
 *     responses:
 *       200:
 *         description: Successfully retrieved task
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 description:
 *                   type: string
 *                 status:
 *                   type: string
 *                 assignedTo:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get("/:taskId", getTaskById);

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task with the given details.
 *     tags:
 *       - Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Complete project report"
 *               description:
 *                 type: string
 *                 example: "Finalize and submit the report by end of the week"
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *                 example: "PENDING"
 *               assignedTo:
 *                 type: string
 *                 example: "1"
 *     responses:
 *       201:
 *         description: Task created successfully
 *       500:
 *         description: Error creating task
 */
router.post("/create", createTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   put:
 *     summary: Update an existing task
 *     description: Updates an existing task by its ID with new details.
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         description: The ID of the task to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - status
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Fix Login Bug"
 *               description:
 *                 type: string
 *                 example: "Investigate and resolve the login issue"
 *               status:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *                 example: "IN_PROGRESS"
 *               assignedTo:
 *                 type: string
 *                 example: "user-id-123"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       404:
 *         description: Task not found
 *       400:
 *         description: Invalid data or user not found
 *       500:
 *         description: Error updating task
 */
router.put("/:taskId", updateTask);

/**
 * @swagger
 * /tasks/{taskId}:
 *   delete:
 *     summary: Delete a task by ID
 *     description: Deletes a specific task using its ID
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the task
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Error deleting task
 */
router.delete("/:taskId", deleteTask);

export default router;
