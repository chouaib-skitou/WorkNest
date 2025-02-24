import { prisma } from "../config/database.js";
import { ProjectDTO } from "../dtos/project.dto.js";

/**
 * Get filter conditions based on user role
 */
const getRoleBasedFilter = (user) => {
  if (user.role === "ROLE_EMPLOYEE") {
    return { employeeIds: { has: user.id } };
  } else if (user.role === "ROLE_MANAGER") {
    return {
      OR: [{ managerId: user.id }, { employeeIds: { has: user.id } }],
    };
  }
  return {}; // ROLE_ADMIN gets all projects (no filter)
};

/**
 * Get dynamic filters for project search
 */
const getDynamicFilters = (query) => {
  const filters = {};

  if (query.name) {
    filters.name = { contains: query.name, mode: "insensitive" };
  }

  if (query.description) {
    filters.description = { contains: query.description, mode: "insensitive" };
  }

  if (query.createdAt) {
    const createdAtDate = new Date(query.createdAt);
    if (!isNaN(createdAtDate)) {
      filters.createdAt = {
        gte: new Date(createdAtDate.setHours(0, 0, 0, 0)),
        lte: new Date(createdAtDate.setHours(23, 59, 59, 999)),
      };
    }
  }

  return filters;
};

/**
 * Get sorting options for Prisma query
 */
const getSortingOptions = (query) => {
  const allowedFields = ["name", "createdAt", "updatedAt"];
  const sortField = allowedFields.includes(query.sortField)
    ? query.sortField
    : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  return { [sortField]: sortOrder };
};

/**
 * Fetch all projects with filters, pagination, and sorting
 */
export const getProjectsService = async (user, query) => {
  const parsedPage = parseInt(query.page);
  const parsedLimit = parseInt(query.limit);
  const page = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 10 : parsedLimit;
  const skip = (page - 1) * limit;

  const where = {
    ...getRoleBasedFilter(user),
    ...getDynamicFilters(query),
  };

  const orderBy = getSortingOptions(query);

  try {
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({ where, skip, take: limit, orderBy }),
      prisma.project.count({ where }),
    ]);

    return {
      data: projects.map((project) => new ProjectDTO(project)),
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    throw { status: 500, message: "Internal server error" };
  }
};

/**
 * Fetch a single project by ID
 */
export const getProjectByIdService = async (id) => {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: { stages: { include: { tasks: true } } },
      });
  
      if (!project) {
        throw { status: 404, message: "Project not found" };
      }
  
      return new ProjectDTO(project);
    } catch (error) {
      if (error.status === 404) throw error; // Preserve 404 status for not found cases
      throw { status: 500, message: "Internal server error" }; // General error handling
    }
  };
  

/**
 * Create a new project
 */
export const createProjectService = async (data) => {
  try {
    const { name, ...otherData } = data;
    return new ProjectDTO(
      await prisma.project.create({
        data: { name: name.toLowerCase(), ...otherData },
      })
    );
  } catch (error) {
    if (error.code === "P2002") {
      throw { status: 409, message: "A project with this name already exists" };
    }
    throw { status: 500, message: "Internal server error" };
  }
};

/**
 * Update an existing project (PUT)
 */
export const updateProjectService = async (id, data) => {
  try {
    const updateData = { ...data };
    if (updateData.name) updateData.name = updateData.name.toLowerCase();

    return new ProjectDTO(
      await prisma.project.update({
        where: { id },
        data: updateData,
      })
    );
  } catch (error) {
    if (error.code === "P2002") {
      throw { status: 409, message: "A project with this name already exists" };
    }
    if (error.code === "P2025") {
      throw { status: 404, message: "Project not found" };
    }
    throw { status: 500, message: "Internal server error" };
  }
};

/**
 * Partially update a project (PATCH)
 */
export const patchProjectService = async (id, data) => {
    // Ensure at least one valid field is provided
    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) updateData[key] = value;
    });
  
    if (Object.keys(updateData).length === 0) {
      // Explicitly throw 400 error BEFORE reaching the try-catch block
      throw { status: 400, message: "No valid fields provided for update" };
    }
  
    try {
      if (updateData.name) {
        updateData.name = updateData.name.toLowerCase();
      }
  
      return new ProjectDTO(
        await prisma.project.update({
          where: { id },
          data: updateData,
        })
      );
    } catch (error) {
      if (error.code === "P2002") {
        throw { status: 409, message: "A project with this name already exists" };
      }
      if (error.code === "P2025") {
        throw { status: 404, message: "Project not found" };
      }
      throw { status: 500, message: "Internal server error" };
    }
  };
  
/**
 * Delete a project by ID
 */
export const deleteProjectService = async (id) => {
  try {
    await prisma.project.delete({ where: { id } });
  } catch (error) {
    if (error.code === "P2025") {
      throw { status: 404, message: "Project not found" };
    }
    throw { status: 500, message: "Internal server error" };
  }
};
