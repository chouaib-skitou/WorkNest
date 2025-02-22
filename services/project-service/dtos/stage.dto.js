import { TaskDTO } from "./task.dto.js";

export class StageDTO {
  constructor(stage) {
    this.id = stage.id;
    this.name = stage.name;
    this.position = stage.position;
    this.color = stage.color;
    this.projectId = stage.projectId;
    this.tasks = stage.tasks
      ? stage.tasks.map((task) => new TaskDTO(task))
      : [];
  }
}
