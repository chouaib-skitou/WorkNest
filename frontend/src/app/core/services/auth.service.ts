import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginResponse } from '../../auth/interfaces/auth.interfaces'; // Import interface

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  /** Base API URL for authentication endpoints */
  private apiUrl = 'http://localhost:5000/api/auth';

  /**
   * Tracks whether the user is authenticated.
   * Uses a BehaviorSubject to allow real-time updates across the application.
   */
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());

  /** Observable to allow components to react to authentication state changes */
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {}

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
  register(userData: { email: string; password: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/register`, userData);
  }

  /**
   * Logs in a user with email and password.
   * @param email - User's email.
   * @param password - User's password.
   * @returns {Observable<LoginResponse>} Observable resolving to login response containing tokens.
   */
  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response) => {
        this.storeTokens(response);
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  /**
   * Logs out the user by clearing tokens from localStorage and updating authentication state.
   */
  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Refreshes the user's access token using the stored refresh token.
   * @returns {Observable<LoginResponse>} Observable resolving to the new tokens.
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((tokens) => {
        this.storeTokens(tokens);
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
   * Stores authentication tokens in localStorage.
   * @param response - The login response containing `accessToken`, `refreshToken`, and `expiresIn`.
   */
  private storeTokens(response: LoginResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('expiresIn', response.expiresIn);
  }

  /**
   * Clears authentication tokens from localStorage.
   */
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('expiresIn');
  }

  /**
   * Requests a password reset for the given email.
   * @param email - The email address of the user requesting a password reset.
   * @returns {Observable<{ message: string }>} Observable resolving to a success message.
   */
  resetPasswordRequest(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password-request`, { email });
  }

  /**
   * Resets the user's password using a provided reset token.
   * @param token - The password reset token.
   * @param newPassword - The new password.
   * @param confirmNewPassword - Confirmation of the new password.
   * @returns {Observable<{ success: boolean }>} Observable resolving to success status.
   */
  resetPassword(token: string, newPassword: string, confirmNewPassword: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.apiUrl}/reset-password/${token}`, {
      newPassword,
      confirmNewPassword,
    });
  }
}
