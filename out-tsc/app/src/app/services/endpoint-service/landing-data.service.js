import { __decorate, __param } from "tslib";
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
let LandingDataService = class LandingDataService {
    constructor(http, platformId, router) {
        this.http = http;
        this.platformId = platformId;
        this.router = router;
        this.newBaseUrl = `${environment.apiUrl}/api/${environment.apiVersion}`; // Use environment configuration
        this.handleError = (error) => {
            console.error('API Error:', error.message, error);
            // 401 handling is centralized in AuthInterceptor to avoid duplicate token clearing/navigation races.
            return throwError(() => error);
        };
    }
    getAuthHeaders() {
        if (isPlatformBrowser(this.platformId)) {
            const jwt = localStorage.getItem('access_token');
            if (!jwt) {
                throw new Error('No authentication token found. Please log in.');
            }
            return new HttpHeaders({
                'Authorization': `Bearer ${jwt}`,
                'Content-Type': 'application/json'
            });
        }
        else {
            return new HttpHeaders({
                'Content-Type': 'application/json'
            });
        }
    }
    // --- Target Endpoints ---
    // POST /api/v1/targets
    createNewTarget(targetData) {
        const url = `${this.newBaseUrl}/targets`;
        return this.http.post(url, targetData, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // GET /api/v1/targets/client/{clientId}
    getClientTargets(clientId) {
        if (!clientId) {
            return throwError(() => new Error('Client ID is required to fetch targets.'));
        }
        const url = `${this.newBaseUrl}/targets/client/${clientId}`;
        return this.http.get(url, { headers: this.getAuthHeaders() })
            .pipe(map(response => response.data || []), catchError(this.handleError));
    }
    // PUT /api/v1/targets/{targetId}
    updateTarget(targetId, targetData) {
        if (!targetId) {
            return throwError(() => new Error('Target ID is required to update a target.'));
        }
        const url = `${this.newBaseUrl}/targets/${targetId}`;
        return this.http.put(url, targetData, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // POST /api/v1/reports/target
    getTargetReports(targetId, clientId, limit = 1) {
        if (!targetId) {
            return throwError(() => new Error('Target ID is required to fetch reports.'));
        }
        if (!clientId) {
            return throwError(() => new Error('Client ID is required to fetch reports.'));
        }
        const url = `${this.newBaseUrl}/reports/target`;
        // Send target_id, client_id, and limit in the request body for a POST request
        const body = { target_id: targetId, client_id: clientId, limit: limit };
        return this.http.post(url, body, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // DELETE /api/v1/targets/{targetId}
    deleteTarget(targetId) {
        if (!targetId) {
            return throwError(() => new Error('Target ID is required to delete a target.'));
        }
        const url = `${this.newBaseUrl}/targets/${targetId}`;
        return this.http.delete(url, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // GET /api/v1/targets/public/reports
    getPublicTargets() {
        const url = `${this.newBaseUrl}/targets/public/reports`;
        return this.http.get(url)
            .pipe(map(response => response.data || {}), catchError(this.handleError));
    }
    // --- Client Endpoints ---
    // POST /api/v1/clients
    createClient(clientData) {
        const url = `${this.newBaseUrl}/clients`;
        return this.http.post(url, clientData, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // GET /api/v1/clients/user/me
    // Fetches clients accessible by the currently authenticated user.
    getAccessibleClients() {
        const url = `${this.newBaseUrl}/clients/user/me`;
        return this.http.get(url, { headers: this.getAuthHeaders() })
            .pipe(map(response => response.data || []), catchError(this.handleError));
    }
    // GET /api/v1/users/me
    // Fetches the current user's profile information
    getCurrentUserProfile() {
        const url = `${this.newBaseUrl}/users/me`;
        return this.http.get(url, { headers: this.getAuthHeaders() })
            .pipe(map(response => response.data || {}), catchError(this.handleError));
    }
    // GET /api/v1/users/me/preferences
    getUserPreferences() {
        const url = `${this.newBaseUrl}/users/me/preferences`;
        return this.http.get(url, { headers: this.getAuthHeaders() })
            .pipe(map(response => response.data || {}), catchError(this.handleError));
    }
    // --- Kept old methods for now, can be removed if no longer used ---
    // GET /user/targets (old endpoint)
    getUserTargets() {
        const oldBaseUrl = environment.apiUrl;
        const url = `${oldBaseUrl}/user/targets`;
        const oldAuthHeaders = new HttpHeaders({
            'Authorization': 'michael',
            'Content-Type': 'application/json'
        });
        if (isPlatformBrowser(this.platformId)) {
            const jwt = localStorage.getItem('access_token');
            // if (jwt) { oldAuthHeaders = oldAuthHeaders.set('X-JWT-Token', `Bearer ${jwt}`); }
        }
        return this.http.get(url, { headers: oldAuthHeaders })
            .pipe(catchError(this.handleError));
    }
    // POST /api/v1/reports/analytics
    getReportAnalytics(clientId) {
        const url = `${this.newBaseUrl}/reports/analytics`;
        const payload = { client_id: clientId };
        return this.http.post(url, payload, { headers: this.getAuthHeaders() })
            .pipe(map(response => response.data || {}), catchError(this.handleError));
    }
    // POST /api/v1/alerts/reporting/analytics
    getAlertReportingAnalytics(payload) {
        const url = `${this.newBaseUrl}/alerts/reporting/analytics`;
        return this.http.post(url, payload, { headers: this.getAuthHeaders() }).pipe(map(response => response.data || {}), catchError(this.handleError));
    }
};
LandingDataService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(1, Inject(PLATFORM_ID))
], LandingDataService);
export { LandingDataService };
//# sourceMappingURL=landing-data.service.js.map