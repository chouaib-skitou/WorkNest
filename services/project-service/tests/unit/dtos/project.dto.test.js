import { ProjectDTO } from "../../../dtos/project.dto.js";
import { StageDTO } from "../../../dtos/stage.dto.js";

describe("✅ ProjectDTO Tests", () => {
  // Use enriched user objects in test data
  const enrichedProjectData = {
    id: "123e4567-e89b-12d3-a456-426614174000",
    name: "WorkNest Platform",
    description: "A project management platform",
    image: "https://example.com/project-image.png",
    documents: ["https://example.com/doc1.pdf"],
    createdAt: new Date("2025-02-01T12:00:00.000Z"),
    updatedAt: new Date("2025-02-02T12:00:00.000Z"),
    createdBy: {
      id: "user-id-1",
      fullName: "Test Creator",
      role: "ROLE_ADMIN",
    },
    manager: {
      id: "manager-id-1",
      fullName: "Test Manager",
      role: "ROLE_MANAGER",
    },
    employees: [
      { id: "employee-1", fullName: "Test Employee 1", role: "ROLE_EMPLOYEE" },
      { id: "employee-2", fullName: "Test Employee 2", role: "ROLE_EMPLOYEE" },
    ],
    stages: [
      { id: "stage-1", name: "Stage 1" },
      { id: "stage-2", name: "Stage 2" },
    ],
  };

  test("✅ Converts enriched project object to ProjectDTO", () => {
    const dto = new ProjectDTO(enrichedProjectData);

    expect(dto).toEqual({
      id: enrichedProjectData.id,
      name: enrichedProjectData.name,
      description: enrichedProjectData.description,
      image: enrichedProjectData.image,
      documents: enrichedProjectData.documents,
      createdAt: enrichedProjectData.createdAt,
      updatedAt: enrichedProjectData.updatedAt,
      createdBy: enrichedProjectData.createdBy,
      manager: enrichedProjectData.manager,
      employees: enrichedProjectData.employees,
      stages: enrichedProjectData.stages.map((stage) => new StageDTO(stage)),
    });
  });

  test("✅ Handles missing stages property", () => {
    const input = { ...enrichedProjectData, stages: undefined };
    const dto = new ProjectDTO(input);

    expect(dto.stages).toEqual([]);
  });

  test("✅ Handles missing documents property", () => {
    const input = { ...enrichedProjectData, documents: undefined };
    const dto = new ProjectDTO(input);

    expect(dto.documents).toEqual(undefined);
  });

  test("✅ Handles missing optional fields", () => {
    const minimalProjectData = {
      id: "456e7890-e12d-34a5-b678-910111213000",
      name: "Minimal Project",
      createdAt: new Date("2025-02-01T12:00:00.000Z"),
      updatedAt: new Date("2025-02-01T12:00:00.000Z"),
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
      manager: undefined,
      employees: undefined,
      stages: [],
    });
  });
});
