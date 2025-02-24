# 🚀 Project Module – User Stories & Test Scenarios

This document describes the main user stories, acceptance criteria, and test scenarios for the **Project** module. This module handles the creation, retrieval, updating (both full and partial), and deletion of projects with role‐based access control.

---

## Table of Contents

- [User Stories](#user-stories)
  - [1. View Projects](#1-view-projects)
  - [2. Create a Project](#2-create-a-project)
  - [3. Update a Project](#3-update-a-project)
  - [4. Delete a Project](#4-delete-a-project)
- [Test Scenarios](#test-scenarios)
  - [Service Layer Tests](#service-layer-tests)
  - [Controller Layer Tests](#controller-layer-tests)
- [How to Run Tests](#how-to-run-tests)
- [Conclusion](#conclusion)

---

## User Stories

### 1. View Projects :bar_chart:
- **As an Admin,** I want to view all projects with pagination, filters, and sorting so that I can manage the overall portfolio.
  - **Acceptance Criteria:**
    - Admins can view all projects.
    - Projects can be filtered by **name**, **description**, and **creation date**.
    - Projects can be sorted by **name**, **createdAt**, or **updatedAt**.
    - **Pagination:** If invalid values are provided, defaults to `page = 1` and `limit = 10`.

- **As an Employee,** I want to see only the projects assigned to me so that I access only relevant information.
  - **Acceptance Criteria:**
    - Employees see only projects where their ID is present in the `employeeIds` array.

- **As a Manager,** I want to view projects that I manage, have created, or where I am assigned so that I can update them if needed.
  - **Acceptance Criteria:**
    - Managers see projects where they are the manager, the creator, or are assigned as an employee.
    - **Update:** Only projects that I manage or that I created are available for update.
    - **Deletion:** Only projects that I **created** are available for deletion.

### 2. Create a Project :sparkles:
- **As an Admin or Manager,** I want to create a new project so that I can add new initiatives.
  - **Acceptance Criteria:**
    - Only Admins and Managers can create projects.
    - The project name is normalized to lowercase.
    - Duplicate project names are rejected with an appropriate error.

### 3. Update a Project :pencil2:
- **As an Admin or Manager,** I want to update an existing project so that I can change its details.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields; if the project name is provided, it is converted to lowercase.
    - **Partial Update (PATCH):** Updates only specified fields, filtering out undefined values and converting the name to lowercase if provided.
    - If no valid fields are provided for patching, a **400** error is returned.
    - Unauthorized updates return a **403** error.
    - If the project is not found, a **404** error is returned.
    - Duplicate project name errors return **409**, and generic errors return **500**.

### 4. Delete a Project :wastebasket:
- **As an Admin or Manager,** I want to delete a project so that I can remove projects that are no longer needed.
  - **Acceptance Criteria:**
    - Only Admins can delete any project, while Managers can delete **only projects they created**.
    - If the project is not found, a **404** error is returned.
    - Unauthorized deletion returns a **403** error.
    - Generic errors return **500**.

---

## Test Scenarios

### Service Layer Tests

#### getProjectsService
- **Success Cases:**
  - Returns projects successfully when projects exist.
  - Returns an empty result (with `totalCount = 0` and `totalPages = 0`) when no projects are found.
  - Applies the **name** filter correctly (case-insensitive search).
  - Applies the **description** filter correctly.
  - Applies a valid **createdAt** filter (projects within the specified day).
  - Uses provided sort options if valid; defaults to `"createdAt"` and `"desc"` if not.
  - **Pagination Defaults:**  
    - When `page` or `limit` are non-numeric or less than 1, defaults to `page = 1` and `limit = 10`.
    - When valid numeric values are provided (e.g., `page = 2, limit = 5`), those values are used.
- **Error Cases:**
  - If the error object has code `"P2025"`, the service rejects with **403**.
  - Generic errors (plain Error objects) are caught and rejected with **500**.

#### getProjectByIdService
- **Success Case:**
  - Returns the project (wrapped in a ProjectDTO) with its associated stages and tasks.
- **Error Cases:**
  - If no project is found by filters but exists in the DB, rejects with **403**.
  - If the project does not exist, rejects with **404**.
  - Generic errors result in a **500** rejection.

### Controller Layer Tests

For each controller endpoint (GET, POST, PUT, PATCH, DELETE):

- **Success Paths:**  
  - The controller calls the corresponding service method and responds with the expected status (e.g., 200, 201) and payload.

- **Error Handling:**  
  - When the service rejects with a custom error (i.e., with a `status`), the controller uses that status and error message.
  - When the service rejects with a plain Error (without a `status`), the controller falls back to **500** and uses the error’s message.

---

## How to Run Tests

- **Run All Tests:**  
  ```bash
  npm run test
  ```

- **Run a Specific Folder or Test:**
  ```bash
  npm run test ./tests/unit/controllers/project.controller.test.js
  ```

- **Run Tests with Coverage:**
  ```bash
  npm run test:coverage
  ```

---

## Conclusion

This documentation provides an overview of the user stories and detailed test scenarios for the Project module. It ensures that all branches in the service and controller logic are thoroughly covered, including:

- **Default Pagination Logic:**
  - If invalid values are provided, the service defaults to `page = 1` and `limit = 10`.

- **Role-Based Authorization:**
  - Only Admins and Managers (with specific restrictions) can create, update, and delete projects.
  - For deletion, Managers can delete only the projects they created.

- **Error Handling:**
  - Proper error responses are returned with status codes **403, 404, 409, or 500** as appropriate.

These test scenarios and user stories serve as a guide for future development and maintenance, ensuring the module's robustness and reliability.