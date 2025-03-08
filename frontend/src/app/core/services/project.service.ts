import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Update the Project interface to match the backend response
export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: {
    id: string;
    fullName: string;
    role: string;
  };
  // New properties coming from the backend:
  status: 'In Progress' | 'Completed' | 'On Hold';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string; // or Date if you convert it
  assignee: string;
  // Optionally, if you have additional properties like manager, employees, stages, etc.
  manager?: {
    id: string;
    fullName: string;
    role: string;
  };
  employees?: {
    id: string;
    fullName: string;
    role: string;
  }[];
  stages?: Record<string, unknown>[];
}

interface ProjectResponse {
  data: Project[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private projectServiceUrl = environment.projectServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all projects from the backend.
   * @param page - Current page number.
   * @param limit - Number of projects per page.
   * @returns {Observable<ProjectResponse>} - Returns paginated projects.
   */
  getAllProjects(page = 1, limit = 6): Observable<ProjectResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.get<ProjectResponse>(
      `${this.projectServiceUrl}/projects?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
  }

  /**
   * Fetch a single project by its ID.
   * @param projectId - The ID of the project to retrieve.
   * @returns {Observable<Project>} - Returns the project data.
   */
  getOneById(projectId: string): Observable<Project> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.get<Project>(
      `${this.projectServiceUrl}/projects/${projectId}`,
      {
        headers,
      }
    );
  }

  /**
   * Create a new project.
   * @param projectData - The project data to be created.
   * @returns {Observable<Project>} - Returns the created project.
   */
  addProject(projectData: Partial<Project>): Observable<Project> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    return this.http.post<Project>(
      `${this.projectServiceUrl}/projects`,
      projectData,
      {
        headers,
      }
    );
  }

  /**
   * Update an existing project.
   * @param projectId - The ID of the project to update.
   * @param projectData - The updated project data.
   * @returns {Observable<Project>} - Returns the updated project.
   */
  updateProject(
    projectId: string,
    projectData: Partial<Project>
  ): Observable<Project> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    return this.http.put<Project>(
      `${this.projectServiceUrl}/projects/${projectId}`,
      projectData,
      {
        headers,
      }
    );
  }

  /**
   * Partially update an existing project.
   * @param projectId - The ID of the project to update.
   * @param partialData - The partial data to update.
   * @returns {Observable<Project>} - Returns the updated project.
   */
  partialUpdateProject(
    projectId: string,
    partialData: Partial<Project>
  ): Observable<Project> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    return this.http.patch<Project>(
      `${this.projectServiceUrl}/projects/${projectId}`,
      partialData,
      {
        headers,
      }
    );
  }

  /**
   * Delete an existing project.
   * @param projectId - The ID of the project to delete.
   * @returns {Observable<void>} - Returns an observable indicating the operation success.
   */
  deleteProject(projectId: string): Observable<void> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.delete<void>(
      `${this.projectServiceUrl}/projects/${projectId}`,
      {
        headers,
      }
    );
  }
}
