export class TaskDTO {
  constructor(task) {
    this.id = task.id;
    this.title = task.title;
    this.description = task.description;
    this.priority = task.priority;
    this.stageId = task.stageId;
    this.projectId = task.projectId;
    this.assignedTo = task.assignedTo;
    this.images = task.images;
    this.createdAt = task.createdAt;
    this.updatedAt = task.updatedAt;
  }
}
