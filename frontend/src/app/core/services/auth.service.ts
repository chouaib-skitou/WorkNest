import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, switchMap  } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment'; // Import environment variables
import { LoginResponse, User } from '../../auth/interfaces/auth.interfaces'; // Import interfaces
import { Router } from '@angular/router';
import { FlashMessageService } from '../services/flash-message.service';

interface AuthorizeResponse {
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Base API URL for authentication endpoints */
  private identityServiceUrl = environment.identityServiceUrl;

  /**
   * Tracks whether the user is authenticated.
   * Uses a BehaviorSubject to allow real-time updates across the application.
   */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(
    this.hasToken()
  );
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  /**
   * Tracks the current user data.
   * Uses a BehaviorSubject to update components when the user data changes.
   */
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.getStoredUser()
  );
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private flashMessageService: FlashMessageService
  ) {}

  /**
   * Checks if a valid access token exists in localStorage.
   * @returns {boolean} True if an access token is present, otherwise false.
   */
  private hasToken(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Registers a new user with email and password.
   * @param userData - Object containing `email` and `password`.
   * @returns {Observable<{ message: string }>} Observable resolving to a success message.
   */
  register(userData: {
    email: string;
    password: string;
  }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.identityServiceUrl}/auth/register`,
      userData
    );
  }

  /**
   * Logs in a user with email and password.
   * @param email - User's email.
   * @param password - User's password.
   * @returns {Observable<LoginResponse>} Observable resolving to login response containing tokens and user info.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.identityServiceUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          this.storeAuthData(response);
          this.isAuthenticatedSubject.next(true);
          this.currentUserSubject.next(response.user);
        })
      );
  }

  /**
   * Logs out the user by clearing tokens and user data from localStorage.
   */
  logout(): void {
    this.clearAuthData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);
  }

  /**
   * Refreshes the user's access token using the stored refresh token.
   * @returns {Observable<LoginResponse>} Observable resolving to the new tokens and user info.
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http
      .post<LoginResponse>(`${this.identityServiceUrl}/auth/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((tokens) => {
          this.storeAuthData(tokens);
        })
      );
  }

  /**
   * Checks if the user is currently authenticated.
   * @returns {boolean} True if authenticated, otherwise false.
   */
  isLoggedIn(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Authorizes the user by checking their role against the server.
   * If the token is invalid, we attempt to refresh it once.
   * @returns {Observable<User>}
   */
  authorize(): Observable<User> {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      this.logoutAndRedirect();
      return throwError(() => new Error('No access token found'));
    }
  
    const headers = new HttpHeaders({ Authorization: `Bearer ${accessToken}` });
    const authorizeUrl = `${this.identityServiceUrl}/auth/authorize`;
  
    return this.http.get<AuthorizeResponse>(authorizeUrl, { headers }).pipe(
      catchError((error) => {
        if (
          error.status === 401 ||
          error.status === 403 ||
          error.status === 400
        ) {
          return this.refreshToken().pipe(
            switchMap(() => {
              const newAccessToken = localStorage.getItem('accessToken');
              if (!newAccessToken) {
                this.logoutAndRedirect('Session expired. Please log in again.');
                return throwError(() => new Error('No new access token found after refresh.'));
              }
  
              const retryHeaders = new HttpHeaders({
                Authorization: `Bearer ${newAccessToken}`,
              });
  
              return this.http.get<AuthorizeResponse>(authorizeUrl, { headers: retryHeaders });
            }),
            catchError((refreshErr) => {
              this.logoutAndRedirect('Session expired. Please log in again.');
              return throwError(() => refreshErr);
            })
          );
        }
  
        // If none of these statuses, rethrow
        return throwError(() => error);
      }),
      tap((response: AuthorizeResponse) => {
        this.currentUserSubject.next(response.user);
      }),
      map((response: AuthorizeResponse) => response.user)
    );
  }
  

  // Optional convenience method to keep code DRY
  private logoutAndRedirect(message?: string): void {
    // Clear tokens & user
    this.clearAuthData();
    this.isAuthenticatedSubject.next(false);
    this.currentUserSubject.next(null);

    // Show flash message if provided
    if (message) {
      this.flashMessageService.showError(message);
    }

    // Redirect to login
    this.router.navigate(['/login']);
  }

  /**
   * Checks if the user has the Admin role
   * @returns {Observable<boolean>} Observable resolving to true if user is admin
   */
  isAdmin(): Observable<boolean> {
    return this.authorize().pipe(
      map((user) => user.role === 'ROLE_ADMIN'),
      catchError(() => of(false))
    );
  }

  /**
   * Checks if the user has the Manager role
   * @returns {Observable<boolean>} Observable resolving to true if user is manager or admin
   */
  isManager(): Observable<boolean> {
    return this.authorize().pipe(
      map((user) => user.role === 'ROLE_MANAGER' || user.role === 'ROLE_ADMIN'),
      catchError(() => of(false))
    );
  }

  /**
   * Stores authentication tokens and user data in localStorage.
   * @param response - The login response containing user info, `accessToken`, `refreshToken`, and `expiresIn`.
   */
  private storeAuthData(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('expiresIn', response.expiresIn);
    localStorage.setItem('user', JSON.stringify(response.user)); // Store user details
  }

  /**
   * Retrieves the stored user data from localStorage.
   * @returns {User | null} The stored user object or null if not found.
   */
  private getStoredUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Clears authentication tokens and user data from localStorage.
   */
  private clearAuthData(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('user');
  }

  /**
   * Returns the currently authenticated user.
   * @returns {User | null} The user object if logged in, otherwise null.
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Requests a password reset for the given email.
   * @param email - The email address of the user requesting a password reset.
   * @returns {Observable<{ message: string }>} Observable resolving to a success message.
   */
  resetPasswordRequest(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.identityServiceUrl}/auth/reset-password-request`,
      { email }
    );
  }

  /**
   * Resets the user's password using a provided reset token.
   * @param token - The password reset token.
   * @param newPassword - The new password.
   * @param confirmNewPassword - Confirmation of the new password.
   * @returns {Observable<{ success: boolean }>} Observable resolving to success status.
   */
  resetPassword(
    token: string,
    newPassword: string,
    confirmNewPassword: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.identityServiceUrl}/auth/reset-password/${token}`,
      {
        newPassword,
        confirmNewPassword,
      }
    );
  }
}
