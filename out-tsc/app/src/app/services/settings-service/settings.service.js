import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
let SettingsService = class SettingsService {
    constructor(http) {
        this.http = http;
        this.apiUrl = `${environment.apiUrl}/api/${environment.apiVersion}/users/me/preferences`;
    }
    getAuthHeaders() {
        const jwt = localStorage.getItem('access_token');
        if (!jwt) {
            // In a real application, you might want to redirect to login or handle this differently
            console.error('No authentication token found.');
            // Depending on auth flow, could throw an error or return headers without token
            // For now, we'll throw, assuming token is required for these endpoints
            throw new Error('Authentication token not found.');
        }
        return new HttpHeaders({
            'Authorization': `Bearer ${jwt}`,
            'Content-Type': 'application/json'
        });
    }
    handleError(error) {
        console.error('API Error:', error.message, error);
        // You might want to add more specific error handling here, e.g., for 401 Unauthorized
        return throwError(() => new Error(`API Error: ${error.statusText || 'Unknown error'} (Status: ${error.status})`));
    }
    // Method to get user settings preferences
    getUserSettings() {
        return this.http.get(this.apiUrl, { headers: this.getAuthHeaders() })
            .pipe(
        // The API response has the preferences at the top level of data
        map(response => ({
            email_notifications: response.data.email_notifications,
            push_notifications: response.data.push_notifications,
            mode: response.data.mode
        })), catchError(this.handleError));
    }
    // Method to patch (update) user settings preferences
    patchUserSettings(settings) {
        // The PATCH request body should be the preferences object directly
        return this.http.patch(this.apiUrl, settings, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
    // Method to update user preferences with new payload format
    updateUserPreferences(payload) {
        return this.http.patch(this.apiUrl, payload, { headers: this.getAuthHeaders() })
            .pipe(catchError(this.handleError));
    }
};
SettingsService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], SettingsService);
export { SettingsService };
//# sourceMappingURL=settings.service.js.map