import { Routes } from '@angular/router';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { ResetPasswordRequestComponent } from './auth/components/reset-password-request/reset-password-request.component';
import { ResetPasswordComponent } from './auth/components/reset-password/reset-password.component';
import { ProjectsComponent } from './projects/projects.component';
import { AuthGuard } from './core/guards/auth.guard';
import { HomeComponent } from './home/home.component';
import { ProjectShowComponent } from './project-show/project-show.component';
import { ProfileComponent } from './profile/profile.component';
import { UsersComponent } from './users/users.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'reset-password-request', component: ResetPasswordRequestComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'reset-password/:token', component: ResetPasswordComponent },

  // Protected: user must have a valid token
  { path: 'profiles', component: ProjectsComponent, canActivate: [AuthGuard] },
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] },
  {
    path: 'projects/:id',
    component: ProjectShowComponent,
    canActivate: [AuthGuard],
  },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'users', component: UsersComponent, canActivate: [AuthGuard] },

  // Fallback for any unrecognized route
  { path: '**', redirectTo: '/login' },
];

export const appConfig = {
  providers: [provideRouter(routes)],
};
