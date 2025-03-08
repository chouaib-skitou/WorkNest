import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private projectServiceUrl = environment.projectServiceUrl; // e.g., 'http://localhost:3000/api/tasks'

  constructor(private http: HttpClient) {}

  partialUpdateTask(
    taskId: string | number,
    partialData: unknown
  ): Observable<unknown> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
    return this.http.patch(
      `${this.projectServiceUrl}/tasks/${taskId}`,
      partialData,
      { headers }
    );
  }
}
