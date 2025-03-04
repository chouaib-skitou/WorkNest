import { validationResult } from "express-validator";
import {
  createProjectValidation,
  updateProjectValidation,
  patchProjectValidation,
  deleteProjectValidation,
} from "../../../validators/project.validator.js";

/**
 * Helper to run an array of validation rules (express-validator) on a mock request.
 * Returns the array of validation errors.
 */
async function runValidatorRules(rules, reqBody, reqParams = {}) {
  const req = { body: reqBody, params: reqParams };
  const errors = [];

  // Run each validator rule
  for (const rule of rules) {
    await rule.run(req);
  }

  // Use express-validator's validationResult to gather errors
  const result = validationResult(req);
  return result.array();
}

describe("Project Validator Tests (100% coverage)", () => {

  test("🚫 createProjectValidation should fail when required fields are missing", async () => {
    const reqBody = {};
    const errors = await runValidatorRules(createProjectValidation, reqBody);
    const messages = errors.map((e) => e.msg);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Project name is required",
        "Project description is required",
        "Due date is required",
      ])
    );
  });

  test("🚫 createProjectValidation should fail when dueDate format is incorrect", async () => {
    const reqBody = {
      name: "Test Project",
      description: "A test project",
      dueDate: "2025-03-04", // Invalid format
    };
    const errors = await runValidatorRules(createProjectValidation, reqBody);
    const messages = errors.map((e) => e.msg);
    expect(messages).toContain(
      "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
    );
  });

  test("✅ createProjectValidation should pass with valid data", async () => {
    const reqBody = {
      name: "Chouaib Project",
      description: "A valid project",
      dueDate: "2025-03-04T00:00:00.000Z",
      status: "PENDING",
      priority: "MEDIUM",
    };
    const errors = await runValidatorRules(createProjectValidation, reqBody);
    expect(errors.length).toBe(0);
  });

  test("🚫 updateProjectValidation should fail when required fields are missing", async () => {
    const reqBody = {};
    const reqParams = { id: "invalid-uuid" }; // Invalid ID
    const errors = await runValidatorRules(updateProjectValidation, reqBody, reqParams);
    const messages = errors.map((e) => e.msg);
    expect(messages).toEqual(
      expect.arrayContaining([
        "Invalid project ID format",
        "Project name is required",
        "Project description is required",
        "Due date is required",
      ])
    );
  });

  test("🚫 updateProjectValidation should fail when invalid priority is provided", async () => {
    const reqBody = {
      name: "Valid Project",
      description: "A valid description",
      dueDate: "2025-03-04T00:00:00.000Z",
      priority: "INVALID", // Not in [LOW, MEDIUM, HIGH]
    };
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(updateProjectValidation, reqBody, reqParams);
    expect(errors.map((e) => e.msg)).toContain(
      "Priority must be one of: LOW, MEDIUM, HIGH"
    );
  });

  test("✅ updateProjectValidation should pass with valid data", async () => {
    const reqBody = {
      name: "Updated Project",
      description: "An updated description",
      dueDate: "2025-03-04T00:00:00.000Z",
      status: "IN_PROGRESS",
      priority: "HIGH",
    };
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(updateProjectValidation, reqBody, reqParams);
    expect(errors.length).toBe(0);
  });

  test("🚫 patchProjectValidation should fail when invalid status is provided", async () => {
    const reqBody = { status: "UNKNOWN" }; // Not in [PENDING, IN_PROGRESS, COMPLETED]
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(patchProjectValidation, reqBody, reqParams);
    expect(errors.map((e) => e.msg)).toContain(
      "Status must be one of: PENDING, IN_PROGRESS, COMPLETED"
    );
  });

  test("🚫 patchProjectValidation should fail when dueDate format is incorrect", async () => {
    const reqBody = { dueDate: "03-04-2025" }; // Invalid format
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(patchProjectValidation, reqBody, reqParams);
    expect(errors.map((e) => e.msg)).toContain(
      "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
    );
  });

  test("✅ patchProjectValidation should pass when valid fields are provided", async () => {
    const reqBody = { status: "COMPLETED" };
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(patchProjectValidation, reqBody, reqParams);
    expect(errors.length).toBe(0);
  });

  test("✅ patchProjectValidation should pass when dueDate format is correct", async () => {
    const reqBody = { dueDate: "2025-03-04T00:00:00.000Z" }; // Correct format
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
  
    const errors = await runValidatorRules(patchProjectValidation, reqBody, reqParams);
    expect(errors.length).toBe(0); // No errors should be returned
  });
  
  
  test("🚫 deleteProjectValidation should fail if ID is invalid", async () => {
    const reqParams = { id: "invalid-uuid" };
    const errors = await runValidatorRules(deleteProjectValidation, {}, reqParams);
    expect(errors.map((e) => e.msg)).toContain("Invalid project ID format");
  });

  test("✅ deleteProjectValidation should pass with valid ID", async () => {
    const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
    const errors = await runValidatorRules(deleteProjectValidation, {}, reqParams);
    expect(errors.length).toBe(0);
  });
});
