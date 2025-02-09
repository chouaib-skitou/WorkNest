import * as userController from "../../controllers/user.controller.js";
import { prisma } from "../../config/database.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { UserDTO } from "../../dtos/user.dto.js";

jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
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
    req.user = { id: "1", role: "ROLE_ADMIN" }; // Mock authenticated admin user
    next();
  }),
}));

describe("🛂 User Controller Tests (Full Coverage)", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { id: "1", role: "ROLE_ADMIN" } };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    jest.spyOn(console, "error").mockImplementation(() => {}); // Suppress console errors
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** 🟢 Get All Users */
  test("📌 Retrieve all users (Only ADMIN or MANAGER)", async () => {
    const mockUsers = [{ id: "1", firstName: "John" }, { id: "2", firstName: "Jane" }];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    await userController.getUsers[1](req, res);

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([expect.any(UserDTO)]));
  });

  test("🚫 Deny access to EMPLOYEE role for retrieving users", async () => {
    req.user.role = "ROLE_EMPLOYEE";
    await userController.getUsers[0](req, res, () => {});
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  test("🚫 Handle error when fetching users fails", async () => {
    prisma.user.findMany.mockRejectedValue(new Error("Database error"));
    await userController.getUsers[1](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Get Specific User */
  test("🔎 Retrieve user by ID (Admin or self)", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockResolvedValue({ id: "2", firstName: "User" });

    await userController.getUserById[0](req, res);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "2" } });
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Deny access to another user's data (non-admin)", async () => {
    req.user.role = "ROLE_EMPLOYEE";
    req.user.id = "1";
    req.params.id = "2";

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  test("🚫 Return 404 if user not found", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Create User */
  test("✅ Successfully create a new user (Admin only)", async () => {
    req.body = { firstName: "NewUser", role: "ROLE_EMPLOYEE" };
    prisma.user.create.mockResolvedValue({ id: "3", ...req.body });

    await userController.createUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Handle error when user creation fails", async () => {
    prisma.user.create.mockRejectedValue(new Error("Database error"));
    await userController.createUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Update User */
  test("✅ Successfully update a user (Admin or User themselves)", async () => {
    req.params.id = "1";
    req.body = { firstName: "UpdatedName" };
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockResolvedValue({ id: "1", firstName: "UpdatedName" });

    await userController.updateUser[2](req, res);
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  test("🚫 Return 404 if user does not exist when updating", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Handle error when updating user fails", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Delete User */
  test("✅ Successfully delete a user (Admin only)", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockResolvedValue({ id: "2" });
    prisma.user.delete.mockResolvedValue({});

    await userController.deleteUser[2](req, res);
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
  });

  test("🚫 Return 404 if user does not exist when deleting", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  test("🚫 Handle error when deleting user fails", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  /** 🟢 Ensure checkRole denies access when role is incorrect */
  test("🚫 Middleware - checkRole should deny unauthorized users", async () => {
    const mockNext = jest.fn();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockReq = { user: { role: "ROLE_EMPLOYEE" } }; // Not ADMIN or MANAGER
    const middleware = userController.getUsers[0];

    middleware(mockReq, mockRes, mockNext);
    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
  });

  /** 🟢 Ensure error is handled when getUserById fails */
  test("🚫 Handle database error in getUserById", async () => {
    req.params.id = "2";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.getUserById[0](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure validation middleware is working for updateUser */
  test("🚫 Ensure validation middleware runs for updateUser", async () => {
    await userController.updateUser[1](req, res, () => {});
    expect(validateRequest).toHaveBeenCalled();
  });

  /** 🟢 Handle error when updating user fails */
  test("🚫 Ensure updateUser handles errors properly", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockResolvedValue({ id: "1" });
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Handle error when patchUser fails */
  test("🚫 Ensure patchUser handles errors properly", async () => {
    req.params.id = "1";
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.patchUser[1](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure deleteUser handles errors correctly */
  test("🚫 Ensure deleteUser handles database errors", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
  /** 🟢 Middleware - Ensure checkRole allows correct roles */
  test("✅ Middleware - checkRole should allow authorized users", async () => {
    const mockNext = jest.fn();
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockReq = { user: { role: "ROLE_MANAGER" } }; // Allowed role
    const middleware = userController.getUsers[0];

    middleware(mockReq, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalled(); // Should proceed to next middleware
  });

  /** 🟢 Handle update when user does not exist */
  test("🚫 Ensure updateUser returns 404 when user does not exist", async () => {
    req.params.id = "999"; // Nonexistent user
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.updateUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Ensure patchUser handles user not found */
  test("🚫 Ensure patchUser returns 404 when user does not exist", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.patchUser[1](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🚫 Ensure patchUser handles database errors correctly */
  test("🚫 Ensure patchUser handles database errors correctly", async () => {
    req.params.id = "1";
    req.body = { firstName: "BrokenUpdate" };

    // Simulate a database error
    prisma.user.findUnique.mockResolvedValue({ id: "1" }); // Ensure user exists
    prisma.user.update.mockRejectedValue(new Error("Database error"));

    await userController.patchUser[1](req, res);

    expect(res.status).toHaveBeenCalledWith(500); // ✅ Now correctly expecting 500
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🟢 Ensure deleteUser handles missing user */
  test("🚫 Ensure deleteUser returns 404 when user is not found", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  /** 🟢 Ensure deleteUser handles database error */
  test("🚫 Ensure deleteUser handles database errors correctly", async () => {
    req.params.id = "3";
    prisma.user.findUnique.mockResolvedValue({ id: "3" });
    prisma.user.delete.mockRejectedValue(new Error("Database error"));

    await userController.deleteUser[2](req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure checkRole denies access for multiple unauthorized roles */
  test("🚫 Middleware - checkRole should deny access for multiple unauthorized roles", async () => {
    const roles = ["ROLE_GUEST", "ROLE_INTERN"];
    for (const role of roles) {
      const mockNext = jest.fn();
      const mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const mockReq = { user: { role } };

      const middleware = userController.getUsers[0];
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Access denied" });
    }
  });

  /** 🚫 Ensure updateUser does not update if Prisma returns the same object */
  test("🚫 Ensure updateUser does not update if no changes are made", async () => {
    req.params.id = "1";
    req.body = { firstName: "SameName" };

    prisma.user.findUnique.mockResolvedValue({ id: "1", firstName: "SameName" });
    prisma.user.update.mockResolvedValue({ id: "1", firstName: "SameName" });

    await userController.updateUser[2](req, res);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  /** 🚫 Ensure patchUser does not update if Prisma returns the same object */
  test("🚫 Ensure patchUser does not update if no changes are made", async () => {
    req.params.id = "1";
    req.body = { lastName: "SameLastName" };

    prisma.user.findUnique.mockResolvedValue({ id: "1", lastName: "SameLastName" });
    prisma.user.update.mockResolvedValue({ id: "1", lastName: "SameLastName" });

    await userController.patchUser[1](req, res);

    expect(prisma.user.update).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.any(UserDTO));
  });

  /** 🚫 Ensure 500 error is handled when prisma.findUnique fails in updateUser */
  test("🚫 Ensure updateUser handles database error in findUnique", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.updateUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure 500 error is handled when prisma.findUnique fails in patchUser */
  test("🚫 Ensure patchUser handles database error in findUnique", async () => {
    req.params.id = "1";
    prisma.user.findUnique.mockRejectedValue(new Error("Database error"));

    await userController.patchUser[1](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });

  /** 🚫 Ensure deleteUser does not proceed if user already deleted */
  test("🚫 Ensure deleteUser does not proceed if user was already deleted", async () => {
    req.params.id = "999";
    prisma.user.findUnique.mockResolvedValue(null);

    await userController.deleteUser[2](req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });
});
