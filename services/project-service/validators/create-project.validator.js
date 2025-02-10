import { body } from "express-validator";

// Validation for project creattion
export const projectCreationValidationRules = [
  body("projectName").notEmpty().withMessage("Project name is required"),
  body("projectName").isLength({ min: 3 }).withMessage("Project name must be at least 3 characters long"),
  body("managerEmail").isEmail().withMessage("Invalid email format"),
  ];

