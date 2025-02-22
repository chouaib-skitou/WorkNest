import { prisma } from "../config/database.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createStageValidation,
  updateStageValidation,
  patchStageValidation,
  deleteStageValidation,
  getStageByIdValidation,
} from "../validators/stage.validator.js";
import { StageDTO } from "../dtos/stage.dto.js";

/**
 * @desc Get all stages (with pagination)
 * @route GET /api/stages
 * @access Public
 */
export const getStages = async (req, res) => {
  try {
    const parsedPage = parseInt(req.query.page);
    const parsedLimit = parseInt(req.query.limit);
    const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
    const skip = (page - 1) * limit;

    const [stages, totalCount] = await Promise.all([
      prisma.stage.findMany({
        skip,
        take: limit,
        include: { tasks: true }, // Include related tasks
      }),
      prisma.stage.count(),
    ]);

    const transformedStages = stages.map((stage) => new StageDTO(stage));

    res.json({
      data: transformedStages,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Error fetching stages", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get a stage by ID
 * @route GET /api/stages/:id
 * @access Public
 */
export const getStageById = [
  getStageByIdValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const stage = await prisma.stage.findUnique({
        where: { id },
        include: { tasks: true }, // Ensures tasks are retrieved
      });

      if (!stage) {
        return res.status(404).json({ error: "Stage not found" });
      }

      res.status(200).json(new StageDTO(stage)); // Ensures tasks are transformed into DTO
    } catch (error) {
      console.error("Error fetching stage by ID:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

/**
 * @desc Create a new stage
 * @route POST /api/stages
 * @access Public
 */
export const createStage = [
  createStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      let { name, position, color, projectId } = req.body;
      const normalizedName = name.toLowerCase();

      const stage = await prisma.stage.create({
        data: {
          name: normalizedName,
          position,
          color,
          projectId,
        },
        include: { tasks: true }, // Ensure tasks are included if needed
      });

      res.status(201).json({
        message: "Stage created successfully",
        stage: new StageDTO(stage),
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "A stage with this name already exists for this project",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

/**
 * @desc Update a stage (PUT)
 * @route PUT /api/stages/:id
 * @access Public
 */
export const updateStage = [
  updateStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      let { name, position, color } = req.body;

      const updateData = { position, color };
      if (name) {
        updateData.name = name.toLowerCase();
      }

      const stage = await prisma.stage.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        message: "Stage updated successfully",
        stage: new StageDTO(stage),
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "A stage with this name already exists for this project",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

/**
 * @desc Partially update a stage (PATCH)
 * @route PATCH /api/stages/:id
 * @access Public
 */
export const patchStage = [
  patchStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {};

      Object.entries(req.body).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key] = value;
        }
      });

      if (Object.keys(updateData).length === 0) {
        return res
          .status(400)
          .json({ error: "No valid fields provided for update" });
      }

      if (updateData.name) {
        updateData.name = updateData.name.toLowerCase();
      }

      const stage = await prisma.stage.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({
        message: "Stage updated successfully",
        stage: new StageDTO(stage),
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          error: "A stage with this name already exists for this project",
        });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  },
];

/**
 * @desc Delete a stage
 * @route DELETE /api/stages/:id
 * @access Public
 */
export const deleteStage = [
  deleteStageValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      await prisma.stage.delete({ where: { id } });

      res.status(200).json({ message: "Stage deleted successfully" });
    } catch (error) {
      console.error("Error deleting stage:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];
