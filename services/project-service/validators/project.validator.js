import { body, param } from "express-validator";

// Validator for creating a project (Required fields must be present)
export const createProjectValidation = [
  body("name").notEmpty().withMessage("Project name is required").isString().withMessage("Project name must be a string"),
  body("description").notEmpty().withMessage("Project description is required").isString().withMessage("Project description must be a string"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
  body("documents").optional().isArray().withMessage("Documents must be an array of URLs"),
  body("documents.*").optional().isURL().withMessage("Each document must be a valid URL"),
  body("createdBy").notEmpty().withMessage("CreatedBy (User ID) is required").isString().withMessage("CreatedBy must be a string"),
  body("managerId").optional().isString().withMessage("Manager ID must be a string"),
  body("employeeIds").optional().isArray().withMessage("Employee IDs must be an array of user IDs"),
  body("employeeIds.*").optional().isString().withMessage("Each employee ID must be a string"),
];

// Validator for updating a project using PUT (All fields must be provided)
export const updateProjectValidation = [
  param("id").isUUID().withMessage("Invalid project ID format"),
  body("name").notEmpty().withMessage("Project name is required").isString().withMessage("Project name must be a string"),
  body("description").notEmpty().withMessage("Project description is required").isString().withMessage("Project description must be a string"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
  body("documents").optional().isArray().withMessage("Documents must be an array of URLs"),
  body("documents.*").optional().isURL().withMessage("Each document must be a valid URL"),
  body("managerId").optional().isString().withMessage("Manager ID must be a string"),
  body("employeeIds").optional().isArray().withMessage("Employee IDs must be an array of user IDs"),
  body("employeeIds.*").optional().isString().withMessage("Each employee ID must be a string"),
];

// Validator for partially updating a project using PATCH (Only provided fields will be updated)
export const patchProjectValidation = [
  param("id").isUUID().withMessage("Invalid project ID format"),
  body("name").optional().notEmpty().withMessage("Project name cannot be empty").isString().withMessage("Project name must be a string"),
  body("description").optional().notEmpty().withMessage("Project description cannot be empty").isString().withMessage("Project description must be a string"),
  body("image").optional().isURL().withMessage("Image must be a valid URL"),
  body("documents").optional().isArray().withMessage("Documents must be an array of URLs"),
  body("documents.*").optional().isURL().withMessage("Each document must be a valid URL"),
  body("managerId").optional().isString().withMessage("Manager ID must be a string"),
  body("employeeIds").optional().isArray().withMessage("Employee IDs must be an array of user IDs"),
  body("employeeIds.*").optional().isString().withMessage("Each employee ID must be a string"),
];

// Validator for deleting a project
export const deleteProjectValidation = [param("id").isUUID().withMessage("Invalid project ID format")];
