import { prisma } from "../config/database.js";

/**
 * Stage Repository
 * Encapsulates all direct database operations for the Stage entity.
 */
export const StageRepository = {
  /**
   * Find a unique stage.
   * @param {Object} options - Prisma findUnique options.
   * @returns {Promise<Object|null>} The stage record or null if not found.
   */
  findUnique: (options) => prisma.stage.findUnique(options),

  /**
   * Find multiple stages.
   * @param {Object} options - Prisma findMany options.
   * @returns {Promise<Array>} Array of stage records.
   */
  findMany: (options) => prisma.stage.findMany(options),

  /**
   * Count the number of stages.
   * @param {Object} options - Prisma count options.
   * @returns {Promise<number>} Count of stages.
   */
  count: (options) => prisma.stage.count(options),

  /**
   * Create a new stage.
   * @param {Object} data - Data for the new stage.
   * @param {Object} [include] - Prisma include for relations.
   * @returns {Promise<Object>} The created stage record.
   */
  create: (data, include) =>
    prisma.stage.create({
      data,
      ...(include ? { include } : {}),
    }),

  /**
   * Update an existing stage.
   * @param {string} id - The stage ID.
   * @param {Object} data - The updated stage data.
   * @param {Object} [include] - Prisma include for relations.
   * @returns {Promise<Object>} The updated stage record.
   */
  update: (id, data, include) =>
    prisma.stage.update({
      where: { id },
      data,
      ...(include ? { include } : {}),
    }),

  /**
   * Delete a stage.
   * @param {string} id - The stage ID.
   * @returns {Promise<Object>} The deleted stage record.
   */
  delete: (id) => prisma.stage.delete({ where: { id } }),
};
