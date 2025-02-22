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
    this.managerId = project.managerId;
    this.employeeIds = project.employeeIds;
    this.stages = project.stages
      ? project.stages.map((stage) => new StageDTO(stage))
      : [];
  }
}
