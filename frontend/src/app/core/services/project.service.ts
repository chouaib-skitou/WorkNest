import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Import environment variables

export interface Project {
  id: string;
  name: string;
  image?: string | null;
  createdAt: string;
  createdBy?: {
    id: string;
    fullName: string;
    role: string;
  };
  manager?: {
    id: string;
    fullName: string;
    role: string;
  };
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
  getAllProjects(page: number = 1, limit: number = 6): Observable<ProjectResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.get<ProjectResponse>(`${this.projectServiceUrl}/projects?page=${page}&limit=${limit}`, {
      headers,
    });
  }
}
