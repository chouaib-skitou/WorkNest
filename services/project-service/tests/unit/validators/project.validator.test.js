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

  // Run each validator rule
  for (const rule of rules) {
    await rule.run(req);
  }

  // Use express-validator's validationResult to gather errors
  const result = validationResult(req);
  return result.array();
}

describe("Project Validator Tests (100% coverage)", () => {
  // CREATE PROJECT VALIDATION TESTS
  describe("createProjectValidation", () => {
    test("🚫 should fail when required fields are missing", async () => {
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

    test("🚫 should fail when dueDate format is incorrect", async () => {
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

    test("🚫 should fail when id is set manually", async () => {
      const reqBody = {
        id: "7237003f-1fd1-44bf-917c-445144a125c0",
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Cannot set Project ID manually");
    });

    test("🚫 should fail when createdBy is set manually", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        createdBy: "user-id"
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Cannot set createdBy manually");
    });

    test("🚫 should fail when invalid image URL is provided", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        image: "not-a-url"
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Image must be a valid URL");
    });

    test("🚫 should fail when invalid document URL is provided", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        documents: ["https://valid-url.com", "not-a-url"]
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Each document must be a valid URL");
    });

    test("🚫 should fail when employeeIds is not an array", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        employeeIds: "not-an-array"
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Employee IDs must be an array of user IDs");
    });

    test("🚫 should fail when employeeIds contains non-string values", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        employeeIds: ["valid-id", 12345]
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Each employee ID must be a string");
    });

    test("🚫 should fail when invalid status is provided", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        status: "INVALID_STATUS"
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Status must be one of: PENDING, IN_PROGRESS, COMPLETED");
    });

    test("🚫 should fail when invalid priority is provided", async () => {
      const reqBody = {
        name: "Test Project",
        description: "A test project",
        dueDate: "2025-03-04T00:00:00.000Z",
        priority: "CRITICAL" // Not in [LOW, MEDIUM, HIGH]
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.map((e) => e.msg)).toContain("Priority must be one of: LOW, MEDIUM, HIGH");
    });

    test("✅ should pass with valid data", async () => {
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

    test("✅ should pass with valid data including all optional fields", async () => {
      const reqBody = {
        name: "Chouaib Project",
        description: "A valid project",
        dueDate: "2025-03-04T00:00:00.000Z",
        status: "PENDING",
        priority: "MEDIUM",
        image: "https://example.com/image.jpg",
        documents: ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"],
        managerId: "manager-123",
        employeeIds: ["employee-1", "employee-2"]
      };
      const errors = await runValidatorRules(createProjectValidation, reqBody);
      expect(errors.length).toBe(0);
    });
  });

  // UPDATE PROJECT VALIDATION TESTS
  describe("updateProjectValidation", () => {
    test("🚫 should fail when required fields are missing", async () => {
      const reqBody = {};
      const reqParams = { id: "invalid-uuid" }; // Invalid ID
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      const messages = errors.map((e) => e.msg);
      expect(messages).toEqual(
        expect.arrayContaining([
          "Invalid Project ID format",
          "Project name is required",
          "Project description is required",
          "Due date is required"
        ])
      );
    });

    test("🚫 should fail when trying to change project ID", async () => {
      const reqBody = {
        id: "7237003f-1fd1-44bf-917c-445144a125c0",
        name: "Updated Project",
        description: "Updated description",
        dueDate: "2025-03-04T00:00:00.000Z"
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Project ID cannot be changed");
    });

    test("🚫 should fail when invalid image URL is provided", async () => {
      const reqBody = {
        name: "Updated Project",
        description: "Updated description",
        dueDate: "2025-03-04T00:00:00.000Z",
        image: "invalid-url"
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Image must be a valid URL");
    });

    // SPECIFICALLY COVER: throw new Error("Each document must be a valid URL"); in updateProjectValidation
    test("🚫 should fail when invalid document URL is provided", async () => {
      const reqBody = {
        name: "Updated Project",
        description: "Updated description",
        dueDate: "2025-03-04T00:00:00.000Z",
        documents: ["invalid-url"] // This should trigger the throw Error
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Each document must be a valid URL");
    });

    test("🚫 should fail when invalid priority is provided", async () => {
      const reqBody = {
        name: "Valid Project",
        description: "A valid description",
        dueDate: "2025-03-04T00:00:00.000Z",
        priority: "INVALID", // Not in [LOW, MEDIUM, HIGH]
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Priority must be one of: LOW, MEDIUM, HIGH"
      );
    });

    test("🚫 should fail when createdBy is set manually", async () => {
      const reqBody = {
        name: "Valid Project",
        description: "A valid description",
        dueDate: "2025-03-04T00:00:00.000Z",
        createdBy: "user-123"
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Cannot set createdBy manually");
    });

    test("✅ should pass with valid data", async () => {
      const reqBody = {
        name: "Updated Project",
        description: "An updated description",
        dueDate: "2025-03-04T00:00:00.000Z",
        status: "IN_PROGRESS",
        priority: "HIGH",
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });

    test("✅ should pass with valid data including document URLs", async () => {
      const reqBody = {
        name: "Updated Project",
        description: "An updated description",
        dueDate: "2025-03-04T00:00:00.000Z",
        status: "IN_PROGRESS",
        priority: "HIGH",
        documents: ["https://example.com/doc1.pdf", "https://example.com/doc2.pdf"]
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });

  // PATCH PROJECT VALIDATION TESTS
  describe("patchProjectValidation", () => {
    test("🚫 should fail when invalid status is provided", async () => {
      const reqBody = { status: "UNKNOWN" }; // Not in [PENDING, IN_PROGRESS, COMPLETED]
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Status must be one of: PENDING, IN_PROGRESS, COMPLETED"
      );
    });

    test("🚫 should fail when dueDate format is incorrect", async () => {
      const reqBody = { dueDate: "03-04-2025" }; // Invalid format
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain(
        "Due date must be in the format YYYY-MM-DDT00:00:00.000Z"
      );
    });

    test("🚫 should fail when trying to provide empty name", async () => {
      const reqBody = { name: "" };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Project name cannot be empty");
    });

    test("🚫 should fail when trying to provide empty description", async () => {
      const reqBody = { description: "" };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Project description cannot be empty");
    });

    // SPECIFICALLY COVER: throw new Error("Image must be a valid URL"); in patchProjectValidation
    test("🚫 should fail when invalid image URL is provided", async () => {
      const reqBody = {
        image: "not-a-valid-url" // This should trigger the throw Error
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Image must be a valid URL");
    });

    test("🚫 should fail when invalid document URL is provided", async () => {
      const reqBody = { documents: ["not-a-valid-url"] };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Each document must be a valid URL");
    });

    test("🚫 should fail when employeeIds is not an array", async () => {
      const reqBody = { employeeIds: "string-instead-of-array" };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Employee IDs must be an array of user IDs");
    });

    test("🚫 should fail when trying to change project ID", async () => {
      const reqBody = { id: "different-uuid" };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Project ID cannot be changed");
    });

    test("✅ should pass when valid fields are provided", async () => {
      const reqBody = { status: "COMPLETED" };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });

    test("✅ should pass when dueDate format is correct", async () => {
      const reqBody = { dueDate: "2025-03-04T00:00:00.000Z" }; // Correct format
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };

      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0); // No errors should be returned
    });

    // SPECIFICALLY COVER: body("documents.*") > return true; on patchProjectValidation
    test("✅ should pass with valid document URLs", async () => {
      const reqBody = {
        documents: ["https://example.com/valid-doc.pdf", "https://another.com/doc.pdf"]
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });

    test("✅ should pass when modifying multiple valid fields", async () => {
      const reqBody = {
        name: "Patched Project",
        description: "Partially updated description",
        priority: "LOW",
        status: "IN_PROGRESS",
        dueDate: "2025-03-04T00:00:00.000Z",
        image: "https://example.com/patched-image.jpg",
        employeeIds: ["employee-3", "employee-4"]
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        patchProjectValidation,
        reqBody,
        reqParams
      );
      expect(errors.length).toBe(0);
    });
  });

  // DELETE PROJECT VALIDATION TESTS
  describe("deleteProjectValidation", () => {
    test("🚫 should fail if ID is invalid", async () => {
      const reqParams = { id: "invalid-uuid" };
      const errors = await runValidatorRules(
        deleteProjectValidation,
        {},
        reqParams
      );
      expect(errors.map((e) => e.msg)).toContain("Invalid project ID format");
    });

    test("✅ should pass with valid ID", async () => {
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        deleteProjectValidation,
        {},
        reqParams
      );
      expect(errors.length).toBe(0);
    });

    test("✅ should pass with valid image URL in updateProjectValidation", async () => {
      const reqBody = {
        name: "Updated Project",
        description: "An updated description",
        dueDate: "2025-03-04T00:00:00.000Z",
        image: "https://example.com/valid-image.jpg" // This should trigger the return true path
      };
      const reqParams = { id: "7237003f-1fd1-44bf-917c-445144a125c0" };
      const errors = await runValidatorRules(
        updateProjectValidation,
        reqBody,
        reqParams
      );
      
      // No errors should be present
      expect(errors.length).toBe(0);
      
      // Make sure there's no error related to the image field
      const imageErrors = errors.filter(error => 
        error.path === 'image' || error.msg.includes('image')
      );
      expect(imageErrors.length).toBe(0);
    });
  });
});