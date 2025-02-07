import { getUsers, updateUser, deleteUser } from "../../controllers/user.controller.js";
import { prisma } from "../../config/database.js";

jest.mock("../../config/database.js", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe("🧑‍💼 User Controller Tests", () => {
  let req, res;

  beforeEach(() => {
    req = { params: {}, body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("✅ Get all users", async () => {
    const mockUsers = [{ id: 1, name: "John Doe", email: "john@example.com" }];
    prisma.user.findMany.mockResolvedValue(mockUsers);

    await getUsers(req, res);

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  test("✅ Update user", async () => {
    req.params.id = "1";
    req.body = { name: "Updated Name" };
    
    const updatedUser = { id: 1, name: "Updated Name", email: "john@example.com" };
    prisma.user.update.mockResolvedValue(updatedUser);

    await updateUser(req, res);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: req.body,
    });
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  test("✅ Delete user", async () => {
    req.params.id = "1";

    prisma.user.delete.mockResolvedValue();

    await deleteUser(req, res);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(res.json).toHaveBeenCalledWith({ message: "User deleted" });
  });
});
