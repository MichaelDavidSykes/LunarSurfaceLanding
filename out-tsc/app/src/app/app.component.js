import { __decorate, __param } from "tslib";
import { Component, Inject, PLATFORM_ID } from '@angular/core'; // Removed OnDestroy as it's not explicitly used here yet, but can be added back if needed for clientModalSubscription
import { NavigationEnd, NavigationStart } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
let AppComponent = class AppComponent {
    constructor(router, themeService, platformId, clientStateService, authService) {
        this.router = router;
        this.themeService = themeService;
        this.platformId = platformId;
        this.clientStateService = clientStateService;
        this.authService = authService;
        this.showToolbar = true;
        this.title = 'LunarChain';
        this.isDarkMode = false;
        this.router.events.subscribe(event => {
            if (event instanceof NavigationStart) {
                // Check both URL path and authentication status (ignore query params and fragments)
                const pathOnly = event.url.split('?')[0].split('#')[0];
                const isExcludedPath = ['/', '/login', '/landingpage', '/register', '/verify', '/client-setup', '/reset-password'].includes(pathOnly);
                const isAuthenticated = this.authService.isAuthenticated();
                // Show toolbar only if not on excluded path AND user is authenticated
                this.showToolbar = !isExcludedPath && isAuthenticated;
            }
            if (event instanceof NavigationEnd) {
                if (this.showToolbar && isPlatformBrowser(this.platformId) && localStorage.getItem('access_token')) {
                    this.clientStateService.fetchAccessibleClients().subscribe({
                        error: (err) => console.error('AppComponent: Failed to fetch clients after navigation.', err)
                    });
                }
            }
        });
    }
    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            // Check authentication status on app initialization
            if (!this.authService.isAuthenticated()) {
                // If not authenticated, clear any stale token and redirect to landing page
                localStorage.removeItem('access_token');
                this.clientStateService.clearClientState();
                if (!this.isLandingPage()) {
                    this.router.navigate(['/']);
                }
            }
            else if (localStorage.getItem('access_token') && this.showToolbar) {
                this.clientStateService.loadSelectedClientFromStorage();
            }
        }
        this.themeService.isDarkMode$.subscribe((isDark) => {
            this.isDarkMode = isDark;
        });
    }
    // Check if the current route is landingpage
    isLandingPage() {
        const path = this.router.url.split('?')[0].split('#')[0];
        return (path === '/' ||
            path.startsWith('/landingpage') ||
            path.startsWith('/login') ||
            path.startsWith('/register') ||
            path.startsWith('/verify') ||
            path.startsWith('/client-setup') ||
            path.startsWith('/reset-password'));
    }
    isExplorerRoute() {
        const path = this.router.url.split('?')[0].split('#')[0];
        return (path.startsWith('/explorer') ||
            path.startsWith('/alerts') ||
            path.startsWith('/query') ||
            path.startsWith('/profile') ||
            path.startsWith('/settings'));
    }
    onClientSelected(clientId) {
        if (clientId) {
            this.clientStateService.setSelectedClient(clientId);
        }
    }
    showLogoutModal() {
        if (isPlatformBrowser(this.platformId)) {
            localStorage.removeItem('access_token'); // Assuming this is how logout is primarily handled
        }
        this.clientStateService.clearClientState();
        this.router.navigate(['/']);
    }
    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    followInstagram() {
        window.open('https://instagram.com/lunarchainco', '_blank');
    }
};
AppComponent = __decorate([
    Component({
        selector: 'app-root',
        templateUrl: './app.component.html',
        styleUrls: ['./app.component.scss']
    }),
    __param(2, Inject(PLATFORM_ID))
], AppComponent);
export { AppComponent };
//# sourceMappingURL=app.component.js.map