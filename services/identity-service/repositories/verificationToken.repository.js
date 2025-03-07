// repositories/verificationToken.repository.js

import { prisma } from "../config/database.js";

export class VerificationTokenRepository {
  /**
   * Create a new verification token.
   * @param {Object} data - { userId, token, expiresAt }
   * @returns {Promise<Object>} Created token record.
   */
  static async create(data) {
    return prisma.verificationToken.create({ data });
  }

  /**
   * Find a verification token by condition (e.g. { token }).
   * @param {Object} where - Condition for search.
   * @returns {Promise<Object|null>}
   */
  static async findFirst(where) {
    return prisma.verificationToken.findFirst({ where, include: { user: true } });
  }

  /**
   * Delete a verification token.
   * @param {Object} where - e.g. { id }.
   * @returns {Promise<Object>} Deleted record.
   */
  static async delete(where) {
    return prisma.verificationToken.delete({ where });
  }
}
