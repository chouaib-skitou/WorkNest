/**
 * Project Service Module
 * Provides services for handling project operations including CRUD operations with role-based access control.
 */
import { ProjectRepository } from "../repositories/project.repository.js";
import { ProjectDTO, GetAllProjectsDTO } from "../dtos/project.dto.js";
import { fetchUsersByIds } from "../services/helpers/user.enrichment.js";

/**
 * Generate role-based filter conditions for project queries.
 * @param {Object} user - The user object containing role and id.
 * @returns {Object} - Filter conditions for repository query.
 */
const getRoleBasedFilter = (user) => {
  if (user.role === "ROLE_EMPLOYEE") {
    return { employeeIds: { has: user.id } };
  } else if (user.role === "ROLE_MANAGER") {
    return {
      OR: [
        { managerId: user.id },
        { employeeIds: { has: user.id } },
        { createdBy: user.id },
      ],
    };
  }
  // ROLE_ADMIN gets all projects (no filter)
  return {};
};

/**
 * Generate dynamic filter conditions based on query parameters.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Filter conditions for repository query.
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
  if (query.priority) {
    filters.priority = query.priority;
  }
  if (query.status) {
    filters.status = query.status;
  }
  return filters;
};

/**
 * Generate sorting options for project queries.
 * @param {Object} query - Query parameters from the request.
 * @returns {Object} - Sorting options for repository query.
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
 * Authorize project modification (update or patch) based on user role.
 * @param {Object} user - The user performing the operation.
 * @param {string} id - The project ID.
 * @param {Object} logConfig - Custom logging messages.
 * @returns {Promise<Object>} - Resolves with the project data if authorized.
 */
const authorizeProjectModification = async (user, id, logConfig) => {
  const existingProject = await ProjectRepository.findUnique({
    where: { id },
    select: { id: true, managerId: true, createdBy: true },
  });

  if (!existingProject) {
    return Promise.reject({ status: 404, message: "Project not found" });
  }

  if (user.role === "ROLE_ADMIN") {
    console.log(logConfig.adminLog.replace("{id}", id));
    return existingProject;
  }

  if (
    user.role === "ROLE_MANAGER" &&
    (existingProject.managerId === user.id ||
      existingProject.createdBy === user.id)
  ) {
    console.log(logConfig.managerLog.replace("{id}", id));
    return existingProject;
  }

  console.warn(logConfig.unauthorizedLog.replace("{id}", id));
  return Promise.reject({
    status: 403,
    message: logConfig.unauthorizedMessage,
  });
};

/**
 * Authorize project deletion based on user role.
 * @param {Object} user - The user performing the deletion.
 * @param {string} id - The project ID.
 * @returns {Promise<Object>} - Resolves with the project data if authorized.
 */
const authorizeProjectDeletion = async (user, id) => {
  const existingProject = await ProjectRepository.findUnique({
    where: { id },
    select: { id: true, createdBy: true },
  });

  if (!existingProject) {
    return Promise.reject({ status: 404, message: "Project not found" });
  }

  if (user.role === "ROLE_ADMIN") {
    console.log(`✅ Admin deleting project: ${id}`);
    return existingProject;
  }

  if (user.role === "ROLE_MANAGER" && existingProject.createdBy === user.id) {
    console.log(`Manager deleting project they created: ${id}`);
    return existingProject;
  }

  console.warn(`Access denied: User not authorized to delete project ${id}`);
  return Promise.reject({
    status: 403,
    message: "Access denied: You do not have permission to delete this project",
  });
};

/**
 * Retrieve a paginated list of projects based on filters and sorting.
 * @param {Object} user - The user making the request.
 * @param {Object} query - Query parameters for filtering, pagination, and sorting.
 * @param {string} token - JWT token for user enrichment.
 * @returns {Promise<Object>} - Paginated projects data.
 */
export const getProjectsService = async (user, query, token) => {
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
      ProjectRepository.findMany({ where, skip, take: limit, orderBy }),
      ProjectRepository.count({ where }),
    ]);

    if (totalCount === 0) {
      console.warn("No projects found for the user with filters:", where);
      return {
        data: [],
        page,
        limit,
        totalCount: 0,
        totalPages: 0,
      };
    }

    // Get both managerIds and createdBy IDs
    const managerIds = projects
      .filter((p) => p.managerId)
      .map((p) => p.managerId);
    const createdByIds = projects
      .filter((p) => p.createdBy)
      .map((p) => p.createdBy);
    const uniqueUserIds = [...new Set([...managerIds, ...createdByIds])];

    // Fetch user details for enrichment
    const usersMap = await fetchUsersByIds(uniqueUserIds, token);
    console.log("🔍 Debug: Users map", usersMap);

    const enrichedProjects = projects.map((project) => ({
      ...project,
      manager: project.managerId ? usersMap[project.managerId] : null,
      createdBy: project.createdBy ? usersMap[project.createdBy] : null,
    }));

    return {
      data: enrichedProjects.map((project) => new GetAllProjectsDTO(project)),
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    if (error.code === "P2025") {
      return Promise.reject({
        status: 403,
        message: "Access denied: You do not have permission to view projects",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Retrieve a single project by its ID with associated stages, tasks, and enriched user details.
 * Enriches the manager, createdBy, employeeIds, and also each task's assignedTo field.
 *
 * @param {Object} user - The user making the request.
 * @param {string} id - The project ID.
 * @param {string} token - JWT token to authorize the request.
 * @returns {Promise<ProjectDTO>} - The enriched project data transfer object.
 */
export const getProjectByIdService = async (user, id, token) => {
  try {
    const where = { id, ...getRoleBasedFilter(user) };
    console.log("🔍 Debug: Role-based filter", where);

    const project = await ProjectRepository.findUnique({
      where,
      include: { stages: { include: { tasks: true } } },
    });

    if (!project) {
      console.log("Debug: No project found with filters", where);
      const existingProject = await ProjectRepository.findUnique({
        where: { id },
        select: { id: true },
      });
      if (existingProject) {
        console.warn("Access denied: User does not have permission");
        return Promise.reject({
          status: 403,
          message:
            "Access denied: You do not have permission to view this project",
        });
      } else {
        console.warn("Project not found in database");
        return Promise.reject({ status: 404, message: "Project not found" });
      }
    }

    // Collect user IDs for enrichment: managerId, createdBy, employeeIds, and each task's assignedTo.
    const userIds = [];
    if (project.managerId) userIds.push(project.managerId);
    if (project.createdBy) userIds.push(project.createdBy);
    if (project.employeeIds && project.employeeIds.length > 0) {
      userIds.push(...project.employeeIds);
    }
    // Add assignedTo IDs from each task in every stage.
    if (project.stages && project.stages.length > 0) {
      project.stages.forEach((stage) => {
        if (stage.tasks && stage.tasks.length > 0) {
          stage.tasks.forEach((task) => {
            if (task.assignedTo) {
              userIds.push(task.assignedTo);
            }
          });
        }
      });
    }

    const uniqueUserIds = [...new Set(userIds)];
    const usersMap = await fetchUsersByIds(uniqueUserIds, token);
    console.log("🔍 Debug: Users map", usersMap);

    // Enrich project-level fields.
    const enrichedProject = {
      ...project,
      manager: project.managerId ? usersMap[project.managerId] : null,
      createdBy: project.createdBy ? usersMap[project.createdBy] : null,
      employees: project.employeeIds
        ? project.employeeIds.map((id) => usersMap[id] || { id })
        : [],
    };

    // Enrich each task's assignedTo field.
    if (enrichedProject.stages && enrichedProject.stages.length > 0) {
      enrichedProject.stages = enrichedProject.stages.map((stage) => {
        if (stage.tasks && stage.tasks.length > 0) {
          stage.tasks = stage.tasks.map((task) => {
            return {
              ...task,
              assignedTo: task.assignedTo
                ? usersMap[task.assignedTo] || { id: task.assignedTo }
                : null,
            };
          });
        }
        return stage;
      });
    }

    return new ProjectDTO(enrichedProject);
  } catch (error) {
    console.error("Error fetching project:", error);
    return Promise.reject(error);
  }
};

/**
 * Create a new project. Accessible only by admins and managers.
 * @param {Object} user - The user creating the project.
 * @param {Object} data - The project data.
 * @param {string} token - JWT token to authorize the request.
 * @returns {Promise<ProjectDTO>} - The created project data transfer object.
 */
export const createProjectService = async (user, data, token) => {
  try {
    if (!["ROLE_ADMIN", "ROLE_MANAGER"].includes(user.role)) {
      return Promise.reject({
        status: 403,
        message: "Access denied: Only admins and managers can create projects",
      });
    }
    const projectData = {
      ...data,
      name: data.name.toLowerCase(),
      createdBy: user.id,
    };

    const newProject = await ProjectRepository.create(projectData);

    // Collect user IDs for enrichment: managerId, createdBy, and employeeIds if any.
    const userIds = [];
    if (newProject.managerId) userIds.push(newProject.managerId);
    if (newProject.createdBy) userIds.push(newProject.createdBy);
    if (newProject.employeeIds && newProject.employeeIds.length > 0) {
      userIds.push(...newProject.employeeIds);
    }
    const uniqueUserIds = [...new Set(userIds)];
    const usersMap = await fetchUsersByIds(uniqueUserIds, token);
    console.log("🔍 Debug: Users map", usersMap);

    const enrichedProject = {
      ...newProject,
      manager: newProject.managerId ? usersMap[newProject.managerId] : null,
      createdBy: newProject.createdBy ? usersMap[newProject.createdBy] : null,
      employees: newProject.employeeIds
        ? newProject.employeeIds.map((id) => usersMap[id] || { id })
        : [],
    };

    return new ProjectDTO(enrichedProject);
  } catch (error) {
    console.error("Error creating project:", error);
    if (error.code === "P2002") {
      return Promise.reject({
        status: 409,
        message: "A project with this name already exists",
      });
    }
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Fully update a project. Accessible by admins or managers who manage or created the project.
 * @param {Object} user - The user updating the project.
 * @param {string} id - The project ID.
 * @param {Object} data - The updated project data.
 * @param {string} token - JWT token for user enrichment.
 * @returns {Promise<ProjectDTO>} - The updated project data transfer object.
 */
export const updateProjectService = async (user, id, data, token) => {
  try {
    const logConfig = {
      adminLog: "Admin updating project: {id}",
      managerLog: "Manager updating project they manage or created: {id}",
      unauthorizedLog:
        "Access denied: User not authorized to update project {id}",
      unauthorizedMessage:
        "Access denied: You do not have permission to update this project",
    };

    await authorizeProjectModification(user, id, logConfig);
    const updateData = { ...data };
    if (updateData.name) updateData.name = updateData.name.toLowerCase();

    const updatedProject = await ProjectRepository.update(id, updateData);
    const userIds = [];
    if (updatedProject.managerId) userIds.push(updatedProject.managerId);
    if (updatedProject.createdBy) userIds.push(updatedProject.createdBy);
    if (updatedProject.employeeIds && updatedProject.employeeIds.length > 0) {
      userIds.push(...updatedProject.employeeIds);
    }
    const uniqueUserIds = [...new Set(userIds)];
    const usersMap = await fetchUsersByIds(uniqueUserIds, token);
    const enrichedProject = {
      ...updatedProject,
      manager: updatedProject.managerId
        ? usersMap[updatedProject.managerId]
        : null,
      createdBy: updatedProject.createdBy
        ? usersMap[updatedProject.createdBy]
        : null,
      employees: updatedProject.employeeIds
        ? updatedProject.employeeIds.map((id) => usersMap[id] || { id })
        : [],
    };

    return new ProjectDTO(enrichedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    if (error && error.status) return Promise.reject(error);
    if (error.code === "P2002")
      return Promise.reject({
        status: 409,
        message: "A project with this name already exists",
      });
    if (error.code === "P2025")
      return Promise.reject({ status: 404, message: "Project not found" });
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Partially update a project. Accessible by admins or managers who manage or created the project.
 * @param {Object} user - The user updating the project.
 * @param {string} id - The project ID.
 * @param {Object} data - The partial project data to update.
 * @param {string} token - JWT token for user enrichment.
 * @returns {Promise<ProjectDTO>} - The updated project data transfer object.
 */
export const patchProjectService = async (user, id, data, token) => {
  try {
    const logConfig = {
      adminLog: "Admin updating project: {id}",
      managerLog: "Manager updating project they manage or created: {id}",
      unauthorizedLog:
        "Access denied: User not authorized to update project {id}",
      unauthorizedMessage:
        "Access denied: You do not have permission to update this project",
    };

    await authorizeProjectModification(user, id, logConfig);

    const updateData = {};
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) updateData[key] = value;
    });

    if (Object.keys(updateData).length === 0)
      return Promise.reject({
        status: 400,
        message: "No valid fields provided for update",
      });

    if (updateData.name) updateData.name = updateData.name.toLowerCase();

    const updatedProject = await ProjectRepository.update(id, updateData);
    const userIds = [];
    if (updatedProject.managerId) userIds.push(updatedProject.managerId);
    if (updatedProject.createdBy) userIds.push(updatedProject.createdBy);
    if (updatedProject.employeeIds && updatedProject.employeeIds.length > 0) {
      userIds.push(...updatedProject.employeeIds);
    }
    const uniqueUserIds = [...new Set(userIds)];
    const usersMap = await fetchUsersByIds(uniqueUserIds, token);
    const enrichedProject = {
      ...updatedProject,
      manager: updatedProject.managerId
        ? usersMap[updatedProject.managerId]
        : null,
      createdBy: updatedProject.createdBy
        ? usersMap[updatedProject.createdBy]
        : null,
      employees: updatedProject.employeeIds
        ? updatedProject.employeeIds.map((id) => usersMap[id] || { id })
        : [],
    };

    return new ProjectDTO(enrichedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    if (error && error.status) return Promise.reject(error);
    if (error.code === "P2002")
      return Promise.reject({
        status: 409,
        message: "A project with this name already exists",
      });
    if (error.code === "P2025")
      return Promise.reject({ status: 404, message: "Project not found" });
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};

/**
 * Delete a project. Accessible by admins or managers who created the project.
 * @param {Object} user - The user deleting the project.
 * @param {string} id - The project ID.
 * @returns {Promise<Object>} - A success message upon deletion.
 */
export const deleteProjectService = async (user, id) => {
  try {
    await authorizeProjectDeletion(user, id);
    await ProjectRepository.delete(id);
    return { message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    if (error && error.status) return Promise.reject(error);
    if (error.code === "P2025")
      return Promise.reject({ status: 404, message: "Project not found" });
    return Promise.reject({ status: 500, message: "Internal server error" });
  }
};


/**
 * Retrieve the list of employees for a given project.
 * This function checks role-based access, fetches the project to verify its existence and the user's authorization,
 * then uses fetchUsersByIds to retrieve detailed user data for each employee ID in the project.
 * 
 * @param {Object} user - The user making the request (contains `id` and `role`).
 * @param {string} projectId - The project ID.
 * @param {string} token - The JWT token used to fetch user details.
 * @returns {Promise<Array>} - Returns an array of enriched employees assigned to the project.
 */
export const getProjectEmployeesService = async (user, projectId, token) => {
  // Combine role-based filter with the project ID
  const where = { id: projectId, ...getRoleBasedFilter(user) };

  // Retrieve the project to ensure it exists and that the user is authorized to view it
  const project = await ProjectRepository.findUnique({
    where,
    select: { id: true, employeeIds: true },
  });

  if (!project) {
    // If project exists but user does not have access
    const existingProject = await ProjectRepository.findUnique({
      where: { id: projectId },
      select: { id: true },
    });
    if (existingProject) {
      return Promise.reject({
        status: 403,
        message: "Access denied: You do not have permission to view this project's employees",
      });
    } else {
      return Promise.reject({ status: 404, message: "Project not found" });
    }
  }

  // If there are no employees in this project, return an empty array
  if (!project.employeeIds || project.employeeIds.length === 0) {
    return [];
  }

  // Use fetchUsersByIds to enrich the list of employees
  const usersMap = await fetchUsersByIds(project.employeeIds, token);

  // Build an array of enriched employees
  const enrichedEmployees = project.employeeIds.map(
    (empId) => usersMap[empId] || { id: empId }
  );

  return enrichedEmployees;
};

