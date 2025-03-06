// repositories/project.repository.js
import { prisma } from "../config/database.js";

/**
 * Project Repository
 * Encapsulates all direct database operations for the Project entity.
 */
export const ProjectRepository = {
  findUnique: (options) => prisma.project.findUnique(options),
  findMany: (options) => prisma.project.findMany(options),
  count: (options) => prisma.project.count(options),
  create: (data) => prisma.project.create({ data }),
  update: (id, data, include) =>
    prisma.project.update({
      where: { id },
      data,
      ...(include && { include }),
    }),
  delete: (id) => prisma.project.delete({ where: { id } }),
};
