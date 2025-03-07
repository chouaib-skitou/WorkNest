// repositories/task.repository.js

import { prisma } from "../config/database.js";

/**
 * Task Repository
 * Encapsulates all direct database operations for the Task entity.
 */
export const TaskRepository = {
  /**
   * Find many tasks with given options.
   * @param {Object} options - Prisma findMany options.
   * @returns {Promise<Array>} Array of task records.
   */
  findMany(options) {
    return prisma.task.findMany(options);
  },

  /**
   * Count tasks based on given options.
   * @param {Object} options - Prisma count options.
   * @returns {Promise<number>} Count of tasks.
   */
  count(options) {
    return prisma.task.count(options);
  },

  /**
   * Find a unique task.
   * @param {Object} options - Prisma findUnique options.
   * @returns {Promise<Object|null>} Task record or null if not found.
   */
  findUnique(options) {
    return prisma.task.findUnique(options);
  },

  /**
   * Create a new task.
   * @param {Object} data - Data for the new task.
   * @param {Object} [include] - Prisma include for relations.
   * @returns {Promise<Object>} The created task record.
   */
  create(data, include) {
    return prisma.task.create({
      data,
      ...(include ? { include } : {}),
    });
  },

  /**
   * Update an existing task by ID.
   * @param {string} id - The task ID.
   * @param {Object} data - The updated task data.
   * @param {Object} [include] - Prisma include for relations.
   * @returns {Promise<Object>} The updated task record.
   */
  update(id, data, include) {
    return prisma.task.update({
      where: { id },
      data,
      ...(include ? { include } : {}),
    });
  },

  /**
   * Delete a task by ID.
   * @param {string} id - The task ID.
   * @returns {Promise<Object>} The deleted task record.
   */
  delete(id) {
    return prisma.task.delete({ where: { id } });
  },
};
