import { TaskDTO } from "../../../dtos/task.dto.js";

describe("✅ TaskDTO Tests", () => {
  const taskData = {
    id: "task-123",
    title: "Fix authentication bug",
    description: "Resolve the login issue in the API",
    priority: "high",
    stageId: "stage-1",
    assignedTo: "developer-1",
    images: ["https://example.com/task-image.png"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("✅ Converts task object to DTO", () => {
    const dto = new TaskDTO(taskData);

    expect(dto).toEqual({
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      stageId: taskData.stageId,
      assignedTo: taskData.assignedTo,
      images: taskData.images,
      createdAt: taskData.createdAt,
      updatedAt: taskData.updatedAt,
    });
  });

  test("✅ Handles missing optional fields", () => {
    const minimalTaskData = {
      id: "task-456",
      title: "Minimal Task",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const dto = new TaskDTO(minimalTaskData);

    expect(dto).toEqual({
      id: minimalTaskData.id,
      title: minimalTaskData.title,
      description: undefined,
      priority: undefined,
      stageId: undefined,
      assignedTo: undefined,
      images: undefined,
      createdAt: minimalTaskData.createdAt,
      updatedAt: minimalTaskData.updatedAt,
    });
  });

  test("✅ Handles empty images array", () => {
    const dto = new TaskDTO({ ...taskData, images: undefined });

    expect(dto.images).toBeUndefined(); // ✅ Ensures images can be undefined
  });
});
