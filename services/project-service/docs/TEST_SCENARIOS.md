# 🚀 Project & Stage Modules – User Stories & Test Scenarios

This document describes the main user stories, acceptance criteria, and test scenarios for the **Project** and **Stage** modules. Both modules leverage role‐based access control and provide CRUD operations with validations, filters, and sorting.

---

## Table of Contents

- [Project Module](#project-module)
  - [User Stories](#user-stories-project)
    - [1. View Projects](#1-view-projects)
    - [2. Create a Project](#2-create-a-project)
    - [3. Update a Project](#3-update-a-project)
    - [4. Delete a Project](#4-delete-a-project)
  - [Test Scenarios](#test-scenarios-project)
    - [Service Layer Tests](#service-layer-tests-project)
    - [Controller Layer Tests](#controller-layer-tests-project)
- [Stage Module](#stage-module)
  - [User Stories](#user-stories-stage)
    - [1. View Stages](#1-view-stages)
    - [2. Create a Stage](#2-create-a-stage)
    - [3. Update a Stage](#3-update-a-stage)
    - [4. Delete a Stage](#4-delete-a-stage)
  - [Test Scenarios](#test-scenarios-stage)
    - [Service Layer Tests](#service-layer-tests-stage)
    - [Controller Layer Tests](#controller-layer-tests-stage)
- [How to Run Tests](#how-to-run-tests)
- [Conclusion](#conclusion)

---

## Project Module

### User Stories (Project)

#### 1. View Projects

- **As an Admin,** I want to view all projects with pagination, filters, and sorting so that I can manage the overall portfolio.
  - **Acceptance Criteria:**
    - Admins can view all projects.
    - Projects can be filtered by **name**, **description**, and **creation date**.
    - Projects can be sorted by **name**, **createdAt**, or **updatedAt**.
    - **Pagination:** If invalid values are provided, defaults to `page = 1` and `limit = 10`.

- **As an Employee,** I want to see only the projects assigned to me so that I access only relevant information.
  - **Acceptance Criteria:**
    - Employees see only projects where their ID is present in the `employeeIds` array.

- **As a Manager,** I want to view projects that I manage, have created, or where I am assigned so that I can update or delete them if needed (with restrictions).
  - **Acceptance Criteria:**
    - Managers see projects where they are the manager, the creator, or are assigned as an employee.
    - **Update:** Only projects that I manage or that I created are available for update.
    - **Deletion:** Only projects that I **created** are available for deletion.

#### 2. Create a Project

- **As an Admin or Manager,** I want to create a new project so that I can add new initiatives.
  - **Acceptance Criteria:**
    - Only Admins and Managers can create projects.
    - The project name is normalized to lowercase.
    - Duplicate project names are rejected with an appropriate error (e.g., **409**).

#### 3. Update a Project

- **As an Admin or Manager,** I want to update an existing project so that I can change its details.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields; if the project name is provided, it is converted to lowercase.
    - **Partial Update (PATCH):** Updates only specified fields, filtering out undefined values and converting the name to lowercase if provided.
    - If no valid fields are provided for patching, a **400** error is returned.
    - Unauthorized updates return a **403** error.
    - If the project is not found, a **404** error is returned.
    - Duplicate project name errors return **409**, and generic errors return **500**.

#### 4. Delete a Project

- **As an Admin or Manager,** I want to delete a project so that I can remove projects that are no longer needed.
  - **Acceptance Criteria:**
    - Only Admins can delete any project, while Managers can delete **only projects they created**.
    - If the project is not found, a **404** error is returned.
    - Unauthorized deletion returns a **403** error.
    - Generic errors return **500**.

---

### Test Scenarios (Project)

#### Service Layer Tests (Project)

1. **`getProjectsService`**
   - **Success Cases:**
     - Returns projects successfully when projects exist.
     - Returns empty result when no projects found (`totalCount = 0`, `totalPages = 0`).
     - Applies the **name** filter (case-insensitive).
     - Applies the **description** filter.
     - Applies **createdAt** filter to get projects within a specific day.
     - Sorts properly or defaults to `createdAt desc` if invalid sort is provided.
     - Pagination defaults to `page = 1` and `limit = 10` for invalid inputs; uses provided page/limit if valid.
   - **Error Cases:**
     - If Prisma error code is `"P2025"`, reject with **403**.
     - All other errors reject with **500**.

2. **`getProjectByIdService`**
   - **Success Case:** Returns the project (with its stages and tasks) as a `ProjectDTO`.
   - **Error Cases:**
     - If the user doesn't have permission but the project exists, reject with **403**.
     - If the project is not found in the database, reject with **404**.
     - Generic errors => **500**.

3. **`createProjectService`**
   - **Success Case:** Admin or Manager creates a project; name is lowercased; returns a `ProjectDTO`.
   - **Error Cases:**
     - If user is not Admin/Manager => **403**.
     - Duplicate name => **409**.
     - Generic => **500**.

4. **`updateProjectService`** / **`patchProjectService`**
   - **Success Cases:**
     - Full update or partial update successfully modifies and returns a `ProjectDTO`.
     - Name, if present, is lowercased.
   - **Error Cases:**
     - No valid fields for patch => **400**.
     - Unauthorized => **403**.
     - Not found => **404**.
     - Duplicate name => **409**.
     - Generic => **500**.

5. **`deleteProjectService`**
   - **Success Case:** Admin can delete any project; Manager can delete only projects they created.
   - **Error Cases:**
     - Not found => **404**.
     - Unauthorized => **403**.
     - Generic => **500**.

#### Controller Layer Tests (Project)

- **Success Paths:**  
  - Controller responds with **200** (GET), **201** (POST), or **200** (PUT/PATCH/DELETE) on valid service responses.
- **Error Handling:**  
  - For custom errors with a `status` field, uses that status and error message.
  - For plain `Error` objects, uses **500** as fallback.

---

## Stage Module

### User Stories (Stage)

#### 1. View Stages

- **As an Admin,** I want to view all stages (with optional filters, pagination, and sorting) so that I can see progress across all projects.
  - **Acceptance Criteria:**
    - Admins can see all stages.
    - Can filter stages by **name**, **position**, **color** (hex code), and **projectId**.
    - Can sort by **name**, **position**, **createdAt**, or **updatedAt**.
    - Pagination defaults to `page = 1` and `limit = 10` if invalid values are provided.

- **As a Manager,** I want to view only the stages of projects that I manage, created, or am assigned to so that I can update them if needed.
  - **Acceptance Criteria:**
    - Managers can see stages belonging to any project where `managerId` or `createdBy` is the Manager’s ID, or the manager is assigned as an employee.
    - Sorting and pagination function the same as for Admin.

- **As an Employee,** I only want to see stages that belong to projects in which I am an assigned employee so that I can track relevant tasks.
  - **Acceptance Criteria:**
    - Employees see only stages from their assigned projects.

#### 2. Create a Stage

- **As an Admin or Manager,** I want to create a new stage for a project so that the workflow can be defined.
  - **Acceptance Criteria:**
    - Only Admins and Managers can create stages.
    - Stage name is lowercased.
    - If a stage with the same name already exists for the same project, reject with **409**.
    - Color must be a valid hex code.

#### 3. Update a Stage

- **As an Admin or Manager,** I want to update an existing stage so that I can rename it, reorder it, or change its color.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields (name is lowercased if present).
    - **Partial Update (PATCH):** Only specified fields are changed, ignoring undefined. Name is lowercased if present.
    - If no valid fields are provided (PATCH), return **400**.
    - Unauthorized => **403**.
    - Stage not found => **404**.
    - Duplicate name => **409**.
    - Generic => **500**.

#### 4. Delete a Stage

- **As an Admin or Manager,** I want to delete a stage so that I can remove unnecessary workflow steps.
  - **Acceptance Criteria:**
    - Admin can delete any stage.
    - Manager can delete a stage only if they **created** the associated project.
    - Not found => **404**.
    - Unauthorized => **403**.
    - Generic => **500**.

---

### Test Scenarios (Stage)

#### Service Layer Tests (Stage)

1. **`getStagesService`**
   - **Success Cases:**
     - Returns stages successfully (includes tasks if required).
     - Filters by **name**, **position**, **color**, and **projectId**.
     - Applies role-based filters:
       - Admin sees all.
       - Manager sees only stages from managed/created/assigned projects.
       - Employee sees only stages from assigned projects.
     - Sorting by **allowed fields** or default to `createdAt desc`.
     - Pagination defaults to `(page=1, limit=10)` if invalid.
   - **Error Cases:**
     - If error code is `"P2025"`, reject with **403**.
     - Generic => **500**.

2. **`getStageByIdService`**
   - **Success Cases:**
     - Returns the stage and its tasks if the user has access.
   - **Error Cases:**
     - If the user doesn’t have permission but the stage exists => **403**.
     - Stage not found => **404**.
     - Generic => **500**.

3. **`createStageService`**
   - **Success Case:** Admin/Manager creates a stage (name lowercased). Returns a `StageDTO`.
   - **Error Cases:**
     - Employee attempts to create => **403**.
     - Duplicate name => **409**.
     - Generic => **500**.

4. **`updateStageService`** / **`patchStageService`**
   - **Success Cases:**
     - Updates the stage fully or partially. Name is lowercased if present.
     - If partial update has no valid fields => **400**.
   - **Error Cases:**
     - Unauthorized => **403** (manager does not match project).
     - Stage not found => **404**.
     - Duplicate name => **409**.
     - Generic => **500**.

5. **`deleteStageService`**
   - **Success Case:** Admin can delete any stage; Manager can delete if they created the project.
   - **Error Cases:**
     - Stage not found => **404**.
     - Unauthorized => **403**.
     - Generic => **500**.

#### Controller Layer Tests (Stage)

- **Success Paths:**  
  - Controller calls the corresponding service and responds with 200 (for GET, PUT, PATCH, DELETE) or 201 (for POST) plus the JSON data.
- **Error Handling:**  
  - If the service returns a custom `{ status: ..., message: ... }`, the controller uses that status.  
  - If the service throws a plain Error, the controller uses 500.

---

## How to Run Tests

```bash
# Run all tests
npm run test

# Run a specific test file
npm run test ./tests/unit/services/project.service.test.js

# Run tests with coverage
npm run test:coverage
```

---

## Conclusion

This documentation provides comprehensive user stories and test scenarios for both the Project and Stage modules. It outlines:

- **Role-Based Access Control** for Admin, Manager, and Employee roles.
- **CRUD Operations** with robust checks for duplicates, invalid data, unauthorized access, and pagination defaults.
- **Error Handling** with clear status codes (**400, 403, 404, 409, 500**).
- **Testing Strategies** covering both the service layer and controller layer, ensuring coverage of success paths and error paths alike.

By following these guidelines, teams can maintain consistent behaviors, reduce regressions, and streamline development for both modules.
