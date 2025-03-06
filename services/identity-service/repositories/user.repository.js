// repositories/user.repository.js

import { prisma } from "../config/database.js";

export class UserRepository {
  /**
   * Find many users with pagination, filtering, sorting, etc.
   * @param {Object} params - { where, skip, take, orderBy }
   * @returns {Promise<Array>} Array of User records
   */
  static async findMany({ where, skip, take, orderBy }) {
    return prisma.user.findMany({ where, skip, take, orderBy });
  }

  /**
   * Count users by condition
   * @param {Object} where - Prisma filter condition
   * @returns {Promise<number>} Number of matching users
   */
  static async count(where) {
    return prisma.user.count({ where });
  }

  /**
   * Find a single user by a unique condition (e.g. { id })
   * @param {Object} where - Unique filter for user
   * @returns {Promise<Object|null>}
   */
  static async findUnique(where) {
    return prisma.user.findUnique({ where });
  }

  /**
   * Create a new user
   * @param {Object} data - User fields
   * @returns {Promise<Object>} Created user record
   */
  static async create(data) {
    return prisma.user.create({ data });
  }

  /**
   * Update a user by unique identifier
   * @param {Object} where - e.g. { id }
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated user record
   */
  static async update(where, data) {
    return prisma.user.update({ where, data });
  }

  /**
   * Delete a user by unique identifier
   * @param {Object} where - e.g. { id }
   * @returns {Promise<Object>} Deleted user record
   */
  static async delete(where) {
    return prisma.user.delete({ where });
  }

  /**
   * Remove all reset tokens for a given user
   * @param {string} userId
   * @returns {Promise<number>} Number of tokens deleted
   */
  static async deleteResetTokensByUserId(userId) {
    const result = await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
    return result.count; // .count is how many rows were deleted
  }

  /**
   * Create a fresh reset token for the given user
   * @param {Object} data - { userId, token, expiresAt }
   * @returns {Promise<Object>} Created passwordResetToken record
   */
  static async createResetToken({ userId, token, expiresAt }) {
    return prisma.passwordResetToken.create({
      data: { userId, token, expiresAt },
    });
  }

  /**
   * Find minimal info for users by an array of IDs
   * @param {Array<string>} ids - user IDs
   * @returns {Promise<Array>} Array of partial user records
   */
  static async findManyByIds(ids) {
    return prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }
}
