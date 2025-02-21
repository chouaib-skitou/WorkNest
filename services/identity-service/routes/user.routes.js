import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
} from "../controllers/user.controller.js";
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
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieves a paginated list of users with optional filtering. Only accessible by ROLE_ADMIN and ROLE_MANAGER.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: firstName
 *         schema:
 *           type: string
 *         description: Filter by first name (case-insensitive)
 *       - in: query
 *         name: lastName
 *         schema:
 *           type: string
 *         description: Filter by last name (case-insensitive)
 *       - in: query
 *         name: email
 *         schema:
 *           type: string
 *         description: Filter by email (case-insensitive)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN]
 *         description: Filter by user role
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: Successfully retrieved users list.
 *       403:
 *         description: Forbidden, only admins and managers can access.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.get("/", authMiddleware, getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieves a user by their ID. Only accessible by ROLE_ADMIN or the user himself.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: Successfully retrieved the user.
 *       403:
 *         description: Forbidden, access denied.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.get("/:id", authMiddleware, getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Creates a new user. Only accessible by ROLE_ADMIN. Users cannot set their role, verification status, or manually specify an ID.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully.
 *       403:
 *         description: Forbidden, only admins can create users.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.post("/", authMiddleware, createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user information
 *     description: Updates a user's details. Only accessible by ROLE_ADMIN or the user himself. Users cannot update their ID, role, verification status, or password.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       403:
 *         description: Forbidden, access denied.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.put("/:id", authMiddleware, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Partially update user information
 *     description: Allows partial update of user details. Only accessible by ROLE_ADMIN or the user himself. Users cannot update their ID, role, verification status, or password.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully.
 *       403:
 *         description: Forbidden, access denied.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.patch("/:id", authMiddleware, patchUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Deletes a user by ID. Only accessible by ROLE_ADMIN.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully.
 *       403:
 *         description: Forbidden, only admins can delete users.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized, missing or invalid token.
 */
router.delete("/:id", authMiddleware, deleteUser);

export default router;
