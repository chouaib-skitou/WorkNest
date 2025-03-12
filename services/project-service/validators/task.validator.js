import { body, param } from "express-validator";

/**
 * Validate UUID format for task ID
 */
const isUUID = param("id").isUUID().withMessage("Invalid task ID format");

/**
 * Shared validation for image URLs
 */
const validateImageUrls = body("images.*")
  .optional()
  .custom((value) => {
    try {
      new URL(value);
      return true;
    } catch {
      throw new Error("Each document must be a valid URL");
    }
  });

/**
 * Validation for creating a task
 */
export const createTaskValidation = [
  body("id").not().exists().withMessage("Cannot set Task ID manually"),
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
  validateImageUrls,
];

/**
 * Validation for updating a task (PUT)
 */
export const updateTaskValidation = [
  param("id").isUUID().withMessage("Invalid Task ID format"),
  body("id").not().exists().withMessage("Task ID cannot be changed"),
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
  validateImageUrls,
];

/**
 * Validation for patching a task (PATCH)
 */
export const patchTaskValidation = [
  param("id").isUUID().withMessage("Invalid Task ID format"),
  body("id").not().exists().withMessage("Task ID cannot be changed"),
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
  validateImageUrls,
];

/**
 * Validation for deleting a task
 */
export const deleteTaskValidation = [isUUID];

/**
 * Validation for getting a task by ID
 */
export const getTaskByIdValidation = [isUUID];
