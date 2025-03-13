import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { User } from '../../auth/interfaces/auth.interfaces';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    role: 'ROLE_USER',
    firstName: 'Test',
    lastName: 'User',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [AuthService],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate'); // Mock router navigation

    // Mock the access token for the tests
    localStorage.setItem('accessToken', 'mockAccessToken');
  });

  afterEach(() => {
    httpMock.verify(); // Ensures no outstanding HTTP requests
    localStorage.clear(); // Clean up localStorage after each test
  });

  it('should log in and store auth data', () => {
    const mockResponse = {
      accessToken: '123',
      refreshToken: '456',
      expiresIn: '3600',
      user: mockUser,
    };

    service.login('test@example.com', 'password').subscribe((response) => {
      expect(response).toEqual(mockResponse);
      expect(localStorage.getItem('accessToken')).toBe('123');
      expect(localStorage.getItem('refreshToken')).toBe('456');
    });

    const req = httpMock.expectOne(
      `${environment.identityServiceUrl}/auth/login`
    );
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should authorize user successfully', () => {
    service.authorize().subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne(
      `${environment.identityServiceUrl}/auth/authorize`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ user: mockUser });
  });

  it('should clear auth data and redirect on failed authorization', () => {
    service.authorize().subscribe({
      error: () => {
        // Once everything finishes, we expect localStorage to be cleared and a redirect
        expect(localStorage.getItem('accessToken')).toBeNull();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
      },
    });

    // 1) First request: /auth/authorize
    const req = httpMock.expectOne(
      `${environment.identityServiceUrl}/auth/authorize`
    );
    expect(req.request.method).toBe('GET');

    // Return 401 => triggers refresh logic
    req.flush({}, { status: 401, statusText: 'Unauthorized' });

    // 2) Because of 401, code calls /auth/refresh. Let’s handle that request too.
    const refreshReq = httpMock.expectOne(
      `${environment.identityServiceUrl}/auth/refresh`
    );
    expect(refreshReq.request.method).toBe('POST');

    // We want refresh to fail as well => that triggers the final logout & redirect
    refreshReq.flush({}, { status: 401, statusText: 'Unauthorized' });
  });
});
