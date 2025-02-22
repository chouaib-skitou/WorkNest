import { body, param } from "express-validator";

/**
 * Validate UUID format for task ID
 */
const isUUID = param("id").isUUID().withMessage("Invalid task ID format");

/**
 * Validation for creating a task
 */
export const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("priority")
    .notEmpty()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Priority must be LOW, MEDIUM, or HIGH"),
  body("stageId").notEmpty().withMessage("Stage ID is required"),
  body("projectId").notEmpty().withMessage("Project ID is required"),
  body("assignedTo")
    .optional()
    .isString()
    .withMessage("AssignedTo must be a user ID"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of URLs"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
];

/**
 * Validation for updating a task (PUT)
 */
export const updateTaskValidation = [
  isUUID,
  body("title").optional().notEmpty().withMessage("Title cannot be empty"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Priority must be LOW, MEDIUM, or HIGH"),
  body("stageId")
    .optional()
    .isUUID()
    .withMessage("Stage ID must be a valid UUID"),
  body("assignedTo")
    .optional()
    .isString()
    .withMessage("AssignedTo must be a user ID"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of URLs"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
];

/**
 * Validation for patching a task (PATCH)
 */
export const patchTaskValidation = [
  isUUID,
  body("title").optional().notEmpty().withMessage("Title cannot be empty"),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
  body("priority")
    .optional()
    .isIn(["LOW", "MEDIUM", "HIGH"])
    .withMessage("Priority must be LOW, MEDIUM, or HIGH"),
  body("stageId")
    .optional()
    .isUUID()
    .withMessage("Stage ID must be a valid UUID"),
  body("assignedTo")
    .optional()
    .isString()
    .withMessage("AssignedTo must be a user ID"),
  body("images")
    .optional()
    .isArray()
    .withMessage("Images must be an array of URLs"),
  body("images.*")
    .optional()
    .isURL()
    .withMessage("Each image must be a valid URL"),
];

/**
 * Validation for deleting a task
 */
export const deleteTaskValidation = [isUUID];

/**
 * Validation for getting a task by ID
 */
export const getTaskByIdValidation = [isUUID];
