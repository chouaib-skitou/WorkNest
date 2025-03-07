// repositories/passwordResetToken.repository.js

import { prisma } from "../config/database.js";

export class PasswordResetTokenRepository {
  /**
   * Create a new password reset token.
   * @param {Object} data - { userId, token, expiresAt }
   * @returns {Promise<Object>} Created token record.
   */
  static async create(data) {
    return prisma.passwordResetToken.create({ data });
  }

  /**
   * Find a password reset token by unique condition (e.g. { token }).
   * @param {Object} where
   * @returns {Promise<Object|null>}
   */
  static async findUnique(where) {
    return prisma.passwordResetToken.findUnique({ where });
  }

  /**
   * Delete a password reset token.
   * @param {Object} where - e.g. { token }.
   * @returns {Promise<Object>} Deleted record.
   */
  static async delete(where) {
    return prisma.passwordResetToken.delete({ where });
  }

  /**
   * Delete many password reset tokens by condition (e.g. { userId }).
   * @param {Object} where
   * @returns {Promise<{count: number}>}
   */
  static async deleteMany(where) {
    return prisma.passwordResetToken.deleteMany({ where });
  }
}
