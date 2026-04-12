import { __decorate, __param } from "tslib";
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
let AuthInterceptor = class AuthInterceptor {
    constructor(platformId, router) {
        this.platformId = platformId;
        this.router = router;
    }
    intercept(request, next) {
        if (isPlatformBrowser(this.platformId)) {
            const token = localStorage.getItem('access_token');
            if (token) {
                request = request.clone({
                    setHeaders: {
                        Authorization: `Bearer ${token}`
                    }
                });
            }
        }
        return next.handle(request).pipe(catchError((error) => {
            if (error.status === 401) {
                // Clear the invalid token
                if (isPlatformBrowser(this.platformId)) {
                    localStorage.removeItem('access_token');
                }
                // Redirect to landing page if not already there
                if (isPlatformBrowser(this.platformId) && !this.router.url.includes('/landingpage') && this.router.url !== '/') {
                    this.router.navigate(['/']);
                }
            }
            return throwError(() => error);
        }));
    }
};
AuthInterceptor = __decorate([
    Injectable(),
    __param(0, Inject(PLATFORM_ID))
], AuthInterceptor);
export { AuthInterceptor };
//# sourceMappingURL=auth.interceptor.js.map