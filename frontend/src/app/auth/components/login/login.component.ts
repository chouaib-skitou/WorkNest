import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  // Getter methods for easy access to form controls in the template
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }

  // Check if a field has a specific error
  hasError(control: AbstractControl | null, errorName: string): boolean {
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });

    if (this.loginForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';

      this.authService
        .login(this.loginForm.value.email, this.loginForm.value.password)
        .subscribe({
          next: () => {
            this.router.navigate(['/projects']);
          },
          error: (error: any) => {
            this.isSubmitting = false;
            
            // Use the error message from our improved error handler
            this.errorMessage = error.message || 'Login failed. Please try again.';
            
            // Focus on the email field for better UX
            const emailInput = document.getElementById('email') as HTMLInputElement;
            if (emailInput) {
              emailInput.focus();
            }
          }
        });
    }
  }
}
