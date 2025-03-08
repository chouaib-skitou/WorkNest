import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Updated Status and Priority enums to match the API
export enum Status {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// User interface for createdBy and manager
export interface User {
  id: string;
  fullName: string;
  role: string;
}

// Updated Project interface to match the backend response
export interface Project {
  id: string;
  name: string;
  description?: string;
  image?: string | null;
  createdAt: string;
  updatedAt?: string;
  createdBy?: User;
  status: Status;
  priority: Priority;
  dueDate: string;
  manager?: User;
  employees?: User[];
  stages?: Record<string, unknown>[];
}

export interface ProjectResponse {
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
   * Fetch all projects from the backend with pagination and optional filters.
   * @param page - Current page number.
   * @param limit - Number of projects per page.
   * @param filters - Optional filters (name, status, priority).
   * @returns {Observable<ProjectResponse>} - Returns paginated projects.
   */
  getAllProjects(
    page = 1,
    limit = 6,
    filters: { name?: string; status?: Status; priority?: Priority } = {}
  ): Observable<ProjectResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    let query = `?page=${page}&limit=${limit}`;
    if (filters.name) {
      query += `&name=${encodeURIComponent(filters.name)}`;
    }
    if (filters.status) {
      query += `&status=${encodeURIComponent(filters.status)}`;
    }
    if (filters.priority) {
      query += `&priority=${encodeURIComponent(filters.priority)}`;
    }

    return this.http.get<ProjectResponse>(
      `${this.projectServiceUrl}/projects${query}`,
      { headers }
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
      { headers }
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
      { headers }
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
      { headers }
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
      { headers }
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
      { headers }
    );
  }
}