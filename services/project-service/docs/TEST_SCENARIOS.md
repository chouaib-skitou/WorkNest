# 🚀 Project, Stage & Task Modules – User Stories & Test Scenarios

This document describes the main user stories, acceptance criteria, and test scenarios for the **Project**, **Stage**, and **Task** modules. All modules leverage role‐based access control and provide CRUD operations with validations, filters, and sorting.

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
- [Task Module](#task-module)
  - [User Stories](#user-stories-task)
    - [1. View Tasks](#1-view-tasks)
    - [2. Create a Task](#2-create-a-task)
    - [3. Update a Task](#3-update-a-task)
    - [4. Delete a Task](#4-delete-a-task)
  - [Test Scenarios](#test-scenarios-task)
    - [Service Layer Tests](#service-layer-tests-task)
    - [Controller Layer Tests](#controller-layer-tests-task)
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
    - Duplicate project names are rejected with an appropriate error (**409**).

#### 3. Update a Project

- **As an Admin or Manager,** I want to update an existing project so that I can change its details.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields; if the project name is provided, it is converted to lowercase.
    - **Partial Update (PATCH):** Updates only specified fields, ignoring undefined; name is lowercased if provided.
    - If no valid fields are provided for patching, a **400** error is returned.
    - Unauthorized updates return a **403**.
    - If the project is not found, return **404**.
    - Duplicate project name => **409**; generic => **500**.

#### 4. Delete a Project

- **As an Admin or Manager,** I want to delete a project so that I can remove projects that are no longer needed.
  - **Acceptance Criteria:**
    - Admin can delete any project; Manager can delete only projects they created.
    - If the project is not found => **404**.
    - Unauthorized => **403**.
    - Generic => **500**.

---

### Test Scenarios (Project)

#### Service Layer Tests (Project)

1. **`getProjectsService`**
   - **Success Cases:**
     - Returns projects successfully when projects exist.
     - Returns empty result when no projects found (`totalCount = 0`, `totalPages = 0`).
     - Applies **name**, **description**, **createdAt** filters (case-insensitive for `name`).
     - Sorts by `name`, `createdAt`, or `updatedAt`, defaults if invalid.
     - Pagination defaults to `(page=1, limit=10)` if invalid inputs.
   - **Error Cases:**
     - Prisma error code `"P2025"` => **403**.
     - Generic => **500**.

2. **`getProjectByIdService`**
   - **Success Case:** Returns the project (with stages/tasks) as a `ProjectDTO`.
   - **Error Cases:**
     - Project found but user lacks permission => **403**.
     - Project not found => **404**.
     - Generic => **500**.

3. **`createProjectService`**
   - **Success Case:** Admin/Manager creates project; name is lowercased; returns `ProjectDTO`.
   - **Error Cases:**
     - Non-Admin/Manager => **403**.
     - Duplicate name => **409**.
     - Generic => **500**.

4. **`updateProjectService`** / **`patchProjectService`**
   - **Success Cases:**
     - Updates project fully or partially, returns `ProjectDTO`.
     - Name is lowercased if present.
   - **Error Cases:**
     - No valid patch fields => **400**.
     - Unauthorized => **403**.
     - Not found => **404**.
     - Duplicate => **409**.
     - Generic => **500**.

5. **`deleteProjectService`**
   - **Success Case:** Admin can delete any; Manager can delete if they created it.
   - **Error Cases:**
     - Not found => **404**.
     - Unauthorized => **403**.
     - Generic => **500**.

#### Controller Layer Tests (Project)

- **Success Paths:**
  - Controllers respond with **200** (GET), **201** (POST), or **200** (PUT/PATCH/DELETE) on valid service responses.
- **Error Handling:**
  - For custom errors (`{ status, message }`), the controller uses that status.
  - For plain `Error` objects, the controller uses **500**.

---

## Stage Module

### User Stories (Stage)

#### 1. View Stages

- **As an Admin,** I want to view all stages (with optional filters, pagination, and sorting) so that I can see progress across all projects.
  - **Acceptance Criteria:**
    - Admin sees all stages.
    - Filters by **name**, **position**, **color**, **projectId**.
    - Sorts by **name**, **position**, **createdAt**, or **updatedAt** (some modules default to certain fields if none provided).
    - Pagination => defaults `(page=1, limit=10)` if invalid.

- **As a Manager,** I want to view only the stages of projects that I manage, created, or am assigned to.
  - **Acceptance Criteria:**
    - Manager sees stages from any project where `managerId`, `createdBy`, or `employeeIds` includes them.
    - Sorting and pagination function like Admin’s.

- **As an Employee,** I want to see only stages from the projects in which I’m assigned so that I can track tasks relevant to me.
  - **Acceptance Criteria:**
    - Employee sees only stages for assigned projects.

#### 2. Create a Stage

- **As an Admin or Manager,** I want to create a new stage for a project so that workflow steps can be defined.
  - **Acceptance Criteria:**
    - Only Admins/Managers can create.
    - Name is lowercased.
    - Duplicate name => **409**.

#### 3. Update a Stage

- **As an Admin or Manager,** I want to update an existing stage so that I can rename it, reorder it, change its color, etc.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields; name is lowercased if present.
    - **Partial Update (PATCH):** Only specified fields updated; name is lowercased if present.
    - No valid patch fields => **400**.
    - Unauthorized => **403**.
    - Not found => **404**.
    - Duplicate => **409**.
    - Generic => **500**.

#### 4. Delete a Stage

- **As an Admin or Manager,** I want to delete a stage so that I can remove unneeded workflow steps.
  - **Acceptance Criteria:**
    - Admin can delete any stage.
    - Manager can delete only if they created the project.
    - Not found => **404**.
    - Unauthorized => **403**.
    - Generic => **500**.

---

### Test Scenarios (Stage)

#### Service Layer Tests (Stage)

1. **`getStagesService`**
   - **Success Cases:**
     - Returns stages successfully with tasks included.
     - Filters by name, position, color, projectId.
     - Role-based filter: Admin sees all, Manager sees managed/created/assigned, Employee sees assigned.
     - Sorting by name, position, etc., default if invalid.
     - Pagination defaults `(page=1, limit=10)` if invalid.
   - **Error Cases:**
     - Prisma `"P2025"` => **403**.
     - Generic => **500**.

2. **`getStageByIdService`**
   - **Success:** returns stage (and tasks) if user has permission.
   - **Error:**
     - If user lacks permission => **403**.
     - Not found => **404**.
     - Generic => **500**.

3. **`createStageService`**
   - **Success:** Admin/Manager can create, name is lowercased => returns `StageDTO`.
   - **Error:**
     - Employee => **403**.
     - Duplicate => **409**.
     - Generic => **500**.

4. **`updateStageService`** / **`patchStageService`**
   - **Success:** updates stage fully/partially; name lowercased if present; partial with no fields => **400**.
   - **Error:**  
     - Unauthorized => **403**.  
     - Not found => **404**.  
     - Duplicate => **409**.  
     - Generic => **500**.

5. **`deleteStageService`**
   - **Success:** Admin can delete any, Manager only if they created the project.
   - **Error:**
     - Not found => **404**.
     - Unauthorized => **403**.
     - Generic => **500**.

#### Controller Layer Tests (Stage)

- **Success Paths:**
  - Responds with **200** (GET, PUT, PATCH, DELETE) or **201** (POST) plus JSON data.
- **Error Handling:**
  - Custom errors => matching status code.
  - Plain `Error` => **500**.

---

## Task Module

### User Stories (Task)

#### 1. View Tasks

- **As an Admin,** I want to view all tasks (with optional filters, sorting, pagination) so that I can oversee the entire system.
  - **Acceptance Criteria:**
    - Admin can see all tasks.
    - Filters by **title**, **priority**, **stageId**, **projectId**.
    - Sorting by **title**, **createdAt**, or **updatedAt**.
    - Pagination defaults `(page=1, limit=10)` if invalid.

- **As a Manager,** I want to view only tasks in projects I manage, created, or am assigned to so that I can update them as needed.
  - **Acceptance Criteria:**
    - Manager sees tasks where the project’s `managerId`, `createdBy`, or `employeeIds` includes them.
    - Sorting/pagination function similarly to Admin.

- **As an Employee,** I want to see tasks in projects where I am assigned so that I can focus on my work.
  - **Acceptance Criteria:**
    - Employee sees only tasks for assigned projects.

#### 2. Create a Task

- **As an Admin or Manager,** I want to create a new task so that I can add items to a stage.
  - **Acceptance Criteria:**
    - Only Admins/Managers can create.
    - Task title is lowercased.
    - If a task with this title already exists in the project => **409**.
    - Priority must be one of LOW, MEDIUM, HIGH.

#### 3. Update a Task

- **As an Admin or Manager,** I want to update an existing task so that I can rename it, change its priority, or reassign it.
  - **Acceptance Criteria:**
    - **Full Update (PUT):** Replaces all fields; title is lowercased if present.
    - **Partial Update (PATCH):** Only specified fields changed. Title is lowercased if present.
    - If no valid patch fields => **400**.
    - Unauthorized => **403**.
    - Task not found => **404**.
    - Duplicate => **409**.
    - Generic => **500**.

- **(Special Manager Case)** If the manager is only in `employeeIds` (and not the project’s manager or creator), they may only update `stageId` via PATCH.  
- **(Employee)** can only patch the `stageId` if that is the only field.

#### 4. Delete a Task

- **As an Admin or Manager,** I want to delete tasks that are no longer necessary.
  - **Acceptance Criteria:**
    - Admin can delete any task.
    - Manager can delete only if they **created** the associated project.
    - Task not found => **404**.
    - Unauthorized => **403**.
    - Generic => **500**.

---

### Test Scenarios (Task)

#### Service Layer Tests (Task)

1. **`getTasksService`**
   - **Success Cases:**
     - Returns tasks successfully (with optional filtering by title, priority, stageId, projectId).
     - Role-based filter: Admin sees all, Manager sees tasks in projects they manage/created/are assigned to, Employee sees tasks in assigned projects.
     - Sorting by `title`, `createdAt`, or `updatedAt`; default if invalid.
     - Pagination defaults `(page=1, limit=10)` if invalid inputs.
   - **Error Cases:**
     - Prisma `"P2025"` => **403**.
     - Generic => **500**.

2. **`getTaskByIdService`**
   - **Success:** returns task (with stage/project) if user has permission.
   - **Error:**
     - If user lacks permission => **403**.
     - Not found => **404**.
     - Generic => **500**.

3. **`createTaskService`**
   - **Success:** Admin/Manager can create, title is lowercased => returns `TaskDTO`.
   - **Error:**
     - Employee => **403**.
     - Duplicate => **409**.
     - Generic => **500**.

4. **`updateTaskService`** / **`patchTaskService`**
   - **Success:** updates the task fully or partially (name is lowercased if present).  
   - **Error:**  
     - No valid patch fields => **400**.  
     - Unauthorized => **403** (e.g., manager is not the project’s manager/creator, or employee attempts full update).  
     - Task not found => **404**.  
     - Duplicate => **409**.  
     - Generic => **500**.

5. **`deleteTaskService`**
   - **Success:** Admin can delete any task; Manager only if they created the project.
   - **Error:**
     - Not found => **404**.
     - Unauthorized => **403**.
     - Generic => **500**.

#### Controller Layer Tests (Task)

- **Success Paths:**
  - Returns **200** (GET, PUT, PATCH, DELETE) or **201** (POST) with JSON data from the service.
- **Error Handling:**
  - Custom errors `{ status, message }` => use `status`.
  - Plain `Error` => **500** fallback.

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

This documentation provides comprehensive user stories and test scenarios for both the Project, Stage and Task modules. It outlines:

- **Role-Based Access Control** for Admin, Manager, and Employee roles.
- **CRUD Operations** with robust checks for duplicates, invalid data, unauthorized access, and pagination defaults.
- **Error Handling** with clear status codes (**400, 403, 404, 409, 500**).
- **Testing Strategies** covering both the service layer and controller layer, ensuring coverage of success paths and error paths alike.

By following these guidelines, teams can maintain consistent behaviors, reduce regressions, and streamline development for both modules.


