import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registerForm: FormGroup;
  message = '';
  errorMessages: string[] = [];
  isError = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required]],
        lastName: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator }
    );
  }

  // Getter methods for easy access to form controls
  get firstName() { return this.registerForm.get('firstName'); }
  get lastName() { return this.registerForm.get('lastName'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }

  // Check if a field has a specific error
  hasError(control: AbstractControl | null, errorName: string): boolean {
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }

  // Check if the form has a password mismatch error
  hasPasswordMismatch(): boolean {
    const confirmPasswordTouched = !!this.registerForm.get('confirmPassword')?.touched;
    const passwordTouched = !!this.registerForm.get('password')?.touched;
    return !!this.registerForm.hasError('mismatch') && 
           confirmPasswordTouched &&
           passwordTouched;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });

    if (this.registerForm.valid) {
      this.isSubmitting = true;
      this.message = '';
      this.errorMessages = [];
      this.isError = false;

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.router.navigate(['/login'], {
            queryParams: { registered: 'true' },
          });
        },
        error: (error: any) => {
          this.isSubmitting = false;
          this.isError = true;
          
          // Handle array of error messages
          if (error.originalError?.error?.errors && Array.isArray(error.originalError.error.errors)) {
            this.errorMessages = error.originalError.error.errors.map((err: any) => err.message);
          } else {
            this.message = error.message || 'Registration failed. Please try again.';
          }
          
          // Focus on the password field if there are password-related errors
          if (this.errorMessages.some(msg => msg.toLowerCase().includes('password'))) {
            const passwordInput = document.getElementById('password') as HTMLInputElement;
            if (passwordInput) {
              passwordInput.focus();
            }
          }
        }
      });
    }
  }
}
