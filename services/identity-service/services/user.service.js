/**
 * User Service Module
 * Handles the core business logic and database operations for user-related features.
 */

import { prisma } from "../config/database.js";
import { UserDTO, UserBatchDTO } from "../dtos/user.dto.js";
import crypto from "crypto";
import { sendAccountCreationEmail } from "./email.service.js";

/**
 * Retrieve all users with optional filters and pagination.
 * Only accessible by managers (ROLE_MANAGER) or admins (ROLE_ADMIN).
 * @param {Object} requestingUser - The user making the request (from auth middleware).
 * @param {Object} query - Query params for pagination and filtering.
 * @returns {Promise<Object>} Paginated user data (or an error).
 */
export const getAllUsersService = async (requestingUser, query) => {
  if (!["ROLE_MANAGER", "ROLE_ADMIN"].includes(requestingUser.role)) {
    return Promise.reject({
      status: 403,
      message: "Access denied: Only admins or managers can list all users",
    });
  }

  let page = parseInt(query.page) || 1;
  let limit = parseInt(query.limit) || 10;
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;
  const skip = (page - 1) * limit;

  const where = {};

  if (query.firstName) {
    where.firstName = { contains: query.firstName, mode: "insensitive" };
  }
  if (query.lastName) {
    where.lastName = { contains: query.lastName, mode: "insensitive" };
  }
  if (query.email) {
    where.email = { contains: query.email, mode: "insensitive" };
  }
  if (query.role) {
    where.role = query.role;
  }
  if (query.isVerified !== undefined) {
    where.isVerified = query.isVerified === "true";
  }

  try {
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    const transformedUsers = users.map((u) => new UserDTO(u));

    return {
      data: transformedUsers,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("❌ Error fetching users in service:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Retrieve a specific user by ID.
 * Accessible only by admins (ROLE_ADMIN) or the user themself.
 * @param {Object} requestingUser - The user making the request.
 * @param {string} id - The ID of the user to retrieve.
 * @returns {Promise<UserDTO>} The user data (or an error).
 */
export const getUserByIdService = async (requestingUser, id) => {
  try {
    if (requestingUser.role !== "ROLE_ADMIN" && requestingUser.id !== id) {
      return Promise.reject({
        status: 403,
        message: "Access denied: You can only view your own profile",
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return Promise.reject({ status: 404, message: "User not found" });
    }

    return new UserDTO(user);
  } catch (error) {
    console.error("❌ Error fetching user in service:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Create a new user (isVerified forced to true, only accessible by admins).
 * Also sends an account creation email with a reset token.
 * @param {Object} requestingUser - The user making the request.
 * @param {Object} data - The new user's data.
 * @returns {Promise<UserDTO>} The created user's data (or an error).
 */
export const createUserService = async (requestingUser, data) => {
  if (requestingUser.role !== "ROLE_ADMIN") {
    return Promise.reject({
      status: 403,
      message: "Access denied: Only admins can create new users",
    });
  }

  try {
    // Create the user with isVerified forced to true
    const newUser = await prisma.user.create({
      data: { ...data, isVerified: true },
    });

    // Remove old reset tokens for this user (if any)
    await prisma.passwordResetToken.deleteMany({ where: { userId: newUser.id } });

    // Generate a fresh reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        userId: newUser.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour expiry
      },
    });

    // Send account creation email
    await sendAccountCreationEmail(newUser, resetToken);

    return new UserDTO(newUser);
  } catch (error) {
    console.error("❌ Error creating user in service:", error);
    // Handle unique constraint on email
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return Promise.reject({
        status: 409,
        message: "A user with that email already exists",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Fully update a user (PUT).
 * Only accessible by admins (ROLE_ADMIN).
 * @param {Object} requestingUser - The user making the request.
 * @param {string} id - The ID of the user to update.
 * @param {Object} data - The new field values for the user.
 * @returns {Promise<UserDTO>} The updated user's data (or an error).
 */
export const updateUserService = async (requestingUser, id, data) => {
  if (requestingUser.role !== "ROLE_ADMIN") {
    return Promise.reject({
      status: 403,
      message: "Access denied: Only admins can update users",
    });
  }

  try {
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return Promise.reject({ status: 404, message: "User not found" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return new UserDTO(updatedUser);
  } catch (error) {
    console.error("❌ Error updating user in service:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return Promise.reject({
        status: 409,
        message: "A user with that email already exists",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Partially update a user (PATCH).
 * - Admin can patch any field
 * - Non-admin users can patch only their own firstName and lastName
 * @param {Object} requestingUser - The user making the request.
 * @param {string} id - The ID of the user to patch.
 * @param {Object} data - The partial fields to update.
 * @returns {Promise<UserDTO>} The updated user's data (or an error).
 */
export const patchUserService = async (requestingUser, id, data) => {
  try {
    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return Promise.reject({ status: 404, message: "User not found" });
    }

    if (requestingUser.role !== "ROLE_ADMIN" && requestingUser.id !== id) {
      return Promise.reject({
        status: 403,
        message: "Access denied: You can only patch your own profile",
      });
    }

    // If not admin, only allow patching firstName, lastName
    if (requestingUser.role !== "ROLE_ADMIN") {
      const allowedFields = ["firstName", "lastName"];
      const keys = Object.keys(data);
      const invalidFields = keys.filter((k) => !allowedFields.includes(k));
      if (invalidFields.length > 0) {
        return Promise.reject({
          status: 403,
          message: "Access denied: Only firstName and lastName can be patched",
        });
      }
    }

    // Filter out undefined fields
    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return new UserDTO(updatedUser);
  } catch (error) {
    console.error("❌ Error patching user in service:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("email")) {
      return Promise.reject({
        status: 409,
        message: "A user with that email already exists",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Delete a user.
 * Only accessible by admins (ROLE_ADMIN).
 * @param {Object} requestingUser - The user making the request.
 * @param {string} id - The ID of the user to delete.
 * @returns {Promise<Object>} A success message (or an error).
 */
export const deleteUserService = async (requestingUser, id) => {
  if (requestingUser.role !== "ROLE_ADMIN") {
    return Promise.reject({
      status: 403,
      message: "Access denied: Only admins can delete users",
    });
  }

  try {
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      return Promise.reject({ status: 404, message: "User not found" });
    }

    await prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  } catch (error) {
    console.error("❌ Error deleting user in service:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Batch lookup: Returns minimal user info for an array of user IDs.
 * @param {Object} requestingUser - The user making the request.
 * @param {Object} body - The request body containing `ids` array.
 * @returns {Promise<Array<UserBatchDTO>>} Minimal user info.
 */
export const getUsersByIdsService = async (requestingUser, body) => {
  // You can add role checks if needed; for example, only an admin could do a batch lookup.
  // For now, we’ll leave it open to any authenticated user. Adjust as needed.
  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return Promise.reject({ status: 400, message: "No user ids provided" });
  }

  try {
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    const result = users.map((user) => new UserBatchDTO(user));
    return result;
  } catch (error) {
    console.error("❌ Error fetching users by IDs in service:", error);
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};
