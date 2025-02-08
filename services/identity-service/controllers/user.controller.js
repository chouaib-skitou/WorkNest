import { prisma } from "../config/database.js";
import { updateUserValidationRules, deleteUserValidationRules } from "../validators/user.validator.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { UserDTO } from "../dtos/user.dto.js";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    const transformedUsers = users.map(user => new UserDTO(user));
    res.json(transformedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
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

// Delete User with Validation
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