import { __decorate, __param } from "tslib";
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
let AuthService = class AuthService {
    constructor(platformId) {
        this.platformId = platformId;
    }
    // Check if the user is authenticated (e.g., based on a stored token)
    isAuthenticated() {
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            if (!token) {
                return false;
            }
            // Basic JWT structure validation
            if (!this.isValidJWT(token)) {
                this.logout(); // Clear invalid token
                return false;
            }
            // Check if token is expired
            if (this.isTokenExpired(token)) {
                this.logout(); // Clear expired token
                return false;
            }
            return true;
        }
        return false; // Default to false for server-side rendering
    }
    // Basic JWT structure validation
    isValidJWT(token) {
        try {
            // Check if token has the correct format (3 parts separated by dots)
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }
            // Try to decode the payload (second part)
            const payload = JSON.parse(atob(parts[1]));
            return payload && typeof payload === 'object';
        }
        catch (error) {
            return false;
        }
    }
    // Check if JWT token is expired
    isTokenExpired(token) {
        try {
            const parts = token.split('.');
            const payload = JSON.parse(atob(parts[1]));
            if (!payload.exp) {
                return false; // No expiration claim, assume valid
            }
            const currentTime = Math.floor(Date.now() / 1000);
            return payload.exp < currentTime;
        }
        catch (error) {
            return true; // If we can't parse the token, assume it's expired
        }
    }
    // Log in the user by storing the authentication token
    login(token) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('access_token', token);
        }
    }
    // Log out the user by removing the authentication token
    logout() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('access_token');
        }
    }
};
AuthService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(0, Inject(PLATFORM_ID))
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map