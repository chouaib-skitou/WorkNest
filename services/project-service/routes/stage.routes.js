import express from "express";
import {
  getStages,
  createStage,
  getStageById,
  updateStage,
  patchStage,
  deleteStage,
} from "../controllers/stage.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Stages
 *   description: API for managing project stages
 */

/**
 * @swagger
 * /api/stages:
 *   get:
 *     summary: Retrieve all stages with pagination
 *     description: Fetches a paginated list of stages. Stages are filtered based on the user's role.
 *     tags: [Stages]
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
 *         description: The number of stages per page.
 *     responses:
 *       200:
 *         description: A paginated list of stages retrieved successfully.
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
 *                         example: "d1a2b3c4-5678-9def-ghij-klmnopqrstuv"
 *                       name:
 *                         type: string
 *                         example: "Design Phase"
 *                       position:
 *                         type: integer
 *                         example: 1
 *                       color:
 *                         type: string
 *                         example: "#FF5733"
 *                       projectId:
 *                         type: string
 *                         example: "d7d6f728-8e2d-4b8a-a349-fd1a534b7e5a"
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
router.get("/", authMiddleware, getStages);

/**
 * @swagger
 * /api/stages/{id}:
 *   get:
 *     summary: Get a stage by ID
 *     description: Fetches details of a specific stage, including its tasks.
 *     tags: [Stages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stage to retrieve.
 *     responses:
 *       200:
 *         description: Stage retrieved successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to view the stage.
 *       404:
 *         description: Stage not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/:id", authMiddleware, getStageById);

/**
 * @swagger
 * /api/stages:
 *   post:
 *     summary: Create a new stage
 *     description: Creates a new stage within a project. Only Admins and Managers can create stages.
 *     tags: [Stages]
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
 *               - position
 *               - projectId
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Design Phase"
 *               position:
 *                 type: integer
 *                 example: 1
 *               color:
 *                 type: string
 *                 format: hex
 *                 example: "#FF5733"
 *               projectId:
 *                 type: string
 *                 example: "d7d6f728-8e2d-4b8a-a349-fd1a534b7e5a"
 *     responses:
 *       201:
 *         description: Stage created successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified.
 *       409:
 *         description: A stage with this name already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.post("/", authMiddleware, createStage);

/**
 * @swagger
 * /api/stages/{id}:
 *   put:
 *     summary: Update a stage (Full Update)
 *     description: Replaces all fields of an existing stage.
 *     tags: [Stages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stage to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - position
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Stage Name"
 *               position:
 *                 type: integer
 *                 example: 2
 *               color:
 *                 type: string
 *                 format: hex
 *                 example: "#008000"
 *     responses:
 *       200:
 *         description: Stage updated successfully.
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to update the stage.
 *       404:
 *         description: Stage not found.
 *       409:
 *         description: A stage with this name already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.put("/:id", authMiddleware, updateStage);

/**
 * @swagger
 * /api/stages/{id}:
 *   patch:
 *     summary: Partially update a stage
 *     description: Updates specific fields of a stage.
 *     tags: [Stages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stage to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Stage Name"
 *               position:
 *                 type: integer
 *                 example: 2
 *               color:
 *                 type: string
 *                 format: hex
 *                 example: "#008000"
 *     responses:
 *       200:
 *         description: Stage updated successfully.
 *       400:
 *         description: Invalid or expired token, or no valid fields provided for update.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to update the stage.
 *       404:
 *         description: Stage not found.
 *       409:
 *         description: A stage with this name already exists for this project.
 *       500:
 *         description: Internal server error.
 */
router.patch("/:id", authMiddleware, patchStage);

/**
 * @swagger
 * /api/stages/{id}:
 *   delete:
 *     summary: Delete a stage
 *     description: Removes a stage from a project. Only Admins can delete any stage; Managers can delete only stages from projects they created.
 *     tags: [Stages]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the stage to delete.
 *     responses:
 *       200:
 *         description: Stage deleted successfully.
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
 *                   example: "Stage deleted successfully"
 *       400:
 *         description: Invalid or expired token.
 *       401:
 *         description: Unauthorized, token required.
 *       403:
 *         description: User is not verified or not authorized to delete the stage.
 *       404:
 *         description: Stage not found.
 *       500:
 *         description: Internal server error.
 */
router.delete("/:id", authMiddleware, deleteStage);

export default router;
