import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  fullName?: string; // Added for convenience
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
   * Fetch all users from the backend with optional search and role filtering.
   * @param page - Current page number.
   * @param limit - Number of users per page.
   * @param searchTerm - Search text to filter on firstName, lastName, and email.
   * @param roleFilter - Role to filter users.
   * @returns {Observable<UserResponse>} - Returns paginated users.
   */
  getAllUsers(
    page = 1,
    limit = 10,
    searchTerm?: string,
    roleFilter?: string
  ): Observable<UserResponse> {
    const accessToken = localStorage.getItem('accessToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    // Construct URL with base pagination parameters.
    let url = `${this.identityServiceUrl}/users?page=${page}&limit=${limit}`;

    // If search term is provided, add it for firstName, lastName, and email.
    if (searchTerm && searchTerm.trim() !== '') {
      const encodedTerm = encodeURIComponent(searchTerm.trim());
      url += `&firstName=${encodedTerm}&lastName=${encodedTerm}&email=${encodedTerm}`;
    }

    // If a role filter is selected (other than 'ALL'), add it.
    if (roleFilter && roleFilter !== 'ALL') {
      url += `&role=${encodeURIComponent(roleFilter)}`;
    }

    return this.http.get<UserResponse>(url, { headers });
  }

  /**
   * Get all managers for project assignment
   * @param limit - Number of managers to fetch (default: 100)
   * @returns {Observable<UserResponse>} - Returns managers
   */
  getManagers(limit = 100): Observable<UserResponse> {
    return this.getAllUsers(1, limit, undefined, 'ROLE_MANAGER');
  }

  /**
   * Get all employees for project assignment
   * @param limit - Number of employees to fetch (default: 100)
   * @returns {Observable<UserResponse>} - Returns employees
   */
  getEmployees(limit = 100): Observable<UserResponse> {
    return this.getAllUsers(1, limit, undefined, 'ROLE_EMPLOYEE');
  }

  /**
   * Format user's full name
   * @param user - User object
   * @returns {string} - Formatted full name
   */
  formatFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
