/**
 * User Controller Module
 * Handles incoming requests related to users and delegates operations to the user service.
 */

import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  patchUserService,
  deleteUserService,
  getUsersByIdsService,
} from "../services/user.service.js";

import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createUserValidationRules,
  updateUserValidationRules,
  patchUserValidationRules,
  deleteUserValidationRules,
} from "../validators/user.validator.js";

/**
 * Get all users with optional filters and pagination.
 * Accessible only by managers (ROLE_MANAGER) and admins (ROLE_ADMIN).
 * @route GET /api/users
 * @access Protected
 */
export const getAllUsers = async (req, res) => {
  try {
    const result = await getAllUsersService(req.user, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get a user by ID.
 * Accessible only by admins (ROLE_ADMIN) or the user themself.
 * @route GET /api/users/:id
 * @access Protected
 */
export const getUserById = async (req, res) => {
  try {
    const userData = await getUserByIdService(req.user, req.params.id);
    res.status(200).json(userData);
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Create a new user.
 * Accessible only by admins (ROLE_ADMIN).
 * @route POST /api/users
 * @access Protected
 */
export const createUser = [
  createUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const newUser = await createUserService(req.user, req.body);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("❌ Error creating user:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Fully update a user (PUT).
 * Accessible only by admins (ROLE_ADMIN).
 * @route PUT /api/users/:id
 * @access Protected
 */
export const updateUser = [
  updateUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const updated = await updateUserService(req.user, req.params.id, req.body);
      res.status(200).json(updated);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Partially update a user (PATCH).
 * - Admin can patch any field
 * - Non-admin users can patch only their own `firstName` and `lastName`
 * @route PATCH /api/users/:id
 * @access Protected
 */
export const patchUser = [
  patchUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const patched = await patchUserService(req.user, req.params.id, req.body);
      res.status(200).json(patched);
    } catch (error) {
      console.error("❌ Error patching user:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Delete a user.
 * Accessible only by admins (ROLE_ADMIN).
 * @route DELETE /api/users/:id
 * @access Protected
 */
export const deleteUser = [
  deleteUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const resp = await deleteUserService(req.user, req.params.id);
      res.status(200).json(resp);
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Batch lookup: Returns minimal user info for an array of user IDs.
 * @route POST /api/users/batch
 * @access Protected (role checks optional or as needed)
 */
export const getUsersByIds = async (req, res) => {
  try {
    const result = await getUsersByIdsService(req.user, req.body);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error fetching users by ids:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};
