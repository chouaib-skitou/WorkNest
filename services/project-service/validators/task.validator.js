import { body } from "express-validator";

export const createTaskValidation = [
  body("title").notEmpty().withMessage("Task title is required"),
  body("description").optional().isString().withMessage("Description must be a string"),
  body("priority").notEmpty().isIn(["LOW", "MEDIUM", "HIGH"]).withMessage("Priority must be LOW, MEDIUM, or HIGH"),
  body("stageId").notEmpty().withMessage("Stage ID is required"),
  body("assignedTo").optional().isString().withMessage("AssignedTo must be a user ID"),
  body("images").optional().isArray().withMessage("Images must be an array of URLs"),
  body("images.*").optional().isURL().withMessage("Each image must be a valid URL"),
];
