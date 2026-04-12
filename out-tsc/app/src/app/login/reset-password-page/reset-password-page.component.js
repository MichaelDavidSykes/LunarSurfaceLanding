import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
let ResetPasswordPageComponent = class ResetPasswordPageComponent {
    constructor(route, router, http) {
        this.route = route;
        this.router = router;
        this.http = http;
        this.email = '';
        this.code = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.isLoading = false;
        this.errorMessage = '';
        this.successMessage = '';
    }
    ngOnInit() {
        this.email = this.route.snapshot.queryParams['email'] || '';
        this.code = this.route.snapshot.queryParams['code'] || '';
    }
    isStrongPassword(password) {
        return (password.length >= 8 &&
            /[A-Z]/.test(password) &&
            /[a-z]/.test(password) &&
            /\d/.test(password) &&
            /[!@#$%^&*(),.?":{}|<>]/.test(password));
    }
    onSubmit() {
        const normalizedCode = this.code.trim();
        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = 'Passwords do not match';
            return;
        }
        if (!this.email.trim()) {
            this.errorMessage = 'Email is required';
            return;
        }
        if (!normalizedCode) {
            this.errorMessage = 'Verification code is required';
            return;
        }
        if (!/^\d{6}$/.test(normalizedCode)) {
            this.errorMessage = 'Verification code must be exactly 6 digits';
            return;
        }
        if (!this.isStrongPassword(this.newPassword)) {
            this.errorMessage = 'Password must be at least 8 chars with uppercase, lowercase, number, and special character';
            return;
        }
        this.isLoading = true;
        this.errorMessage = '';
        const payload = {
            email: this.email,
            code: normalizedCode,
            new_password: this.newPassword
        };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/auth/reset-password`, payload).subscribe({
            next: () => {
                this.successMessage = 'Password reset successfully! Redirecting to login page...';
                setTimeout(() => this.router.navigate(['/login']), 2000);
            },
            error: (err) => {
                this.errorMessage = err?.error?.detail?.details || err?.error?.details || err?.error?.message || 'Failed to reset password. Please check your code and try again.';
                this.isLoading = false;
            }
        });
    }
};
ResetPasswordPageComponent = __decorate([
    Component({
        selector: 'app-reset-password-page',
        templateUrl: './reset-password-page.component.html',
        styleUrls: ['./reset-password-page.component.scss']
    })
], ResetPasswordPageComponent);
export { ResetPasswordPageComponent };
//# sourceMappingURL=reset-password-page.component.js.map