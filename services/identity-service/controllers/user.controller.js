import { prisma } from "../config/database.js";
import {
  createUserValidationRules,
  updateUserValidationRules,
  patchUserValidationRules,
  deleteUserValidationRules,
} from "../validators/user.validator.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { UserDTO, UserBatchDTO } from "../dtos/user.dto.js";
import { sendAccountCreationEmail } from "../services/email.service.js";
import crypto from "crypto";

// Middleware to check user role
const checkRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
};

// Get all users (Only ROLE_ADMIN, ROLE_MANAGER)
export const getUsers = [
  checkRole(["ROLE_ADMIN", "ROLE_MANAGER"]),
  async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      const where = {};

      if (req.query.firstName) {
        where.firstName = {
          contains: req.query.firstName,
          mode: "insensitive",
        };
      }
      if (req.query.lastName) {
        where.lastName = {
          contains: req.query.lastName,
          mode: "insensitive",
        };
      }
      if (req.query.email) {
        where.email = {
          contains: req.query.email,
          mode: "insensitive",
        };
      }
      if (req.query.role) {
        where.role = req.query.role;
      }
      if (req.query.isVerified !== undefined) {
        // Convert string to boolean
        where.isVerified = req.query.isVerified === "true";
      }

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.user.count({ where }),
      ]);

      // Transform user data with UserDTO
      const transformedUsers = users.map((user) => new UserDTO(user));

      res.json({
        data: transformedUsers,
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

// Get a specific user by ID (Only ROLE_ADMIN or the user himself)
export const getUserById = [
  async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.role !== "ROLE_ADMIN" && req.user.id !== id) {
        return res.status(403).json({ error: "Access denied" });
      }
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) return res.status(404).json({ error: "User not found" });

      res.json(new UserDTO(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// Create a new user (Only ROLE_ADMIN)
export const createUser = [
  checkRole(["ROLE_ADMIN"]),
  createUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      // Création de l'utilisateur avec isVerified forcé à true
      const newUser = await prisma.user.create({
        data: { ...req.body, isVerified: true },
      });

      // Suppression des anciens tokens de réinitialisation pour cet utilisateur
      await prisma.passwordResetToken.deleteMany({ where: { userId: newUser.id } });

      // Génération d'un token de réinitialisation
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Enregistrement du token dans la base de données avec une expiration d'une heure
      await prisma.passwordResetToken.create({
        data: {
          userId: newUser.id,
          token: resetToken,
          expiresAt: new Date(Date.now() + 3600000),
        },
      });

      // Envoi de l'email de réinitialisation de mot de passe via le service
      await sendAccountCreationEmail(newUser, resetToken);

      res.status(201).json(new UserDTO(newUser));
    } catch (error) {
      // Gestion spécifique de l'erreur de contrainte d'unicité sur email
      if (
        error.code === "P2002" &&
        error.meta &&
        error.meta.target &&
        error.meta.target.includes("email")
      ) {
        return res.status(400).json({ error: "A user with that email already exists" });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

// Update User (Only the user himself OR ROLE_ADMIN)
export const updateUser = [
  updateUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const isAdmin = req.user.role === "ROLE_ADMIN";

      if (!isAdmin && req.user.id !== id) {
        return res
          .status(403)
          .json({ error: "You can only update your own profile" });
      }

      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: req.body,
      });

      delete updatedUser.password;
      res.json(new UserDTO(updatedUser));
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

// Partially update user (PATCH)
export const patchUser = [
  patchUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.role !== "ROLE_ADMIN" && req.user.id !== id) {
        return res
          .status(403)
          .json({ error: "You can only update your own profile" });
      }

      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: req.body,
      });

      delete updatedUser.password;
      res.json(new UserDTO(updatedUser));
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

// Delete User (Only ROLE_ADMIN)
export const deleteUser = [
  deleteUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the user exists before role validation
      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.user.role !== "ROLE_ADMIN") {
        return res
          .status(403)
          .json({ error: "Only administrators can delete users" });
      }

      await prisma.user.delete({ where: { id } });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

// Batch lookup: Returns minimal user info for an array of user IDs.
export const getUsersByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "No user ids provided" });
    }

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
    res.json(result);
  } catch (error) {
    console.error("Error fetching users by ids:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
