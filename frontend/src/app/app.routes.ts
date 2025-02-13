import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { ResetPasswordRequestComponent } from './auth/components/reset-password-request/reset-password-request.component';
import { ResetPasswordComponent } from './auth/components/reset-password/reset-password.component';
import { ProjectsComponent } from './projects/projects.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password-request', component: ResetPasswordRequestComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] }, // ✅ Protected
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' },
];

export const appConfig = {
  providers: [provideRouter(routes)],
};
