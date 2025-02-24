import { validateRequest } from "../middleware/validate.middleware.js";
import {
  createProjectValidation,
  updateProjectValidation,
  patchProjectValidation,
  deleteProjectValidation,
} from "../validators/project.validator.js";
import {
  getProjectsService,
  getProjectByIdService,
  createProjectService,
  updateProjectService,
  patchProjectService,
  deleteProjectService,
} from "../services/project.service.js";

/**
 * @desc Get all projects
 * @route GET /api/projects
 * @access Protected
 */
export const getProjects = async (req, res) => {
  try {
    res.json(await getProjectsService(req.user, req.query));
  } catch (error) {
    // console.error("Error fetching projects", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Get a single project by ID with stages
 * @route GET /api/projects/:id
 * @access Public
 */
export const getProjectById = async (req, res) => {
  try {
    const project = await getProjectByIdService(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    // console.error("Error fetching project by ID:", error);
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
      res.status(201).json(await createProjectService(req.body));
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Project name already exists" });
      }
      // console.error("Error creating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
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
      res.status(200).json(await updateProjectService(req.params.id, req.body));
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Project name already exists" });
      }
      // console.error("Error updating project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
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
      res.status(200).json(await patchProjectService(req.params.id, req.body));
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Project name already exists" });
      }
      // console.error("Error patching project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
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
      await deleteProjectService(req.params.id);
      res.status(200).json({ message: "Project deleted successfully" });
    } catch (error) {
      // console.error("Error deleting project:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
];
