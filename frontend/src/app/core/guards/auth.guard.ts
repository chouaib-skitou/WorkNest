import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    route: ActivatedRouteSnapshot,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // 1) Attempt to authorize on the backend.
    // 2) If the token is valid, 'authorize()' resolves, we return true => route is activated.
    // 3) If the token is invalid/expired => 'authorize()' in the service:
    //    - Clears localStorage
    //    - Navigates to /login
    //    - Throws an error
    // 4) We catch that error here and return 'false' to prevent route activation.
    return this.authService.authorize().pipe(
      map(() => true),
      catchError(() => {
        // The service has already navigated to /login, but we also return false
        // so Angular does not activate the route.
        return of(false);
      })
    );
  }
}
