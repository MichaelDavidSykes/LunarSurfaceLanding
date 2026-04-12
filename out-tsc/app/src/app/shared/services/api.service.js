import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
let ApiService = class ApiService {
    constructor(http) {
        this.http = http;
        this.baseUrl = `${environment.apiUrl}/api/${environment.apiVersion}`;
    }
    // Generic GET request
    get(endpoint) {
        return this.http.get(`${this.baseUrl}${endpoint}`);
    }
    // Generic POST request
    post(endpoint, data) {
        return this.http.post(`${this.baseUrl}${endpoint}`, data);
    }
    // Generic PUT request
    put(endpoint, data) {
        return this.http.put(`${this.baseUrl}${endpoint}`, data);
    }
    // Generic PATCH request
    patch(endpoint, data) {
        return this.http.patch(`${this.baseUrl}${endpoint}`, data);
    }
    // Generic DELETE request
    delete(endpoint) {
        return this.http.delete(`${this.baseUrl}${endpoint}`);
    }
    // Get current environment info
    getEnvironmentInfo() {
        return {
            environment: environment.environment,
            apiUrl: environment.apiUrl,
            apiVersion: environment.apiVersion,
            production: environment.production
        };
    }
};
ApiService = __decorate([
    Injectable({
        providedIn: 'root'
    })
], ApiService);
export { ApiService };
//# sourceMappingURL=api.service.js.map