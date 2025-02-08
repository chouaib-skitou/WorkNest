import { getUsers, updateUser, deleteUser } from "../../controllers/user.controller.js";
import { prisma } from "../../config/database.js";
import { body, param } from "express-validator";


jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("🧑‍💼 User Controller Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  /** ✅ Get all users */
  test("✅ Get all users", async () => {
    const mockUsers = [{ id: "1", firstName: "John", lastName: "Doe", email: "john@example.com" }];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    await getUsers(req, res);

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  /** ✅ Update user with valid data */
  test("✅ Update user with valid data", async () => {
    req.params.id = "1";
    req.body = { firstName: "Updated Name" };

    validationResult.mockReturnValue({ isEmpty: () => true });

    const updatedUser = { id: "1", firstName: "Updated Name", email: "john@example.com" };
    prisma.user.update.mockResolvedValue(updatedUser);

    await updateUser[2](req, res, next);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: req.body,
    });
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  /** 🚫 Prevent updating user ID */
  test("🚫 Prevent updating user ID", async () => {
    req.params.id = "1";
    req.body = { id: "2" };

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ param: "id", msg: "User ID cannot be changed" }],
    });

    await updateUser[1](req, res, next); // Call validation middleware

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "id", message: "User ID cannot be changed" }],
    });
  });

  /** 🚫 Prevent weak passwords */
  test("🚫 Prevent weak passwords", async () => {
    req.params.id = "1";
    req.body = { password: "123" };

    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { param: "password", msg: "Password must be at least 8 characters long" },
      ],
    });

    await updateUser[1](req, res, next); // Call validation middleware

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "password", message: "Password must be at least 8 characters long" }],
    });
  });

  /** ✅ Delete user */
  test("✅ Delete user", async () => {
    req.params.id = "1";

    validationResult.mockReturnValue({ isEmpty: () => true });
    prisma.user.delete.mockResolvedValue();

    await deleteUser[2](req, res, next);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
  });
});
