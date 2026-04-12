import { __decorate } from "tslib";
import { Component } from '@angular/core';
let CreateTargetComponent = class CreateTargetComponent {
    constructor(landingDataService, router, clientStateService, snackBar) {
        this.landingDataService = landingDataService;
        this.router = router;
        this.clientStateService = clientStateService;
        this.snackBar = snackBar;
        this.newTarget = {
            name: '',
            description: '',
            keywords: [''],
            domain_names: [''],
            ip_addresses: [''],
            partners_affiliates: [''],
            locations: [''],
            sector: '',
            technologies: [''],
            modules: [],
            public_exposure: {
                social_media_handles: {
                    twitter: '',
                    facebook: '',
                    linkedin: ''
                },
                public_forums: [''],
                public_reports: ['']
            }
        };
        this.isSaving = false;
        this.errorMsg = '';
        this.currentClientId = null;
        // Available modules for selection with descriptions
        this.availableModules = [
            { value: 'threat_intel', label: 'Threat', description: 'Threat intelligence and monitoring' },
            { value: 'network', label: 'Network', description: 'Network security and monitoring' },
            { value: 'dark_web', label: 'Dark web', description: 'Dark web monitoring and intelligence' },
            { value: 'vip', label: 'VIP', description: 'VIP/executive protection monitoring' },
            { value: 'supply chain', label: 'Supply chain', description: 'Supply chain security monitoring' }
        ];
        // Subscribe to selected client
        this.clientStateService.selectedClientId$.subscribe(clientId => {
            this.currentClientId = clientId;
        });
    }
    // Helper function to validate domain format
    isValidDomain(domain) {
        // Regular expression for domain validation (simple version)
        // This regex allows subdomains and common TLDs
        const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,6}$/;
        return domainRegex.test(domain);
    }
    // Module selection methods
    toggleModule(moduleValue) {
        const index = this.newTarget.modules.indexOf(moduleValue);
        if (index > -1) {
            // Remove module if already selected
            this.newTarget.modules.splice(index, 1);
        }
        else {
            // Add module if not selected and under limit
            if (this.newTarget.modules.length < 5) {
                this.newTarget.modules.push(moduleValue);
            }
            else {
                this.snackBar.open('Maximum of 5 modules allowed', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['warning-snackbar']
                });
            }
        }
    }
    isModuleSelected(moduleValue) {
        return this.newTarget.modules.includes(moduleValue);
    }
    getSelectedModulesCount() {
        return this.newTarget.modules.length;
    }
    addToArray(field, subfield) {
        if (subfield) {
            this.newTarget.public_exposure[subfield].push('');
        }
        else {
            this.newTarget[field].push('');
        }
    }
    removeFromArray(field, index, subfield) {
        if (subfield) {
            this.newTarget.public_exposure[subfield].splice(index, 1);
        }
        else {
            this.newTarget[field].splice(index, 1);
        }
    }
    isFormValid() {
        const hasKeyword = this.newTarget.keywords.some((k) => k && k.trim());
        const hasDomain = this.newTarget.domain_names.some((d) => d && d.trim());
        const hasPartner = this.newTarget.partners_affiliates.some((p) => p && p.trim());
        const hasLocation = this.newTarget.locations.some((l) => l && l.trim());
        const hasTechnology = this.newTarget.technologies.some((t) => t && t.trim());
        const hasModule = this.newTarget.modules.length > 0;
        // Validate domain format for each domain name
        const areDomainsValid = this.newTarget.domain_names.every((d) => !d || this.isValidDomain(d));
        return (this.newTarget.name && this.newTarget.name.trim() &&
            this.newTarget.description && this.newTarget.description.trim() &&
            this.newTarget.sector && this.newTarget.sector.trim() &&
            hasKeyword &&
            hasDomain &&
            areDomainsValid &&
            hasPartner &&
            hasLocation &&
            hasTechnology &&
            hasModule);
    }
    saveTarget() {
        const formValidity = this.isFormValid();
        if (!formValidity) {
            // Check for specific domain validation error
            const invalidDomains = this.newTarget.domain_names.filter((d) => d && !this.isValidDomain(d));
            if (invalidDomains.length > 0) {
                this.errorMsg = `Invalid domain format(s) detected: ${invalidDomains.join(', ')}. Please use a valid domain format (e.g., example.com).`;
            }
            else {
                this.errorMsg = 'Please fill in all required fields before submitting.';
            }
            return;
        }
        if (!this.currentClientId) {
            this.errorMsg = 'No client selected. Please select a client before creating a target.';
            return;
        }
        this.isSaving = true;
        this.errorMsg = ''; // Clear previous errors when attempting to save
        const targetData = {
            name: this.newTarget.name,
            description: this.newTarget.description,
            client_id: this.currentClientId,
            keywords: this.newTarget.keywords.filter((k) => k && k.trim()),
            domain_names: this.newTarget.domain_names.filter((d) => d && d.trim()),
            partners_affiliates: this.newTarget.partners_affiliates.filter((p) => p && p.trim()),
            locations: this.newTarget.locations.filter((l) => l && l.trim()),
            sector: this.newTarget.sector,
            technologies: this.newTarget.technologies.filter((t) => t && t.trim()),
            modules: ['threat']
        };
        // Conditionally add optional fields
        const ipAddressesFiltered = this.newTarget.ip_addresses.filter((ip) => ip && ip.trim());
        if (ipAddressesFiltered.length > 0) {
            targetData.ip_addresses = ipAddressesFiltered;
        }
        const socialMediaHandles = this.newTarget.public_exposure.social_media_handles;
        const publicForumsFiltered = this.newTarget.public_exposure.public_forums.filter((f) => f && f.trim());
        const publicReportsFiltered = this.newTarget.public_exposure.public_reports.filter((r) => r && r.trim());
        if (socialMediaHandles.twitter || socialMediaHandles.facebook || socialMediaHandles.linkedin ||
            publicForumsFiltered.length > 0 || publicReportsFiltered.length > 0) {
            targetData.public_exposure = {
                social_media_handles: {
                    twitter: socialMediaHandles.twitter,
                    facebook: socialMediaHandles.facebook,
                    linkedin: socialMediaHandles.linkedin
                },
                public_forums: publicForumsFiltered,
                public_reports: publicReportsFiltered
            };
        }
        this.landingDataService.createNewTarget(targetData).subscribe({
            next: (response) => {
                this.isSaving = false;
                this.snackBar.open('Target created successfully!', 'Close', {
                    duration: 5000,
                    horizontalPosition: 'center',
                    verticalPosition: 'top',
                    panelClass: ['success-snackbar']
                });
                this.router.navigate(['/targets']);
            },
            error: (err) => {
                console.error('API error:', err);
                this.isSaving = false;
                // Enhanced error message handling
                let detailedError = 'Failed to create target. Please try again.';
                if (err.error && err.error.detail) {
                    if (typeof err.error.detail === 'string') {
                        detailedError = err.error.detail;
                    }
                    else if (err.error.detail.message) {
                        detailedError = err.error.detail.message;
                        if (err.error.detail.details) {
                            detailedError += `: ${err.error.detail.details}`;
                        }
                    }
                }
                else if (err.error && err.error.message) {
                    detailedError = err.error.message;
                }
                else if (err.status === 0) {
                    detailedError = 'Unable to connect to the server. Please check your internet connection.';
                }
                this.errorMsg = detailedError;
            }
        });
    }
    trackByIndex(index, obj) {
        return index;
    }
};
CreateTargetComponent = __decorate([
    Component({
        selector: 'app-create-target',
        templateUrl: './create-target.component.html',
        styleUrls: ['./create-target.component.scss']
    })
], CreateTargetComponent);
export { CreateTargetComponent };
//# sourceMappingURL=create-target.component.js.map