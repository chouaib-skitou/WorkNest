import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password-request',
  templateUrl: './reset-password-request.component.html',
  styleUrls: ['./reset-password-request.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class ResetPasswordRequestComponent {
  resetForm: FormGroup;
  message = '';
  isError = false;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  // Getter for easy access to form control
  get email() { return this.resetForm.get('email'); }

  // Check if a field has a specific error
  hasError(control: AbstractControl | null, errorName: string): boolean {
    return control ? control.hasError(errorName) && (control.dirty || control.touched) : false;
  }

  onSubmit() {
    // Mark fields as touched to trigger validation
    Object.keys(this.resetForm.controls).forEach(key => {
      const control = this.resetForm.get(key);
      control?.markAsTouched();
    });

    if (this.resetForm.valid) {
      this.isSubmitting = true;
      this.message = '';
      this.isError = false;

      this.authService
        .resetPasswordRequest(this.resetForm.value.email)
        .subscribe({
          next: (response) => {
            this.isSubmitting = false;
            this.message = response.message || 'Password reset link sent to your email.';
            this.isError = false;
            this.resetForm.reset();
          },
          error: (error: any) => {
            this.isSubmitting = false;
            this.message = error.message || 'Failed to send reset link. Please try again.';
            this.isError = true;
            
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