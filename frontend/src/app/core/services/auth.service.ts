import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

// Define interfaces for expected responses
interface User {
  id: string;
  email: string;
  token: string;
  refreshToken: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth'; // Replace with your actual API URL
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  register(userData: Partial<User>): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap((response) => {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  verifyEmail(userId: string, token: string): Observable<{ success: boolean }> {
    return this.http.get<{ success: boolean }>(
      `${this.apiUrl}/verify-email/${userId}/${token}`
    );
  }

  resetPasswordRequest(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password-request`,
      { email }
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
    confirmNewPassword: string
  ): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.apiUrl}/reset-password/${token}`,
      {
        newPassword,
        confirmNewPassword,
      }
    );
  }

  refreshToken(): Observable<{ token: string; refreshToken: string }> {
    const refreshToken = this.currentUserValue?.refreshToken;
    return this.http
      .post<{
        token: string;
        refreshToken: string;
      }>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(
        tap((tokens) => {
          if (this.currentUserValue) {
            const updatedUser = { ...this.currentUserValue, ...tokens };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
          }
        })
      );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }
}
