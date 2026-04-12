var RegisterComponent_1;
import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { environment } from '../../environments/environment';
let RegisterComponent = class RegisterComponent {
    static { RegisterComponent_1 = this; }
    static { this.PENDING_CLIENT_SETUP_EMAIL_KEY = 'pending_client_setup_email'; }
    constructor(router, http, snackbar, matSnackBar) {
        this.router = router;
        this.http = http;
        this.snackbar = snackbar;
        this.matSnackBar = matSnackBar;
        this.passwordPattern = '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\-=[\]{};\':\"\\|,.<>/?]).{8,}$';
        // Password requirement tracking
        this.passwordRequirements = {
            length: false,
            letter: false,
            number: false,
            special: false
        };
        // Form state tracking
        this.formData = {
            email: '',
            firstName: '',
            lastName: '',
            password: ''
        };
        this.isFormValid = false;
        this.errorMessage = '';
        this.isLoading = false;
    }
    // Check password requirements in real-time
    checkPasswordRequirements(password) {
        this.passwordRequirements = {
            length: password.length >= 8,
            letter: /[A-Za-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
        };
    }
    // Check if all form fields are filled and valid
    checkFormValidity() {
        const emailValid = Boolean(this.formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email));
        const firstNameValid = this.formData.firstName.trim().length > 0;
        const lastNameValid = this.formData.lastName.trim().length > 0;
        const passwordValid = Object.values(this.passwordRequirements).every(req => req);
        this.isFormValid = emailValid && firstNameValid && lastNameValid && passwordValid;
    }
    // Handle input changes
    onInputChange(field, value) {
        this.formData[field] = value;
        if (field === 'password') {
            this.checkPasswordRequirements(value);
        }
        this.checkFormValidity();
    }
    // Helper methods for template validation
    isEmailValid() {
        return Boolean(this.formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.formData.email));
    }
    isFirstNameValid() {
        return this.formData.firstName.trim().length > 0;
    }
    isLastNameValid() {
        return this.formData.lastName.trim().length > 0;
    }
    isPasswordValid() {
        return Object.values(this.passwordRequirements).every(req => req);
    }
    onSubmit(form) {
        console.log('Form submitted!');
        console.log('isFormValid:', this.isFormValid);
        console.log('form.valid:', form.valid);
        console.log('formData:', this.formData);
        console.log('passwordRequirements:', this.passwordRequirements);
        // Clear previous error messages
        this.errorMessage = '';
        if (this.isFormValid) {
            this.isLoading = true;
            const payload = {
                email: this.formData.email,
                username: this.formData.email,
                password: this.formData.password,
                first_name: this.formData.firstName,
                last_name: this.formData.lastName
            };
            console.log('Making API call with payload:', payload);
            this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/auth/register`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).subscribe({
                next: (response) => {
                    console.log('Registration successful:', response);
                    this.isLoading = false;
                    if (typeof window !== 'undefined') {
                        localStorage.setItem(RegisterComponent_1.PENDING_CLIENT_SETUP_EMAIL_KEY, this.formData.email.trim().toLowerCase());
                    }
                    this.snackbar.open('Registration successful! Please check your email to verify your account.', 'OK');
                    this.router.navigate(['/verify'], { queryParams: { email: this.formData.email } });
                },
                error: (error) => {
                    console.error('Registration error:', error);
                    console.error('Error object:', JSON.stringify(error, null, 2));
                    this.isLoading = false;
                    const errorMessage = error.error?.detail?.details ||
                        error.error?.detail?.message ||
                        error.error?.details ||
                        error.error?.message ||
                        'Registration failed.';
                    console.log('Extracted error message:', errorMessage);
                    // Display error directly on the form
                    this.errorMessage = errorMessage;
                    // Also log to console as backup
                    console.error('Registration failed:', errorMessage);
                }
            });
        }
        else {
            console.log('Form is not valid, preventing submission');
        }
    }
};
RegisterComponent = RegisterComponent_1 = __decorate([
    Component({
        selector: 'app-register',
        templateUrl: './register.component.html',
        styleUrls: ['./register.component.scss']
    })
], RegisterComponent);
export { RegisterComponent };
//# sourceMappingURL=register.component.js.map