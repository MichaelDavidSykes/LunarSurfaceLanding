import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Target } from '../../models/target.model'; // Corrected import path
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LandingDataService {
  private newBaseUrl = `${environment.apiUrl}/api/${environment.apiVersion}`; // Use environment configuration

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) { }

  private getAuthHeaders(): HttpHeaders {
    if (isPlatformBrowser(this.platformId)) {
      const jwt = localStorage.getItem('access_token');
      if (!jwt) {
        throw new Error('No authentication token found. Please log in.');
      }
      return new HttpHeaders({
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
      });
    } else {
      return new HttpHeaders({
        'Content-Type': 'application/json'
      });
    }
  }

  private handleError = (error: HttpErrorResponse) => {
    console.error('API Error:', error.message, error);
    // 401 handling is centralized in AuthInterceptor to avoid duplicate token clearing/navigation races.
    return throwError(() => error);
  }

  // --- Target Endpoints ---

  // POST /api/v1/targets
  createNewTarget(targetData: any): Observable<any> {
    const url = `${this.newBaseUrl}/targets`;
    return this.http.post(url, targetData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // GET /api/v1/targets/client/{clientId}
  getClientTargets(clientId: string): Observable<any[]> {
    if (!clientId) {
      return throwError(() => new Error('Client ID is required to fetch targets.'));
    }
    const url = `${this.newBaseUrl}/targets/client/${clientId}`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  // PUT /api/v1/targets/{targetId}
  updateTarget(targetId: string, targetData: any): Observable<any> {
    if (!targetId) {
      return throwError(() => new Error('Target ID is required to update a target.'));
    }
    const url = `${this.newBaseUrl}/targets/${targetId}`;
    return this.http.put(url, targetData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // POST /api/v1/reports/target
  getTargetReports(targetId: string, clientId: string, limit: number = 1): Observable<any> {
    if (!targetId) {
      return throwError(() => new Error('Target ID is required to fetch reports.'));
    }
    if (!clientId) {
      return throwError(() => new Error('Client ID is required to fetch reports.'));
    }
    const url = `${this.newBaseUrl}/reports/target`;
    // Send target_id, client_id, and limit in the request body for a POST request
    const body = { target_id: targetId, client_id: clientId, limit: limit };
    return this.http.post<any>(url, body, { headers: this.getAuthHeaders() })
      .pipe(
        catchError(this.handleError)
      );
  }

  // DELETE /api/v1/targets/{targetId}
  deleteTarget(targetId: string): Observable<any> {
    if (!targetId) {
      return throwError(() => new Error('Target ID is required to delete a target.'));
    }
    const url = `${this.newBaseUrl}/targets/${targetId}`;
    return this.http.delete(url, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }

  // GET /api/v1/targets/public/reports
  getPublicTargets(): Observable<any> {
    const url = `${this.newBaseUrl}/targets/public/reports`;
    return this.http.get<any>(url)
      .pipe(
        map(response => response.data || {}),
        catchError(this.handleError)
      );
  }

  // --- Client Endpoints ---

  // POST /api/v1/clients
  createClient(clientData: any): Observable<any> {
    const url = `${this.newBaseUrl}/clients`;
    return this.http.post(url, clientData, { headers: this.getAuthHeaders() })
      .pipe(catchError(this.handleError));
  }
  
  // GET /api/v1/clients/user/me
  // Fetches clients accessible by the currently authenticated user.
  getAccessibleClients(): Observable<any[]> {
    const url = `${this.newBaseUrl}/clients/user/me`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data || []),
        catchError(this.handleError)
      );
  }

  // GET /api/v1/users/me
  // Fetches the current user's profile information
  getCurrentUserProfile(): Observable<any> {
    const url = `${this.newBaseUrl}/users/me`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data || {}),
        catchError(this.handleError)
      );
  }

  // GET /api/v1/users/me/preferences
  getUserPreferences(): Observable<any> {
    const url = `${this.newBaseUrl}/users/me/preferences`;
    return this.http.get<any>(url, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data || {}),
        catchError(this.handleError)
      );
  }

  // --- Kept old methods for now, can be removed if no longer used ---
  // GET /user/targets (old endpoint)
  getUserTargets(): Observable<any[]> {
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
    return this.http.get<any[]>(url, { headers: oldAuthHeaders })
      .pipe(catchError(this.handleError));
  }

  // POST /api/v1/reports/analytics
  getReportAnalytics(clientId: string): Observable<any> {
    const url = `${this.newBaseUrl}/reports/analytics`;
    const payload = { client_id: clientId };
    return this.http.post<any>(url, payload, { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.data || {}),
        catchError(this.handleError)
      );
  }

  // POST /api/v1/alerts/reporting/analytics
  getAlertReportingAnalytics(payload: {
    client_id: string;
    statuses?: string[];
    start_date?: string;
    end_date?: string;
    interval?: 'day' | 'week' | 'month';
    limit_recent?: number;
  }): Observable<any> {
    const url = `${this.newBaseUrl}/alerts/reporting/analytics`;
    return this.http.post<any>(url, payload, { headers: this.getAuthHeaders() }).pipe(
      map(response => response.data || {}),
      catchError(this.handleError)
    );
  }
}
