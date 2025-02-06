import express from "express";
import { getUsers, updateUser, deleteUser } from "../controllers/user.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a list of all users.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved users list.
 *       403:
 *         description: Unauthorized, missing or invalid token.
 */
router.get("/", authMiddleware, getUsers);

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     summary: Update user information
 *     description: Updates a user's details.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN]
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       403:
 *         description: Unauthorized, missing or invalid token.
 *       404:
 *         description: User not found.
 */
router.put("/:userId", authMiddleware, updateUser);

/**
 * @swagger
 * /users/{userId}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by ID.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       403:
 *         description: Unauthorized, missing or invalid token.
 *       404:
 *         description: User not found.
 */
router.delete("/:userId", authMiddleware, deleteUser);

export default router;
