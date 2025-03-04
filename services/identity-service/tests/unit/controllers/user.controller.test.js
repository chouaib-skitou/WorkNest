import * as userController from "../../../controllers/user.controller.js";
import {
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  patchUserService,
  deleteUserService,
  getUsersByIdsService,
} from "../../../services/user.service.js";

jest.mock("../../../services/user.service.js");

describe("🧪 User Controller Tests", () => {
  let req, res;

  const mockUser = {
    id: "user-123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    role: "ROLE_EMPLOYEE",
    isVerified: true,
  };

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: "admin-1", role: "ROLE_ADMIN" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    test("✅ should return users successfully (200)", async () => {
      getAllUsersService.mockResolvedValue({
        data: [mockUser],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: [mockUser],
        page: 1,
        limit: 10,
        totalCount: 1,
        totalPages: 1,
      });
    });

    test("🚫 should handle error with defined status code", async () => {
      getAllUsersService.mockRejectedValue({
        status: 403,
        message: "Access denied",
      });

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      getAllUsersService.mockRejectedValue(new Error("Database error"));

      await userController.getAllUsers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Database error" });
    });
  });
  
  describe("getUserById", () => {
    test("✅ should return user data successfully (200)", async () => {
      req.params.id = mockUser.id;
      getUserByIdService.mockResolvedValue(mockUser);

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test("🚫 should handle error with defined status code", async () => {
      req.params.id = "not-found-id";
      getUserByIdService.mockRejectedValue({
        status: 404,
        message: "User not found",
      });

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      getUserByIdService.mockRejectedValue(new Error("Unknown error"));

      await userController.getUserById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Unknown error" });
    });
  });
  
  describe("createUser", () => {
    // createUser is [ validationRules, validateRequest, asyncFunction ]
    // we call the handler at index 2 in the array
    const createUserHandler = userController.createUser[2];

    test("✅ should create a user successfully (201)", async () => {
      req.body = {
        firstName: "Jane",
        lastName: "Smith",
        email: "jane@example.com",
        password: "Passw0rd!",
      };
      createUserService.mockResolvedValue(mockUser);

      await createUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockUser);
    });

    test("🚫 should handle error with defined status code (e.g., 403)", async () => {
      createUserService.mockRejectedValue({
        status: 403,
        message: "Only admins can create users",
      });

      await createUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "Only admins can create users" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      createUserService.mockRejectedValue(new Error("Create error"));

      await createUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Create error" });
    });
  });
  
  describe("updateUser", () => {
    // updateUser is [ validationRules, validateRequest, asyncFunction ]
    const updateUserHandler = userController.updateUser[2];

    test("✅ should update user successfully (200)", async () => {
      req.params.id = mockUser.id;
      req.body = { firstName: "NewName" };
      updateUserService.mockResolvedValue({ ...mockUser, firstName: "NewName" });

      await updateUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...mockUser,
        firstName: "NewName",
      });
    });

    test("🚫 should handle error with defined status code (e.g., 409)", async () => {
      updateUserService.mockRejectedValue({
        status: 409,
        message: "A user with that email already exists",
      });

      await updateUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "A user with that email already exists",
      });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      updateUserService.mockRejectedValue(new Error("Update failed"));

      await updateUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Update failed" });
    });
  });
  
  describe("patchUser", () => {
    // patchUser is [ validationRules, validateRequest, asyncFunction ]
    const patchUserHandler = userController.patchUser[2];

    test("✅ should patch user successfully (200)", async () => {
      req.params.id = mockUser.id;
      req.body = { lastName: "NewLastName" };
      patchUserService.mockResolvedValue({
        ...mockUser,
        lastName: "NewLastName",
      });

      await patchUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        ...mockUser,
        lastName: "NewLastName",
      });
    });

    test("🚫 should handle error with defined status code (e.g., 404)", async () => {
      patchUserService.mockRejectedValue({
        status: 404,
        message: "User not found",
      });

      await patchUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      patchUserService.mockRejectedValue(new Error("Patch error"));

      await patchUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Patch error" });
    });
  });
  
  describe("deleteUser", () => {
    // deleteUser is [ validationRules, validateRequest, asyncFunction ]
    const deleteUserHandler = userController.deleteUser[2];

    test("✅ should delete user successfully (200)", async () => {
      req.params.id = mockUser.id;
      deleteUserService.mockResolvedValue({ message: "User deleted successfully" });

      await deleteUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "User deleted successfully" });
    });

    test("🚫 should handle error with defined status code (e.g., 404)", async () => {
      deleteUserService.mockRejectedValue({
        status: 404,
        message: "User not found",
      });

      await deleteUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      deleteUserService.mockRejectedValue(new Error("Delete error"));

      await deleteUserHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Delete error" });
    });
  });
  
  describe("getUsersByIds", () => {
    test("✅ should return minimal user info array (200)", async () => {
      req.body = { ids: ["id-1", "id-2"] };
      getUsersByIdsService.mockResolvedValue([
        { id: "id-1", fullName: "John D", role: "ROLE_MANAGER" },
      ]);

      await userController.getUsersByIds(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: "id-1", fullName: "John D", role: "ROLE_MANAGER" },
      ]);
    });

    test("🚫 should handle error with defined status code (e.g., 400)", async () => {
      req.body = {}; // missing ids
      getUsersByIdsService.mockRejectedValue({
        status: 400,
        message: "No user ids provided",
      });

      await userController.getUsersByIds(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "No user ids provided" });
    });

    test("🚫 should handle error with no status (500 fallback)", async () => {
      getUsersByIdsService.mockRejectedValue(new Error("Batch error"));

      await userController.getUsersByIds(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Batch error" });
    });
  });
});
