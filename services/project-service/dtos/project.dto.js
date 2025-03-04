import { StageDTO } from "./stage.dto.js";

export class ProjectDTO {
  constructor(project) {
    this.id = project.id;
    this.name = project.name;
    this.description = project.description;
    this.image = project.image;
    this.documents = project.documents;
    this.createdAt = project.createdAt;
    this.updatedAt = project.updatedAt;
    this.createdBy = project.createdBy;
    this.manager = project.manager;
    this.employees = project.employees;
    this.stages = project.stages
      ? project.stages.map((stage) => new StageDTO(stage))
      : [];
    this.dueDate = project.dueDate;
    this.status = project.status;
    this.priority = project.priority;
  }
}

export class GetAllProjectsDTO {
  constructor(project) {
    this.id = project.id;
    this.name = project.name;
    this.image = project.image;
    this.createdAt = project.createdAt;
    this.createdBy = project.createdBy;
    this.manager = project.manager;
    this.dueDate = project.dueDate;
    this.status = project.status;
    this.priority = project.priority;
  }
}
