// core/services/stage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task } from './task.service';

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  projectId: string;
  tasks: Task[];
}

export interface StageCreateUpdate {
  name: string;
  position: number;
  color: string;
  projectId: string;
}

@Injectable({
  providedIn: 'root',
})
export class StageService {
  private projectServiceUrl = environment.projectServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all stages for a project
   */
  getStagesByProject(projectId: string): Observable<Stage[]> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<Stage[]>(
      `${this.projectServiceUrl}/projects/${projectId}/stages`,
      { headers }
    );
  }

  /**
   * Get a single stage by ID
   */
  getStageById(stageId: string): Observable<Stage> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<Stage>(`${this.projectServiceUrl}/stages/${stageId}`, {
      headers,
    });
  }

  /**
   * Create a new stage
   */
  createStage(stageData: StageCreateUpdate): Observable<Stage> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http.post<Stage>(
      `${this.projectServiceUrl}/stages`,
      stageData,
      { headers }
    );
  }

  /**
   * Update a stage
   */
  updateStage(
    stageId: string,
    stageData: Partial<StageCreateUpdate>
  ): Observable<Stage> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http.patch<Stage>(
      `${this.projectServiceUrl}/stages/${stageId}`,
      stageData,
      { headers }
    );
  }

  /**
   * Partially update a stage
   */
  partialUpdateStage(
    stageId: string,
    partialData: Partial<StageCreateUpdate>
  ): Observable<Stage> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http.patch<Stage>(
      `${this.projectServiceUrl}/stages/${stageId}`,
      partialData,
      { headers }
    );
  }

  /**
   * Delete a stage
   */
  deleteStage(stageId: string): Observable<void> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.delete<void>(
      `${this.projectServiceUrl}/stages/${stageId}`,
      { headers }
    );
  }
}
