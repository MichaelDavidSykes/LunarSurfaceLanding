import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './../auth-service/auth.service';  // Import the Auth Service
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  canActivate(): boolean {
    // For server-side rendering, allow access
    if (!isPlatformBrowser(this.platformId)) {
      return true;
    }

    // Check if the user is authenticated
    if (this.authService.isAuthenticated()) {
      return true;  // Allow access if authenticated
    } else {
      // Redirect to login page if not authenticated
      this.router.navigate(['/login']);
      return false;  // Deny access
    }
  }
}
