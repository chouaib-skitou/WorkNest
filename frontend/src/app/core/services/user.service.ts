import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment'; // Import environment variables

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserResponse {
  data: User[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private identityServiceUrl = environment.identityServiceUrl;

  constructor(private http: HttpClient) {}

  /**
   * Fetch all users from the backend with authorization.
   * @param page - Current page number.
   * @param limit - Number of users per page.
   * @returns {Observable<UserResponse>} - Returns paginated users.
   */
  getAllUsers(page: number = 1, limit: number = 10): Observable<UserResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    return this.http.get<UserResponse>(
      `${this.identityServiceUrl}/users?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );
  }
}
