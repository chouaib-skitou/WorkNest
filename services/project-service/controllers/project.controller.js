import { prisma } from "../config/database.js";

/**
 * @desc Get all projects
 * @route GET /projects
 * @access Public (No restrictions for now)
 */
export const getProjects = async (req, res) => {
  try {
    const projects = await prisma.project.findMany();
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * @desc Create a new project
 * @route POST /projects
 * @access Public (No restrictions for now)
 */
export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Extract user ID from authentication middleware
    // const createdBy = req.user?.id;
    const createdBy = 'ghjksxjkzdhkezgdhezkhjdgz'; // TODO: This should come from auth middleware

    if (!name) {
      return res.status(400).json({ error: "Project name is required" });
    }

    if (!createdBy) {
      return res.status(401).json({ error: "Unauthorized: User ID is required" });
    }

    const project = await prisma.project.create({
      data: { name, description, createdBy }, // Store user ID
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

