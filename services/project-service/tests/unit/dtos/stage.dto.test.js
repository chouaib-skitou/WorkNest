import { StageDTO } from "../../../dtos/stage.dto.js";
import { TaskDTO } from "../../../dtos/task.dto.js";

describe("✅ StageDTO Tests", () => {
  const stageData = {
    id: "stage-1",
    name: "To Do",
    position: 1,
    color: "#FF5733",
    projectId: "project-123",
    tasks: [
      { id: "task-1", title: "Fix bug" },
      { id: "task-2", title: "Implement feature" },
    ], // ✅ Ensures `tasks.map(...)` is covered
  };

  test("✅ Converts stage object to DTO", () => {
    const dto = new StageDTO(stageData);

    expect(dto).toEqual({
      id: stageData.id,
      name: stageData.name,
      position: stageData.position,
      color: stageData.color,
      projectId: stageData.projectId,
      tasks: stageData.tasks.map((task) => new TaskDTO(task)), // ✅ Ensures TaskDTO mapping
    });
  });

  test("✅ Handles missing tasks property", () => {
    const dto = new StageDTO({ ...stageData, tasks: undefined }); // ✅ Ensures empty array case

    expect(dto.tasks).toEqual([]); // ✅ Ensures the default empty array behavior
  });

  test("✅ Handles missing optional fields", () => {
    const minimalStageData = {
      id: "stage-2",
      name: "Minimal Stage",
      position: 2,
    };

    const dto = new StageDTO(minimalStageData);

    expect(dto).toEqual({
      id: minimalStageData.id,
      name: minimalStageData.name,
      position: minimalStageData.position,
      color: undefined,
      projectId: undefined,
      tasks: [],
    });
  });
});
