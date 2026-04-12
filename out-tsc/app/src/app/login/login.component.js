var LoginComponent_1;
import { __decorate, __param } from "tslib";
import { Component, HostListener, Inject } from '@angular/core';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ResetPasswordComponent } from './reset-password.component';
import { environment } from '../../environments/environment';
let LoginComponent = class LoginComponent {
    static { LoginComponent_1 = this; }
    static { this.PENDING_CLIENT_SETUP_EMAIL_KEY = 'pending_client_setup_email'; }
    static { this.MOBILE_BREAKPOINT_PX = 768; }
    constructor(router, platformId, http, snackbar, dialog, clientStateService) {
        this.router = router;
        this.platformId = platformId;
        this.http = http;
        this.snackbar = snackbar;
        this.dialog = dialog;
        this.clientStateService = clientStateService;
        this.isBrowser = false;
        this.isMobileLoginDisabled = false;
        this.passwordFieldType = 'password';
        this.isBrowser = typeof window !== 'undefined';
    }
    ngOnInit() {
        this.updateMobileLoginState();
    }
    onWindowResize() {
        this.updateMobileLoginState();
    }
    updateMobileLoginState() {
        if (!isPlatformBrowser(this.platformId)) {
            this.isMobileLoginDisabled = false;
            return;
        }
        this.isMobileLoginDisabled = window.innerWidth <= LoginComponent_1.MOBILE_BREAKPOINT_PX;
    }
    togglePasswordVisibility() {
        this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    }
    onSubmit(form) {
        if (this.isMobileLoginDisabled) {
            this.snackbar.open('Login is unavailable on mobile. Please use a desktop browser.', 'OK');
            return;
        }
        const formData = new URLSearchParams();
        formData.append('username', form.value.email);
        formData.append('password', form.value.password);
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/auth/login`, formData.toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            observe: 'response'
        }).subscribe({
            next: (response) => {
                if (response.body && response.body.data && response.body.data.access_token) {
                    const normalizedEmail = String(form.value.email || '').trim().toLowerCase();
                    let requiresClientSetup = false;
                    if (isPlatformBrowser(this.platformId)) {
                        localStorage.setItem('access_token', response.body.data.access_token);
                        localStorage.removeItem('selectedClientId');
                        const pendingSetupEmail = (localStorage.getItem(LoginComponent_1.PENDING_CLIENT_SETUP_EMAIL_KEY) || '')
                            .trim()
                            .toLowerCase();
                        requiresClientSetup = Boolean(pendingSetupEmail && pendingSetupEmail === normalizedEmail);
                    }
                    this.clientStateService.clearClientState();
                    this.router.navigate([requiresClientSetup ? '/client-setup' : '/user-home']);
                }
                else {
                    this.snackbar.open('Login failed: No access token received from server. Please try again later.');
                }
            },
            error: (error) => {
                let errorMessage = 'An error occurred during login. ';
                if (error.status === 500) {
                    errorMessage += 'The server encountered an error. Please try again later.';
                }
                else if (error.status === 401) {
                    errorMessage += 'Invalid username or password.';
                }
                else if (error.status === 0) {
                    errorMessage += 'Unable to connect to the server. Please check your internet connection.';
                }
                else {
                    errorMessage += error.error?.detail?.details ||
                        error.error?.detail?.message ||
                        error.error?.message ||
                        'Please try again later.';
                }
                this.snackbar.open(errorMessage, 'OK');
            }
        });
    }
    openResetPasswordModal() {
        const dialogRef = this.dialog.open(ResetPasswordComponent, {
            width: '400px',
            panelClass: 'reset-password-dialog'
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result?.email) {
                this.snackbar.open('Verification code sent. Enter it to reset your password.', 'OK');
            }
        });
    }
};
__decorate([
    HostListener('window:resize')
], LoginComponent.prototype, "onWindowResize", null);
LoginComponent = LoginComponent_1 = __decorate([
    Component({
        selector: 'app-login',
        templateUrl: './login.component.html',
        styleUrls: ['./login.component.scss']
    }),
    __param(1, Inject(PLATFORM_ID))
], LoginComponent);
export { LoginComponent };
//# sourceMappingURL=login.component.js.map