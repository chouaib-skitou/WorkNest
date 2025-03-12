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
  images?: string[];
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

    // Use JSON headers for all requests since we're only sending URLs
    const jsonHeaders = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    // Check if we have images
    const hasImages = taskData.images && taskData.images.length > 0;

    // Create a complete payload that includes images if present
    const completePayload: Record<string, unknown> = {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      stageId: taskData.stageId,
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo,
    };

    // Add images to the payload if they exist
    if (hasImages && taskData.images) {
      console.log('Sending task data with image URLs:', {
        title: taskData.title,
        imageCount: taskData.images.length,
        firstImageUrl: taskData.images[0]?.substring(0, 50) + '...', // Log truncated URL for debugging with optional chaining
      });

      completePayload['images'] = taskData.images;
    } else {
      console.log('Sending task data without images:', {
        title: taskData.title,
        description:
          typeof completePayload['description'] === 'string'
            ? (completePayload['description'] as string).substring(0, 30) +
              '...'
            : 'No description',
      });
    }

    return this.http.post<Task>(
      `${this.projectServiceUrl}/tasks`,
      completePayload,
      { headers: jsonHeaders }
    );
  }

  /**
   * Update a task
   */
  updateTask(taskId: string, taskData: TaskCreateUpdate): Observable<Task> {
    const accessToken = localStorage.getItem('accessToken');

    // Use JSON headers for all requests since we're only sending URLs
    const jsonHeaders = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    // Check if we have images
    const hasImages = taskData.images && taskData.images.length > 0;

    // Create a complete payload that includes images if present
    const completePayload: Record<string, unknown> = {
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority,
      stageId: taskData.stageId,
      projectId: taskData.projectId,
      assignedTo: taskData.assignedTo,
    };

    // Add images to the payload if they exist
    if (hasImages && taskData.images) {
      console.log('Updating task with image URLs:', {
        taskId,
        title: taskData.title,
        imageCount: taskData.images.length,
        firstImageUrl: taskData.images[0]?.substring(0, 50) + '...', // Log truncated URL for debugging with optional chaining
      });

      completePayload['images'] = taskData.images;
    } else {
      console.log('Updating task without images:', {
        taskId,
        title: taskData.title,
      });
    }

    return this.http.put<Task>(
      `${this.projectServiceUrl}/tasks/${taskId}`,
      completePayload,
      { headers: jsonHeaders }
    );
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
