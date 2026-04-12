import { __decorate, __param } from "tslib";
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
let ThemeService = class ThemeService {
    constructor(platformId) {
        this.platformId = platformId;
        this.isDarkMode = new BehaviorSubject(true);
        this.isDarkMode$ = this.isDarkMode.asObservable();
        if (isPlatformBrowser(this.platformId)) {
            // Restore theme from localStorage or default to dark
            const storedTheme = localStorage.getItem('theme');
            const isDark = storedTheme ? storedTheme === 'dark' : true;
            this.applyTheme(isDark);
        }
    }
    toggleTheme() {
        const newTheme = !this.isDarkMode.value;
        this.isDarkMode.next(newTheme);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
            this.applyTheme(newTheme);
        }
    }
    applyTheme(isDark) {
        this.isDarkMode.next(isDark);
        if (isPlatformBrowser(this.platformId)) {
            // Remove both theme classes first
            document.documentElement.classList.remove('light-theme', 'dark-theme');
            // Add the appropriate theme class
            document.documentElement.classList.add(isDark ? 'dark-theme' : 'light-theme');
        }
    }
    getStoredTheme() {
        if (isPlatformBrowser(this.platformId)) {
            return localStorage.getItem('theme');
        }
        return null;
    }
    setTheme(newTheme) {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('theme', newTheme ? 'dark' : 'light');
        }
    }
};
ThemeService = __decorate([
    Injectable({
        providedIn: 'root'
    }),
    __param(0, Inject(PLATFORM_ID))
], ThemeService);
export { ThemeService };
//# sourceMappingURL=theme.service.js.map