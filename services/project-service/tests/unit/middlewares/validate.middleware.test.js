import { validateRequest } from "../../../middleware/validate.middleware.js";
import { validationResult } from "express-validator";

jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("🛂 validateRequest Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  test("🚫 Validation failed - Should return 400 with formatted error messages", () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { param: "name", msg: "Name is required" },
        { param: "email", msg: "Invalid email format" },
      ],
    });

    validateRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [
        { field: "name", message: "Name is required" },
        { field: "email", message: "Invalid email format" },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("✅ Validation passed - Should proceed to next middleware", () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => [],
    });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});
