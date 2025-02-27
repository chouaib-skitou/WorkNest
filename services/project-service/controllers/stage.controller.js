// stage.controller.js
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createStageValidation,
  updateStageValidation,
  patchStageValidation,
  deleteStageValidation,
  getStageByIdValidation,
} from "../validators/stage.validator.js";
import {
  getStagesService,
  getStageByIdService,
  createStageService,
  updateStageService,
  patchStageService,
  deleteStageService,
} from "../services/stage.service.js";

/**
 * Get all stages with pagination and optional filtering.
 * @route GET /api/stages
 * @access Protected
 */
export const getStages = async (req, res) => {
  try {
    const stages = await getStagesService(req.user, req.query);
    res.status(200).json(stages);
  } catch (error) {
    console.error("Error fetching stages:", error);
    const statusCode = error.status || 500;
    res.status(statusCode).json({ error: error.message });
  }
};

/**
 * Get a stage by ID.
 * @route GET /api/stages/:id
 * @access Protected
 */
export const getStageById = [
  getStageByIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await getStageByIdService(req.user, id);
      if (!stage) return res.status(404).json({ error: "Stage not found" });
      res.status(200).json(stage);
    } catch (error) {
      console.error("Error fetching stage by ID:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Create a new stage.
 * @route POST /api/stages
 * @access Protected (Admins and Managers)
 */
export const createStage = [
  createStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const stage = await createStageService(req.user, req.body);
      res.status(201).json({ message: "Stage created successfully", stage });
    } catch (error) {
      console.error("❌ Error creating stage:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Fully update a stage.
 * @route PUT /api/stages/:id
 * @access Protected (Admins and Managers with proper authorization)
 */
export const updateStage = [
  updateStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await updateStageService(req.user, id, req.body);
      res.status(200).json({ message: "Stage updated successfully", stage });
    } catch (error) {
      console.error("❌ Error updating stage:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Partially update a stage.
 * @route PATCH /api/stages/:id
 * @access Protected (Admins and Managers with proper authorization)
 */
export const patchStage = [
  patchStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await patchStageService(req.user, id, req.body);
      res.status(200).json({ message: "Stage updated successfully", stage });
    } catch (error) {
      console.error("❌ Error patching stage:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];

/**
 * Delete a stage.
 * @route DELETE /api/stages/:id
 * @access Protected (Admins and Managers who created the associated project)
 */
export const deleteStage = [
  deleteStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const response = await deleteStageService(req.user, id);
      res.status(200).json(response);
    } catch (error) {
      console.error("❌ Error deleting stage:", error);
      const statusCode = error.status || 500;
      res.status(statusCode).json({ error: error.message });
    }
  },
];
