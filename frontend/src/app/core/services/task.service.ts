// core/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}
export interface TaskUser {
  id: string;
  fullName: string;
  role: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  stageId: string;
  projectId: string;
  assignedTo?: TaskUser | null;
  images?: string[];
  type?: 'Draft' | 'Bug' | 'Feature' | 'Task';
  estimate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskCreateUpdate {
  title: string;
  description?: string;
  priority?: TaskPriority;
  stageId: string;
  projectId: string;
  assignedTo?: string;
  images?: File[];
  type?: 'Draft' | 'Bug' | 'Feature' | 'Task';
  estimate?: number;
  [key: string]: unknown; // Changed 'any' to 'unknown' for better type safety
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private projectServiceUrl = environment.projectServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all tasks for a project
   */
  getTasksByProject(projectId: string): Observable<Task[]> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<Task[]>(
      `${this.projectServiceUrl}/projects/${projectId}/tasks`,
      { headers }
    );
  }

  /**
   * Get a single task by ID
   */
  getTaskById(taskId: string): Observable<Task> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.get<Task>(`${this.projectServiceUrl}/tasks/${taskId}`, {
      headers,
    });
  }

  /**
   * Create a new task
   */
  createTask(taskData: TaskCreateUpdate): Observable<Task> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    // Check if we have images to upload
    const hasImages = taskData.images && taskData.images.length > 0;

    if (hasImages) {
      // Use FormData for file uploads
      const formData = new FormData();

      // Add required fields explicitly
      formData.append('title', taskData.title);
      formData.append('stageId', taskData.stageId);
      formData.append('projectId', taskData.projectId);

      // Add optional fields if they exist
      if (taskData.description) {
        formData.append('description', taskData.description);
      }

      if (taskData.priority) {
        formData.append('priority', taskData.priority);
      }

      if (taskData.assignedTo) {
        formData.append('assignedTo', taskData.assignedTo);
      }

      // Removed type and estimate fields as requested

      // Add images - we know images exists here because hasImages is true
      if (taskData.images) {
        taskData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      console.log('Sending task data with images:', {
        title: taskData.title,
        stageId: taskData.stageId,
        projectId: taskData.projectId,
        priority: taskData.priority,
        imageCount: taskData.images ? taskData.images.length : 0,
      });

      return this.http.post<Task>(`${this.projectServiceUrl}/tasks`, formData, {
        headers,
      });
    } else {
      // Use JSON for requests without files
      console.log('Sending task data without images:', taskData);

      const jsonHeaders = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      });

      // Create a simplified payload without type and estimate
      const simplifiedPayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        stageId: taskData.stageId,
        projectId: taskData.projectId,
        assignedTo: taskData.assignedTo,
        // Removed type and estimate fields as requested
      };

      return this.http.post<Task>(
        `${this.projectServiceUrl}/tasks`,
        simplifiedPayload,
        { headers: jsonHeaders }
      );
    }
  }

  /**
   * Update a task
   */
  updateTask(taskId: string, taskData: TaskCreateUpdate): Observable<Task> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    // Check if we have images to upload
    const hasImages = taskData.images && taskData.images.length > 0;

    if (hasImages) {
      // Use FormData for file uploads
      const formData = new FormData();

      // Add required fields explicitly
      formData.append('title', taskData.title);
      formData.append('stageId', taskData.stageId);
      formData.append('projectId', taskData.projectId);

      // Add optional fields if they exist
      if (taskData.description) {
        formData.append('description', taskData.description);
      }

      if (taskData.priority) {
        formData.append('priority', taskData.priority);
      }

      if (taskData.assignedTo) {
        formData.append('assignedTo', taskData.assignedTo);
      }

      // Removed type and estimate fields as requested

      // Add images - we know images exists here because hasImages is true
      if (taskData.images) {
        taskData.images.forEach((image) => {
          formData.append('images', image);
        });
      }

      return this.http.put<Task>(
        `${this.projectServiceUrl}/tasks/${taskId}`,
        formData,
        { headers }
      );
    } else {
      // Use JSON for requests without files
      const jsonHeaders = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      });

      // Create a simplified payload without type and estimate
      const simplifiedPayload = {
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        stageId: taskData.stageId,
        projectId: taskData.projectId,
        assignedTo: taskData.assignedTo,
        // Removed type and estimate fields as requested
      };

      return this.http.put<Task>(
        `${this.projectServiceUrl}/tasks/${taskId}`,
        simplifiedPayload,
        { headers: jsonHeaders }
      );
    }
  }

  /**
   * Partially update a task
   */
  partialUpdateTask(
    taskId: string,
    partialData: Partial<Task>
  ): Observable<Task> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    // Remove type and estimate from partial updates if they exist
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { type, estimate, ...cleanedData } = partialData;

    return this.http.patch<Task>(
      `${this.projectServiceUrl}/tasks/${taskId}`,
      cleanedData,
      { headers }
    );
  }

  /**
   * Move a task to a different stage
   */
  moveTaskToStage(taskId: string, stageId: string): Observable<Task> {
    return this.partialUpdateTask(taskId, { stageId });
  }

  /**
   * Delete a task
   */
  deleteTask(taskId: string): Observable<void> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
    return this.http.delete<void>(`${this.projectServiceUrl}/tasks/${taskId}`, {
      headers,
    });
  }
}
