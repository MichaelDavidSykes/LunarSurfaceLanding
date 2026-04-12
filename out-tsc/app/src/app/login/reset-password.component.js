import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
let ResetPasswordComponent = class ResetPasswordComponent {
    constructor(dialogRef, http, router, snackbar) {
        this.dialogRef = dialogRef;
        this.http = http;
        this.router = router;
        this.snackbar = snackbar;
    }
    onSubmit(form) {
        if (form.valid) {
            const email = form.value.email;
            this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/auth/request-password-reset`, { email }).subscribe({
                next: () => {
                    this.dialogRef.close({ email });
                    this.router.navigate(['/reset-password'], { queryParams: { email } });
                },
                error: () => {
                    this.snackbar.open('Failed to request password reset. Please try again.', 'OK');
                }
            });
        }
    }
};
ResetPasswordComponent = __decorate([
    Component({
        selector: 'app-reset-password',
        standalone: true,
        imports: [CommonModule, FormsModule, MatButtonModule, MatInputModule, MatFormFieldModule, MatDialogModule],
        template: `
    <div class="reset-password-content">
      <h2>Reset Password</h2>
      <p>Enter your email address and we&apos;ll send you a 6-digit verification code.</p>
      <form #resetForm="ngForm" (ngSubmit)="onSubmit(resetForm)">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput type="email" name="email" ngModel required placeholder="you@example.com">
        </mat-form-field>
        <button mat-raised-button color="primary" type="submit" [disabled]="!resetForm.form.valid">
          Reset Password
        </button>
      </form>
    </div>
  `,
        styles: [`
    .reset-password-content {
      padding: 24px;
      max-width: 400px;
      text-align: center;
    }
    h2 {
      margin-bottom: 16px;
      color: #333;
    }
    p {
      margin-bottom: 24px;
      color: #666;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    button {
      width: 100%;
      padding: 8px 16px;
    }
  `]
    })
], ResetPasswordComponent);
export { ResetPasswordComponent };
//# sourceMappingURL=reset-password.component.js.map