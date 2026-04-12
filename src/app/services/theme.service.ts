import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private isDarkMode = new BehaviorSubject<boolean>(true);
  isDarkMode$ = this.isDarkMode.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    if (isPlatformBrowser(this.platformId)) {
      // Restore theme from localStorage or default to dark
      const storedTheme = localStorage.getItem('theme');
      const isDark = storedTheme ? storedTheme === 'dark' : true;
      this.applyTheme(isDark);
    }
  }

  toggleTheme(): void {
    const newTheme = !this.isDarkMode.value;
    this.isDarkMode.next(newTheme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      this.applyTheme(newTheme);
    }
  }

  private applyTheme(isDark: boolean): void {
    this.isDarkMode.next(isDark);
    if (isPlatformBrowser(this.platformId)) {
      // Remove both theme classes first
      document.documentElement.classList.remove('light-theme', 'dark-theme');
      // Add the appropriate theme class
      document.documentElement.classList.add(isDark ? 'dark-theme' : 'light-theme');
    }
  }

  getStoredTheme(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem('theme');
    }
    return null;
  }

  setTheme(newTheme: boolean): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    }
  }
} 