import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token: string | null = null;
  message = '';
  errorMessages: string[] = [];
  isError = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ['', [Validators.required]],
      },
      { validators: ResetPasswordComponent.passwordMatchValidator }
    );
  }

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.token = params.get('token');
      console.log('Token:', this.token); // For debugging
    });
  }

  // Getter methods for easy access to form controls
  get newPassword() {
    return this.resetForm.get('newPassword');
  }
  get confirmNewPassword() {
    return this.resetForm.get('confirmNewPassword');
  }

  // Check if a field has a specific error
  hasError(control: AbstractControl | null, errorName: string): boolean {
    return control
      ? control.hasError(errorName) && (control.dirty || control.touched)
      : false;
  }

  // Check if the form has a password mismatch error
  hasPasswordMismatch(): boolean {
    const confirmPasswordTouched =
      !!this.resetForm.get('confirmNewPassword')?.touched;
    const newPasswordTouched = !!this.resetForm.get('newPassword')?.touched;
    return (
      !!this.resetForm.hasError('mismatch') &&
      confirmPasswordTouched &&
      newPasswordTouched
    );
  }

  static passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmNewPassword');
    return password &&
      confirmPassword &&
      password.value === confirmPassword.value
      ? null
      : { mismatch: true };
  }

  onSubmit() {
    // Mark all fields as touched to trigger validation
    Object.keys(this.resetForm.controls).forEach((key) => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });

    if (this.resetForm.valid) {
      this.isSubmitting = true;
      this.message = '';
      this.errorMessages = [];
      this.isError = false;

      const { newPassword, confirmNewPassword } = this.resetForm.value;
      if (this.token) {
        // If token exists, use it for password reset
        this.authService
          .resetPassword(this.token, newPassword, confirmNewPassword)
          .subscribe({
            next: () => {
              this.isSubmitting = false;
              this.message =
                'Password reset successful. You can now login with your new password.';
              this.isError = false;
              this.resetForm.reset();

              // Redirect to login page after a short delay to show the success message
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 2000); // 2 seconds delay
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            error: (error: any) => {
              this.isSubmitting = false;
              this.isError = true;

              // Handle array of error messages
              if (
                error.originalError?.error?.errors &&
                Array.isArray(error.originalError.error.errors)
              ) {
                this.errorMessages = error.originalError.error.errors.map(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (err: any) => err.message
                );
              } else {
                this.message =
                  error.message ||
                  'Failed to reset password. Please try again.';
              }

              // Focus on the password field for better UX
              const passwordInput = document.getElementById(
                'newPassword'
              ) as HTMLInputElement;
              if (passwordInput) {
                passwordInput.focus();
              }
            },
          });
      } else {
        // If no token, handle as a password change request
        this.isSubmitting = false;
        this.message =
          'No reset token provided. This might be a password change request.';
        this.isError = true;
        // Implement password change logic here if needed
      }
    }
  }
}
