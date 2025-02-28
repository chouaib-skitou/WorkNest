import { validateRequest } from "../../../middleware/validate.middleware.js";
import { validationResult } from "express-validator";

jest.mock("express-validator", () => ({
  validationResult: jest.fn(),
}));

describe("Validation Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  test("✅ Should call next when there are no validation errors", () => {
    validationResult.mockReturnValue({ isEmpty: () => true });

    validateRequest(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("🚫 Should return 400 if validation fails", () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [{ param: "email", msg: "Invalid email" }],
    });

    validateRequest(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errors: [{ field: "email", message: "Invalid email" }],
    });
  });
});
