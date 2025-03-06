import { prisma } from "../config/database.js";

/**
 * Stage Repository
 * Encapsulates all direct database operations for the Stage entity.
 */
export const StageRepository = {
  findUnique: (options) => prisma.stage.findUnique(options),
  findMany: (options) => prisma.stage.findMany(options),
  count: (options) => prisma.stage.count(options),
  create: (data, include) =>
    prisma.stage.create({
      data,
      ...(include ? { include } : {}),
    }),
  update: (id, data, include) =>
    prisma.stage.update({
      where: { id },
      data,
      ...(include ? { include } : {}),
    }),
  delete: (id) => prisma.stage.delete({ where: { id } }),
};
