import express from "express";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  patchProject,
  deleteProject,
} from "../controllers/project.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: API for managing projects
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Retrieve all projects with filters and pagination
 *     description: Fetches a list of projects with optional filters and sorting.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of projects per page.
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter projects by name (case-insensitive search).
 *       - in: query
 *         name: description
 *         schema:
 *           type: string
 *         description: Filter projects by description (case-insensitive search).
 *       - in: query
 *         name: createdAt
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter projects by creation date (YYYY-MM-DD).
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by.
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sorting order (ascending or descending).
 *     responses:
 *       200:
 *         description: A list of projects retrieved successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized.
 *       500:
 *         description: Internal server error.
 */
router.get("/", authMiddleware, getProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get a project by ID
 *     description: Fetches details of a specific project.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to retrieve.
 *     responses:
 *       200:
 *         description: Project retrieved successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to view the project.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", authMiddleware, getProjectById);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Creates a new project with the given details.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New WorkNest Project"
 *               description:
 *                 type: string
 *                 example: "This is a new project description."
 *               image:
 *                 type: string
 *                 format: url
 *                 example: "https://example.com/project-image.png"
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: url
 *                 example: ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"]
 *               createdBy:
 *                 type: string
 *                 example: "d7d6f728-8e2d-4b8a-a349-fd1a534b7e5a"
 *               managerId:
 *                 type: string
 *                 example: "b1d2c3e4-5678-9fgh-ijkl-mnopqrstuvwx"
 *               employeeIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["e1f2g3h4-5678-ijkl-mnopqrstuvwx"]
 *     responses:
 *       201:
 *         description: Project created successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: Only admins or managers can create projects.
 *       409:
 *         description: A project with this name already exists for this user.
 *       500:
 *         description: Internal server error.
 */
router.post("/", authMiddleware, createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project (Full Update)
 *     description: Replaces all fields of an existing project.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated WorkNest Project"
 *               description:
 *                 type: string
 *                 example: "Updated project description."
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User not verified or not authorized to update the project.
 *       404:
 *         description: Project not found.
 *       409:
 *         description: A project with this name already exists for this user.
 *       500:
 *         description: Internal server error.
 */
router.put("/:id", authMiddleware, updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   patch:
 *     summary: Partially update a project
 *     description: Updates specific fields of a project.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to update.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Patch WorkNest Project"
 *               description:
 *                 type: string
 *                 example: "Partially updated project description."
 *     responses:
 *       200:
 *         description: Project updated successfully.
 *       400:
 *         description: Invalid or expired token, or no valid fields provided for update.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User not verified or not authorized to update the project.
 *       404:
 *         description: Project not found.
 *       409:
 *         description: A project with this name already exists for this user.
 *       500:
 *         description: Internal server error.
 */
router.patch("/:id", authMiddleware, patchProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Removes a project from the system.
 *     tags: [Projects]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to delete.
 *     responses:
 *       200:
 *         description: Project deleted successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User not verified or not authorized to delete the project.
 *       404:
 *         description: Project not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:id", authMiddleware, deleteProject);

export default router;
