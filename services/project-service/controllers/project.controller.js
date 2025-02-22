import { prisma } from "../config/database.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { 
  createProjectValidation, 
  updateProjectValidation, 
  patchProjectValidation, 
  deleteProjectValidation 
} from "../validators/project.validator.js";
import { ProjectDTO } from "../dtos/project.dto.js";

/**
 * @desc Get all projects
 * @route GET /api/projects
 * @access Public (No restrictions for now)
 */
export const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const where = {};

    // Filters
    if (req.query.name) {
      where.name = {
        contains: req.query.name,
        mode: "insensitive", // Case-insensitive search
      };
    }

    if (req.query.description) {
      where.description = {
        contains: req.query.description,
        mode: "insensitive",
      };
    }

    if (req.query.createdAt) {
      const createdAtDate = new Date(req.query.createdAt);
      if (!isNaN(createdAtDate)) {
        where.createdAt = {
          gte: new Date(createdAtDate.setHours(0, 0, 0, 0)), // Start of the day
          lte: new Date(createdAtDate.setHours(23, 59, 59, 999)), // End of the day
        };
      }
    }

    // Sorting
    const sortField = req.query.sortField || "createdAt"; // Default sorting field
    const sortOrder = req.query.sortOrder === "asc" ? "asc" : "desc"; // Default to descending

    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortOrder },
      }),
      prisma.project.count({ where }),
    ]);

    // Transform data using DTO
    const transformedProjects = projects.map((project) => new ProjectDTO(project));

    res.json({
      data: transformedProjects,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};


/**
 * @desc Get a single project by ID
 * @route GET /api/projects/:id
 * @access Public (No restrictions for now)
 */
export const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    res.status(200).json(new ProjectDTO(project));
  } catch (error) {
    // console.error("Error fetching project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Create a new project
 * @route POST /api/projects
 * @access Public (No restrictions for now)
 */
export const createProject = [
  createProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      let { name, description, image, documents, createdBy, managerId, employeeIds } = req.body;
      const normalizedName = name.toLowerCase(); // Convert to lowercase before storing

      const project = await prisma.project.create({
        data: { name: normalizedName, description, image, documents, createdBy, managerId, employeeIds },
      });

      res.status(201).json({ message: "Project created successfully", project: new ProjectDTO(project) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A project with this name already exists for this user" });
      }
      // console.error("Error creating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Update a project (Full Update - PUT)
 * @route PUT /api/projects/:id
 * @access Public (No restrictions for now)
 */
export const updateProject = [
  updateProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      let { name, description, image, documents, managerId, employeeIds } = req.body;

      const updateData = { description, image, documents, managerId, employeeIds };

      if (name) {
        updateData.name = name.toLowerCase(); // Convert to lowercase before updating
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({ message: "Project updated successfully", project: new ProjectDTO(project) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A project with this name already exists for this user" });
      }
      // console.error("Error updating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Partially update a project (PATCH)
 * @route PATCH /api/projects/:id
 * @access Public (No restrictions for now)
 */
export const patchProject = [
  patchProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = {};

      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== undefined) updateData[key] = req.body[key];
      });

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update" });
      }

      if (updateData.name) {
        updateData.name = updateData.name.toLowerCase(); // Convert to lowercase before updating
      }

      const project = await prisma.project.update({
        where: { id },
        data: updateData,
      });

      res.status(200).json({ message: "Project updated successfully", project: new ProjectDTO(project) });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "A project with this name already exists for this user" });
      }
      // console.error("Error updating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];

/**
 * @desc Delete a project
 * @route DELETE /api/projects/:id
 * @access Public (No restrictions for now)
 */
export const deleteProject = [
  deleteProjectValidation,
  validateRequest,
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.project.delete({ where: { id } });

      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      // console.error("Error deleting project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
];
