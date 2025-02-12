import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-reset-password-request",
  templateUrl: "./reset-password-request.component.html",
  styleUrls: ["./reset-password-request.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule], // ✅ Added CommonModule
})
export class ResetPasswordRequestComponent {
  resetForm: FormGroup;
  message = "";
  isError = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
  ) {
    this.resetForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
    });
  }

  onSubmit() {
    if (this.resetForm.valid) {
      this.authService.resetPasswordRequest(this.resetForm.value.email).subscribe(
        () => {
          this.message = "Password reset link sent to your email.";
          this.isError = false;
        },
        (error) => {
          this.message = error.error.message || "Failed to send reset link. Please try again.";
          this.isError = true;
        },
      );
    }
  }
}
