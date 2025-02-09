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
      const users = await prisma.user.findMany();
      const transformedUsers = users.map(user => new UserDTO(user));
      res.json(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
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

      const updatedUser = await prisma.user.update({
        where: { id },
        data: req.body,
      });

      delete updatedUser.password;
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
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

      // Check if user exists before checking role
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
