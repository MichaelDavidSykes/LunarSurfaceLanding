import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
let VerifyComponent = class VerifyComponent {
    constructor(router, route, http, snackbar) {
        this.router = router;
        this.route = route;
        this.http = http;
        this.snackbar = snackbar;
        this.email = '';
        this.code = '';
        this.isLoading = false;
        this.errorMessage = '';
        this.email = this.route.snapshot.queryParams['email'] || '';
    }
    onSubmit() {
        if (!this.code.trim()) {
            this.errorMessage = 'Please enter the verification code';
            return;
        }
        this.isLoading = true;
        this.errorMessage = '';
        const payload = {
            email: this.email,
            code: this.code
        };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/auth/verify-code`, payload, {
            headers: { 'Content-Type': 'application/json' }
        }).subscribe({
            next: () => {
                this.snackbar.open('Verification successful! You can now log in.', 'OK');
                this.router.navigate(['/login']);
            },
            error: (error) => {
                const errorMessage = error.error?.details || error.error?.message || 'Verification failed.';
                this.snackbar.open(errorMessage, 'OK');
                this.isLoading = false;
            }
        });
    }
};
VerifyComponent = __decorate([
    Component({
        selector: 'app-verify',
        templateUrl: './verify.component.html',
        styleUrls: ['./verify.component.scss']
    })
], VerifyComponent);
export { VerifyComponent };
//# sourceMappingURL=verify.component.js.map