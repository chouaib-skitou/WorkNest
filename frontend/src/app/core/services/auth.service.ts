import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, BehaviorSubject } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = "http://localhost:3000/api/auth"; // Replace with your actual API URL
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(JSON.parse(localStorage.getItem("currentUser") || "null"));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((user) => {
        localStorage.setItem("currentUser", JSON.stringify(user));
        this.currentUserSubject.next(user);
      }),
    );
  }

  logout() {
    localStorage.removeItem("currentUser");
    this.currentUserSubject.next(null);
  }

  verifyEmail(userId: string, token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/verify-email/${userId}/${token}`);
  }

  resetPasswordRequest(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password-request`, { email });
  }

  resetPassword(token: string, newPassword: string, confirmNewPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/${token}`, { newPassword, confirmNewPassword });
  }

  refreshToken(): Observable<any> {
    const refreshToken = this.currentUserValue?.refreshToken;
    return this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((tokens) => {
        const updatedUser = { ...this.currentUserValue, ...tokens };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
      }),
    );
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }
}
