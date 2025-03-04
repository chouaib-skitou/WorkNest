import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  patchUser,
  deleteUser,
  getUsersByIds,
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
 *     summary: Get all users (paginated + filters)
 *     description: |
 *       Retrieves a **paginated** list of users with **optional filtering**.  
 *       **Accessible** by ROLE_ADMIN and ROLE_MANAGER only.
 *       
 *       **Filters** (query parameters):
 *       - `page` (number): Page number for pagination.
 *       - `limit` (number): Number of users per page.
 *       - `firstName` (string): Filter by first name (case-insensitive).
 *       - `lastName` (string): Filter by last name (case-insensitive).
 *       - `email` (string): Filter by email (case-insensitive).
 *       - `role` (string): Filter by user role (ROLE_EMPLOYEE, ROLE_MANAGER, ROLE_ADMIN).
 *       - `isVerified` (boolean): Filter by verification status (true/false).
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
 *         description: Filter by verification status (true or false)
 *     responses:
 *       200:
 *         description: Successfully retrieved users list
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (only admins and managers can access)
 *       500:
 *         description: Internal server error
 */
router.get("/", authMiddleware, getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: |
 *       Retrieves a user by their ID.  
 *       **Accessible** by ROLE_ADMIN or the user themself.
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
 *         description: Successfully retrieved the user
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (access denied)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:id", authMiddleware, getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: |
 *       Creates a new user.  
 *       **Accessible** by ROLE_ADMIN.  
 *       Users **cannot** set their role, verification status, or manually specify an ID.
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
 *         description: User created successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (only admins can create users)
 *       409:
 *         description: Conflict (email already exists)
 *       500:
 *         description: Internal server error
 */
router.post("/", authMiddleware, createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (full)
 *     description: |
 *       Fully updates a user's details.  
 *       **Accessible** by ROLE_ADMIN only.  
 *       Users **cannot** update their ID, role, verification status, or password.
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
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (only admins can update users)
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict (email already exists)
 *       500:
 *         description: Internal server error
 */
router.put("/:id", authMiddleware, updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Partially update user
 *     description: |
 *       Partially updates a user's details.  
 *       **Accessible** by ROLE_ADMIN or the user themself.  
 *       - Admin can patch any field  
 *       - Non-admin can only patch `firstName` and `lastName`  
 *       Users **cannot** update their ID, role, verification status, or password.
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
 *         description: User patched successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (access denied)
 *       404:
 *         description: User not found
 *       409:
 *         description: Conflict (email already exists)
 *       500:
 *         description: Internal server error
 */
router.patch("/:id", authMiddleware, patchUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: |
 *       Deletes a user by ID.  
 *       **Accessible** by ROLE_ADMIN only.
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
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       403:
 *         description: Forbidden (only admins can delete users)
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", authMiddleware, deleteUser);

/**
 * @swagger
 * /api/users/batch:
 *   post:
 *     summary: Batch lookup users
 *     description: |
 *       Retrieves **minimal** user information (id, fullName, role) for a given array of user IDs.  
 *       **Accessible** by any authenticated user (by default).  
 *       You may add further role checks if needed.
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       description: JSON object with an `ids` array containing user IDs to look up.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ids
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user-id-1", "user-id-2"]
 *     responses:
 *       200:
 *         description: Successfully retrieved batch user data (id, fullName, role)
 *       400:
 *         description: Bad request (missing or empty `ids` array)
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Internal server error
 */
router.post("/batch", authMiddleware, getUsersByIds);

export default router;
