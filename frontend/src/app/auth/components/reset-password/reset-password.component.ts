import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  isError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmNewPassword: ['', [Validators.required]],
    }, { validators: ResetPasswordComponent.passwordMatchValidator });
  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.token = params.get('token');
      console.log('Token:', this.token); // For debugging
    });
  }

  static passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmNewPassword');
    return password && confirmPassword && password.value === confirmPassword.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid) {
      const { newPassword, confirmNewPassword } = this.resetForm.value;
      if (this.token) {
        // If token exists, use it for password reset
        this.authService.resetPassword(this.token, newPassword, confirmNewPassword)
          .subscribe({
            next: () => {
              this.message = 'Password reset successful. You can now login with your new password.';
              this.isError = false;
            },
            error: (error) => {
              this.message = error.error?.message || 'Failed to reset password. Please try again.';
              this.isError = true;
            }
          });
      } else {
        // If no token, handle as a password change request
        this.message = 'No reset token provided. This might be a password change request.';
        this.isError = true;
        // Implement password change logic here if needed
      }
    }
  }
}
