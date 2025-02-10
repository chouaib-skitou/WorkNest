import { body } from "express-validator";

// Validation for project creattion
export const projectCreationValidationRules = [
  body("projectName").notEmpty().withMessage("First name is required"),
  body("managerEmail").isEmail().withMessage("Invalid email format"),

  // Project name requirements
  body("password")
    .isLength({ min: 3 }).withMessage("Project name must be at least 3 characters long")

  ];

