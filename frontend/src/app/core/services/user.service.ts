import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

export interface UserResponse {
  data: User[];
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'ROLE_EMPLOYEE' | 'ROLE_MANAGER' | 'ROLE_ADMIN';
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private identityServiceUrl = environment.identityServiceUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const accessToken = localStorage.getItem('accessToken');
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });
  }

  /**
   * Fetch all users from the backend with optional search and role filtering.
   * @param page - Current page number.
   * @param limit - Number of users per page.
   * @param searchTerm - Search text to filter on email.
   * @param roleFilter - Role to filter users.
   * @returns {Observable<UserResponse>} - Returns paginated users.
   */
  getAllUsers(
    page = 1,
    limit = 10,
    searchTerm?: string,
    roleFilter?: string
  ): Observable<UserResponse> {
    const headers = this.getHeaders();
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    // If search term is provided, add it for email only
    if (searchTerm && searchTerm.trim() !== '') {
      params = params.set('email', searchTerm.trim());
    }

    // If a role filter is selected (other than 'ALL'), add it
    if (roleFilter && roleFilter !== 'ALL') {
      params = params.set('role', roleFilter);
    }

    return this.http.get<UserResponse>(`${this.identityServiceUrl}/users`, { 
      headers, 
      params 
    });
  }

  /**
   * Get a single user by ID
   * @param userId - User ID
   * @returns {Observable<User>} - Returns user details
   */
  getUserById(userId: string): Observable<User> {
    const headers = this.getHeaders();
    return this.http.get<User>(`${this.identityServiceUrl}/users/${userId}`, { headers });
  }

  /**
   * Create a new user
   * @param userData - User data for creation
   * @returns {Observable<User>} - Returns created user
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    const headers = this.getHeaders();
    return this.http.post<User>(`${this.identityServiceUrl}/users`, userData, { headers });
  }

  /**
   * Update a user (full update)
   * @param userId - User ID
   * @param userData - Updated user data
   * @returns {Observable<User>} - Returns updated user
   */
  updateUser(userId: string, userData: UpdateUserRequest): Observable<User> {
    const headers = this.getHeaders();
    return this.http.put<User>(`${this.identityServiceUrl}/users/${userId}`, userData, { headers });
  }

  /**
   * Partially update a user
   * @param userId - User ID
   * @param userData - Partial user data
   * @returns {Observable<User>} - Returns updated user
   */
  patchUser(userId: string, userData: Partial<UpdateUserRequest>): Observable<User> {
    const headers = this.getHeaders();
    return this.http.patch<User>(`${this.identityServiceUrl}/users/${userId}`, userData, { headers });
  }

  /**
   * Delete a user
   * @param userId - User ID
   * @returns {Observable<any>} - Returns deletion confirmation
   */
  deleteUser(userId: string): Observable<unknown> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.identityServiceUrl}/users/${userId}`, { headers });
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