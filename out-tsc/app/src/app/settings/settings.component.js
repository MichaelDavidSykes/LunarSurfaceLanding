import { __decorate } from "tslib";
import { Component } from '@angular/core';
let SettingsComponent = class SettingsComponent {
    constructor(settingsService, fb, snackbar) {
        this.settingsService = settingsService;
        this.fb = fb;
        this.snackbar = snackbar;
        this.hasUnsavedChanges = false;
        this.isInitializing = true;
        this.settingsForm = this.fb.group({
            email_notifications: [false]
        });
    }
    ngOnInit() {
        this.settingsService.getUserSettings().subscribe({
            next: (settings) => {
                this.isInitializing = false;
                this.settingsForm.patchValue(settings);
            },
            error: (error) => {
                this.isInitializing = false;
            }
        });
        // Track form changes, but ignore initial patch
        this.settingsForm.valueChanges.subscribe(() => {
            if (!this.isInitializing) {
                this.hasUnsavedChanges = true;
            }
        });
    }
    onSaveChanges() {
        if (!this.hasUnsavedChanges) {
            this.snackbar.open('No changes to save', 'info');
            return;
        }
        if (this.settingsForm.valid) {
            const updatedSettings = this.settingsForm.getRawValue();
            this.settingsService.patchUserSettings(updatedSettings).subscribe({
                next: (response) => {
                    this.snackbar.open('Settings updated successfully!', 'success');
                    this.hasUnsavedChanges = false;
                },
                error: (error) => {
                    this.snackbar.open('Failed to save settings', 'error');
                }
            });
        }
    }
    deactivateAccount() {
        this.snackbar.open('Account deactivation request received.', 'info');
        // Implementation for account deactivation
    }
};
SettingsComponent = __decorate([
    Component({
        selector: 'app-settings',
        templateUrl: './settings.component.html',
        styleUrls: ['./settings.component.scss']
    })
], SettingsComponent);
export { SettingsComponent };
//# sourceMappingURL=settings.component.js.map