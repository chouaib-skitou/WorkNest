import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component'; // ✅ Ensure correct import

export const routes: Routes = [
  { path: 'login', component: LoginComponent }, // ✅ Route for login page
  { path: '', redirectTo: '/login', pathMatch: 'full' } // ✅ Redirect to login by default
];

export const appConfig = {
  providers: [provideRouter(routes)]
};
