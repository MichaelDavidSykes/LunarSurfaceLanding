import { __decorate } from "tslib";
import { Component } from '@angular/core';
let ProfileComponent = class ProfileComponent {
    constructor(dataService, snackbar) {
        this.dataService = dataService;
        this.snackbar = snackbar;
        this.user = null;
        this.preferences = null;
        this.isLoading = false;
        this.error = null;
    }
    ngOnInit() {
        this.isLoading = true;
        this.dataService.getUserPreferences().subscribe({
            next: (data) => {
                this.preferences = data;
                this.user = {
                    name: data.email.split('@')[0],
                    email: data.email,
                    username: data.username,
                    bio: '',
                    location: ''
                };
                this.isLoading = false;
            },
            error: (err) => {
                this.error = 'Failed to load preferences.';
                this.isLoading = false;
                console.error('Failed to load preferences:', err);
                this.snackbar.open('Failed to load profile preferences', 'error');
            }
        });
    }
    saveProfile() {
        // TODO: Implement profile update API call when backend endpoint is available.
        this.snackbar.open('Profile updates are not available yet', 'info');
    }
};
ProfileComponent = __decorate([
    Component({
        selector: 'app-profile',
        templateUrl: './profile.component.html',
        styleUrls: ['./profile.component.scss']
    })
], ProfileComponent);
export { ProfileComponent };
//# sourceMappingURL=profile.component.js.map