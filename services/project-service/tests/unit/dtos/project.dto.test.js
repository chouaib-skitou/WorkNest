import { ProjectDTO } from "../../../dtos/project.dto.js";
import { StageDTO } from "../../../dtos/stage.dto.js";

describe("✅ ProjectDTO Tests", () => {
  const projectData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "WorkNest Platform",
    description: "A project management platform",
    image: "https://example.com/project-image.png",
    documents: ["https://example.com/doc1.pdf"],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "user-id-1",
    managerId: "manager-id-1",
    employeeIds: ["employee-1", "employee-2"],
    stages: [
      { id: "stage-1", name: "Stage 1" },
      { id: "stage-2", name: "Stage 2" },
    ], // ✅ Ensures `stages.map(...)` is covered
  };

  test("✅ Converts project object to DTO", () => {
    const dto = new ProjectDTO(projectData);

    expect(dto).toEqual({
      id: projectData.id,
      name: projectData.name,
      description: projectData.description,
      image: projectData.image,
      documents: projectData.documents,
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      createdBy: projectData.createdBy,
      managerId: projectData.managerId,
      employeeIds: projectData.employeeIds,
      stages: projectData.stages.map((stage) => new StageDTO(stage)), // ✅ Ensures StageDTO mapping
    });
  });

  test("✅ Handles missing stages property", () => {
    const dto = new ProjectDTO({ ...projectData, stages: undefined }); // ✅ Ensures empty array case

    expect(dto.stages).toEqual([]); // ✅ Ensures the default empty array behavior
  });

  test("✅ Handles empty documents array", () => {
    const dto = new ProjectDTO({ ...projectData, documents: undefined });

    expect(dto.documents).toEqual(undefined); // ✅ Ensures documents can be undefined
  });

  test("✅ Handles missing optional fields", () => {
    const minimalProjectData = {
      id: "456e7890-e12d-34a5-b678-910111213000",
      name: "Minimal Project",
      createdAt: new Date(),
      updatedAt: new Date(),
      stages: [],
    };

    const dto = new ProjectDTO(minimalProjectData);

    expect(dto).toEqual({
      id: minimalProjectData.id,
      name: minimalProjectData.name,
      description: undefined,
      image: undefined,
      documents: undefined,
      createdAt: minimalProjectData.createdAt,
      updatedAt: minimalProjectData.updatedAt,
      createdBy: undefined,
      managerId: undefined,
      employeeIds: undefined,
      stages: [],
    });
  });
});
