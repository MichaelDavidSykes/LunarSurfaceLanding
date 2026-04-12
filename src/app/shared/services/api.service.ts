import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl: string;

  constructor(private http: HttpClient) {
    this.baseUrl = `${environment.apiUrl}/api/${environment.apiVersion}`;
  }

  // Generic GET request
  get<T>(endpoint: string) {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`);
  }

  // Generic POST request
  post<T>(endpoint: string, data: any) {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, data);
  }

  // Generic PUT request
  put<T>(endpoint: string, data: any) {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, data);
  }

  // Generic PATCH request
  patch<T>(endpoint: string, data: any) {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, data);
  }

  // Generic DELETE request
  delete<T>(endpoint: string) {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`);
  }

  // Generic OPTIONS request
  options<T>(endpoint: string, options?: any) {
    return this.http.options<T>(`${this.baseUrl}${endpoint}`, options);
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
} 
