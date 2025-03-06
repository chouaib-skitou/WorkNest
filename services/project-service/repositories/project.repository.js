import { prisma } from "../config/database.js";

/**
 * Project Repository
 * Encapsulates all direct database operations for the Project entity.
 */
export const ProjectRepository = {
  /**
   * Find a unique project.
   * @param {Object} options - Prisma findUnique options.
   * @returns {Promise<Object|null>} The project record or null if not found.
   */
  findUnique: (options) => prisma.project.findUnique(options),

  /**
   * Find multiple projects.
   * @param {Object} options - Prisma findMany options.
   * @returns {Promise<Array>} Array of project records.
   */
  findMany: (options) => prisma.project.findMany(options),

  /**
   * Count the number of projects.
   * @param {Object} options - Prisma count options.
   * @returns {Promise<number>} Count of projects.
   */
  count: (options) => prisma.project.count(options),

  /**
   * Create a new project.
   * @param {Object} data - Data for the new project.
   * @returns {Promise<Object>} The created project record.
   */
  create: (data) => prisma.project.create({ data }),

  /**
   * Update an existing project.
   * @param {string} id - The project ID.
   * @param {Object} data - The updated project data.
   * @param {Object} [include] - Prisma include for relations.
   * @returns {Promise<Object>} The updated project record.
   */
  update: (id, data, include) =>
    prisma.project.update({
      where: { id },
      data,
      ...(include && { include }),
    }),

  /**
   * Delete a project.
   * @param {string} id - The project ID.
   * @returns {Promise<Object>} The deleted project record.
   */
  delete: (id) => prisma.project.delete({ where: { id } }),
};
