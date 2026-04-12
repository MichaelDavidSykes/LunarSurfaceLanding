import { __decorate, __param } from "tslib";
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
let AuthGuard = class AuthGuard {
    constructor(authService, router, platformId) {
        this.authService = authService;
        this.router = router;
        this.platformId = platformId;
    }
    canActivate() {
        // For server-side rendering, allow access
        if (!isPlatformBrowser(this.platformId)) {
            return true;
        }
        // Check if the user is authenticated
        if (this.authService.isAuthenticated()) {
            return true; // Allow access if authenticated
        }
        else {
            // Redirect to login page if not authenticated
            this.router.navigate(['/login']);
            return false; // Deny access
        }
    }
};
AuthGuard = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(2, Inject(PLATFORM_ID))
], AuthGuard);
export { AuthGuard };
//# sourceMappingURL=auth.guard.js.map