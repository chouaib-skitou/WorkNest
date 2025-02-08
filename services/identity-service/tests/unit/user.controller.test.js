import * as userController from "../../controllers/user.controller.js";
import { prisma } from "../../config/database.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";

jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("../../middleware/validate.middleware.js", () => ({
  validateRequest: jest.fn((req, res, next) => next()),
}));

jest.mock("../../middleware/auth.middleware.js", () => ({
  authMiddleware: jest.fn((req, res, next) => {
    req.user = { id: "1", role: "ROLE_ADMIN" }; // Mock authenticated user
    next();
  }),
}));

describe("👥 User Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: "1" } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  /** 📌 Get All Users */
  test("✅ Retrieve all users", async () => {
    const mockUsers = [
      { 
        id: "1", 
        firstName: "John", 
        lastName: "Doe", 
        email: "john@example.com", 
        role: "ROLE_USER", 
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      { 
        id: "2", 
        firstName: "Jane", 
        lastName: "Doe", 
        email: "jane@example.com", 
        role: "ROLE_ADMIN", 
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    await userController.getUsers(req, res);

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ id: "1", role: "ROLE_USER", isVerified: true }),
      expect.objectContaining({ id: "2", role: "ROLE_ADMIN", isVerified: false })
    ]));
  });

  /** 📌 Update User */
  test("✅ Successfully update a user", async () => {
    req.params.id = "1";
    req.body = { firstName: "UpdatedName" };
    const updatedUser = { id: "1", firstName: "UpdatedName", lastName: "Doe" };

    prisma.user.update.mockResolvedValue(updatedUser);

    await userController.updateUser[2](req, res);

    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: "1" }, data: req.body });
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  test("🚫 Prevent update if user not found", async () => {
    req.params.id = "999";
    req.body = { firstName: "NonExistent" };
    prisma.user.update.mockRejectedValue(new Error("User not found"));

    await userController.updateUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 📌 Delete User */
  test("✅ Successfully delete a user", async () => {
    req.params.id = "1";
    prisma.user.delete.mockResolvedValue({});

    await userController.deleteUser[2](req, res);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
  });

  test("🚫 Prevent deletion of non-existent user", async () => {
    req.params.id = "999";
    prisma.user.delete.mockRejectedValue(new Error("User not found"));

    await userController.deleteUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
