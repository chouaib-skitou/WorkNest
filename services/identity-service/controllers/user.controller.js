import { prisma } from "../config/database.js";
import { updateUserValidationRules, deleteUserValidationRules } from "../validators/user.validator.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { UserDTO } from "../dtos/user.dto.js";

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
      // 1) Parse pagination
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      // 2) Build dynamic WHERE object
      const where = {};

      // If client provided partial name filter, match "start with"
      if (req.query.firstName) {
        where.firstName = {
          contains: req.query.firstName,
          mode: "insensitive", // case-insensitive
        };
      }
      // For lastName & email, do "contains" => like '%...%'
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

      // For role and isVerified, we do exact match
      if (req.query.role) {
        where.role = req.query.role; // e.g. "ROLE_EMPLOYEE", "ROLE_ADMIN", etc.
      }
      if (req.query.isVerified !== undefined) {
        // isVerified will be "true"/"false" as a string
        where.isVerified = req.query.isVerified === "true";
      }

      // 3) Query the DB with filters & pagination
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" }, 
        }),
        prisma.user.count({ where }),
      ]);

      // 4) Transform user data with UserDTO
      const transformedUsers = users.map((user) => new UserDTO(user));

      // 5) Return pagination info + data
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
  validateRequest,
  async (req, res) => {
    try {
      const newUser = await prisma.user.create({ data: req.body });
      res.status(201).json(new UserDTO(newUser));
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
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
        return res.status(403).json({ error: "You can only update your own profile" });
      }

      // Check if the user exists
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
  }
];


// Partially update user (PATCH)
export const patchUser = [
  updateUserValidationRules,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      if (req.user.role !== "ROLE_ADMIN" && req.user.id !== id) {
        return res.status(403).json({ error: "You can only update your own profile" });
      }

      // Check if user exists
      const userExists = await prisma.user.findUnique({ where: { id } });
      if (!userExists) {
        return res.status(404).json({ error: "User not found" });
      }

      try {
        const updatedUser = await prisma.user.update({
          where: { id },
          data: req.body,
        });

        delete updatedUser.password;
        res.json(new UserDTO(updatedUser));
      } catch (error) {
        console.error("Database error updating user:", error);
        return res.status(500).json({ error: "Internal server error" });
      }

    } catch (error) {
      console.error("Unexpected error in patchUser:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];




// Delete User (Only ROLE_ADMIN, but check if user exists first)
export const deleteUser = [
  deleteUserValidationRules,
  validateRequest,
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Check if the user exists **before checking roles**
      const userToDelete = await prisma.user.findUnique({ where: { id } });
      if (!userToDelete) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if requester has ROLE_ADMIN
      if (req.user.role !== "ROLE_ADMIN") {
        return res.status(403).json({ error: "Only administrators can delete users" });
      }

      // Proceed with deletion
      await prisma.user.delete({ where: { id } });
      res.json({ message: "User deleted successfully" });

    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

