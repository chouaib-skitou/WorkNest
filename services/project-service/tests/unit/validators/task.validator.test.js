import { validationResult } from "express-validator";
import {
  createTaskValidation,
  updateTaskValidation,
  patchTaskValidation,
  deleteTaskValidation,
  getTaskByIdValidation,
} from "../../../validators/task.validator.js";

/**
 * Helper to run an array of validation rules (express-validator) on a mock request.
 * Returns the array of validation errors.
 */
async function runValidatorRules(rules, reqBody, reqParams = {}) {
  const req = { body: reqBody, params: reqParams };

  // Run each validator rule
  for (const rule of rules) {
    await rule.run(req);
  }

  // Use express-validator's validationResult to gather errors
  const result = validationResult(req);
  return result.array();
}

describe("Task Validator Tests (100% Coverage)", () => {
  // CREATE TASK VALIDATION TESTS
  describe("createTaskValidation", () => {
    test("🚫 should fail when required fields are missing", async () => {
      const reqBody = {};
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      const messages = errors.map((e) => e.msg);
      expect(messages).toEqual(
        expect.arrayContaining([
          "Task title is required",
          "Priority must be LOW, MEDIUM, or HIGH",
          "Stage ID is required",
          "Project ID is required",
        ])
      );
    });

    test("🚫 should fail when id is set manually", async () => {
      const reqBody = {
        id: "7237003f-1fd1-44bf-917c-445144a125c0",
        title: "Test Task",
        priority: "MEDIUM",
        stageId: "stage-123",
        projectId: "project-123",
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Cannot set Task ID manually");
    });

    test("🚫 should fail when description is not a string", async () => {
      const reqBody = {
        title: "Test Task",
        description: 12345, // Not a string
        priority: "MEDIUM",
        stageId: "stage-123",
        projectId: "project-123",
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain(
        "Description must be a string"
      );
    });

    test("🚫 should fail when priority is invalid", async () => {
      const reqBody = {
        title: "Test Task",
        priority: "CRITICAL", // Not in [LOW, MEDIUM, HIGH]
        stageId: "stage-123",
        projectId: "project-123",
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain(
        "Priority must be LOW, MEDIUM, or HIGH"
      );
    });

    test("🚫 should fail when assignedTo is not a string", async () => {
      const reqBody = {
        title: "Test Task",
        priority: "HIGH",
        stageId: "stage-123",
        projectId: "project-123",
        assignedTo: 12345, // Not a string
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain(
        "AssignedTo must be a user ID"
      );
    });

    test("🚫 should fail when images array contains invalid URLs", async () => {
      const reqBody = {
        title: "Test Task",
        priority: "HIGH",
        stageId: "stage-123",
        projectId: "project-123",
        images: ["https://valid-url.com", "not-a-url"],
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain(
        "Each document must be a valid URL"
      );
    });

    test("✅ should pass with valid data (minimal required fields)", async () => {
      const reqBody = {
        title: "Test Task",
        priority: "HIGH",
        stageId: "stage-123",
        projectId: "project-123",
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.length).toBe(0);
    });

    test("✅ should pass with valid data (all fields)", async () => {
      const reqBody = {
        title: "Comprehensive Task",
        description: "A complete task description",
        priority: "MEDIUM",
        stageId: "7237003f-1fd1-44bf-917c-445144a125c0",
        projectId: "7237003f-1fd1-44bf-917c-445144a125c0",
        assignedTo: "user-123",
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      };
      const errors = await runValidatorRules(createTaskValidation, reqBody);
      expect(errors.length).toBe(0);
    });
  });

  // UPDATE TASK VALIDATION TESTS
  describe("updateTaskValidation", () => {
    test("🚫 should fail when task ID is invalid", async () => {
      const reqBody = {
        title: "Updated Task",
      };
      const reqParams = { id: "invalid-uuid" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Invalid Task ID format");
    });

    test("🚫 should fail when trying to change task ID", async () => {
      const reqBody = {
        id: "7237003f-1fd1-44bf-917c-445144a125c0",
        title: "Updated Task",
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Task ID cannot be changed");
    });

    test("🚫 should fail when title is empty", async () => {
      const reqBody = {
        title: "", // Empty title
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Title cannot be empty");
    });

    test("🚫 should fail when priority is invalid", async () => {
      const reqBody = {
        priority: "URGENT", // Not in [LOW, MEDIUM, HIGH]
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Priority must be LOW, MEDIUM, or HIGH"
      );
    });

    test("🚫 should fail when stageId is not a UUID", async () => {
      const reqBody = {
        stageId: "not-a-uuid",
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Stage ID must be a valid UUID"
      );
    });

    test("🚫 should fail when images contain invalid URLs", async () => {
      const reqBody = {
        images: ["not-a-url"],
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Each document must be a valid URL"
      );
    });

    test("✅ should pass with valid data", async () => {
      const reqBody = {
        title: "Updated Task Title",
        description: "Updated description",
        priority: "LOW",
        stageId: "7237003f-1fd1-44bf-917c-445144a125c0",
        assignedTo: "user-456",
        images: ["https://example.com/updated-image.jpg"],
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });

  // PATCH TASK VALIDATION TESTS
  describe("patchTaskValidation", () => {
    test("🚫 should fail when task ID is invalid", async () => {
      const reqBody = {
        title: "Patched Task",
      };
      const reqParams = { id: "invalid-uuid" };
      const errors = await runValidatorRules(
        patchTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Invalid Task ID format");
    });

    test("🚫 should fail when trying to change task ID", async () => {
      const reqBody = {
        id: "different-uuid",
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Task ID cannot be changed");
    });

    test("🚫 should fail when description is not a string", async () => {
      const reqBody = {
        description: 12345, // Not a string
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Description must be a string"
      );
    });

    test("✅ should pass when patching individual valid fields", async () => {
      const reqBody = {
        title: "Patched Title",
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });

    test("✅ should pass when patching multiple valid fields", async () => {
      const reqBody = {
        title: "Patched Title",
        description: "Patched description",
        priority: "HIGH",
        stageId: "7237003f-1fd1-44bf-917c-445144a125c0",
        assignedTo: "user-789",
        images: [
          "https://example.com/patched-image1.jpg",
          "https://example.com/patched-image2.jpg",
        ],
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchTaskValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });

  // DELETE TASK VALIDATION TESTS
  describe("deleteTaskValidation", () => {
    test("🚫 should fail when task ID is invalid", async () => {
      const reqParams = { id: "invalid-uuid" };
      const errors = await runValidatorRules(
        deleteTaskValidation,
        {},
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Invalid task ID format");
    });

    test("✅ should pass with valid task ID", async () => {
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        deleteTaskValidation,
        {},
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });

  // GET TASK BY ID VALIDATION TESTS
  describe("getTaskByIdValidation", () => {
    test("🚫 should fail when task ID is invalid", async () => {
      const reqParams = { id: "invalid-uuid" };
      const errors = await runValidatorRules(
        getTaskByIdValidation,
        {},
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Invalid task ID format");
    });

    test("✅ should pass with valid task ID", async () => {
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        getTaskByIdValidation,
        {},
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });
});
