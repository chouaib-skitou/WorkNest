import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { LoginResponse } from '../../interfaces/auth.interfaces';

// ✅ Updated mock response to match `LoginResponse`
const mockLoginResponse: LoginResponse = {
  accessToken: 'fake-access-token',
  refreshToken: 'fake-refresh-token',
  expiresIn: '3600',
};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the login form', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.controls['email']).toBeDefined();
    expect(component.loginForm.controls['password']).toBeDefined();
  });

  it('should invalidate the form when empty', () => {
    component.loginForm.setValue({ email: '', password: '' });
    expect(component.loginForm.valid).toBeFalse();
  });

  it('should validate the form when email and password are provided', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(component.loginForm.valid).toBeTrue();
  });

  it('should call AuthService login method when form is valid', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    // ✅ Corrected to use `mockLoginResponse`
    authService.login.and.returnValue(of(mockLoginResponse));

    component.onSubmit();

    expect(authService.login).toHaveBeenCalledWith(
      'test@example.com',
      'password123'
    );
  });

  it('should navigate to /projects on successful login', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    // ✅ Corrected to use `mockLoginResponse`
    authService.login.and.returnValue(of(mockLoginResponse));

    component.onSubmit();

    expect(router.navigate).toHaveBeenCalledWith(['/projects']);
  });

  it('should display an error message on login failure', () => {
    const errorResponse = { error: { message: 'Invalid credentials' } };
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.login.and.returnValue(throwError(() => errorResponse));

    component.onSubmit();

    expect(component.errorMessage).toBe('Invalid credentials');
  });

  it('should display a default error message if login error has no message', () => {
    component.loginForm.setValue({
      email: 'test@example.com',
      password: 'password123',
    });

    authService.login.and.returnValue(throwError(() => ({ error: {} })));

    component.onSubmit();

    expect(component.errorMessage).toBe('Login failed. Please try again.');
  });
});
