import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthService } from "../../../core/services/auth.service";

@Component({
  selector: "app-reset-password",
  templateUrl: "./reset-password.component.html",
  styleUrls: ["./reset-password.component.scss"],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  token = "";
  message = "";
  isError = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    this.resetForm = this.fb.group(
      {
        newPassword: ["", [Validators.required, Validators.minLength(8)]],
        confirmNewPassword: ["", [Validators.required]],
      },
      { validator: this.passwordMatchValidator },
    );
  }

  ngOnInit() {
    this.token = this.route.snapshot.params["token"];
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get("newPassword");
    const confirmPassword = form.get("confirmNewPassword");
    return password && confirmPassword && password.value === confirmPassword.value ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.resetForm.valid) {
      const { newPassword, confirmNewPassword } = this.resetForm.value;
      this.authService.resetPassword(this.token, newPassword, confirmNewPassword).subscribe(
        () => {
          this.message = "Password reset successful. Redirecting to login...";
          this.isError = false;
          setTimeout(() => this.router.navigate(["/login"]), 3000);
        },
        (error) => {
          this.message = error.error.message || "Failed to reset password. Please try again.";
          this.isError = true;
        },
      );
    }
  }
}
