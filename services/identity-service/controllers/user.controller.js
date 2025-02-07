import { prisma } from "../config/database.js";
import { updateUserValidationRules, deleteUserValidationRules } from "../dtos/user.dto.js";
import { validateRequest } from "../middleware/validate.middleware.js";

export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

// 📝 Update User with Validation
export const updateUser = [
  updateUserValidationRules, // Apply validation rules
  validateRequest, // Middleware to check validation results
  async (req, res) => {
    try {
      const { id } = req.params;
      const updatedUser = await prisma.user.update({
        where: { id },
        data: req.body,
      });

      // Exclude password from response
      delete updatedUser.password;

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

// 📝 Delete User with Validation
export const deleteUser = [
  deleteUserValidationRules, // Apply validation rules
  validateRequest, // Middleware to check validation results
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.user.delete({ where: { id } });
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];