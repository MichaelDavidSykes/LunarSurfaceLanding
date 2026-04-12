import { __decorate } from "tslib";
import { Component } from '@angular/core';
let EditTargetComponent = class EditTargetComponent {
    constructor(landingDataService, router, clientStateService, snackBar, route) {
        this.landingDataService = landingDataService;
        this.router = router;
        this.clientStateService = clientStateService;
        this.snackBar = snackBar;
        this.route = route;
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
            modules: [''],
            public_exposure: {
                social_media_handles: [{ platform: 'Twitter', handle: '' }],
                public_forums: [''],
                public_reports: ['']
            }
        };
        this.isSaving = true;
        this.isLoading = true;
        this.errorMsg = '';
        this.successMessage = '';
        this.currentClientId = null;
        this.targetId = null;
        this.isEditMode = false;
        this.originalTarget = null;
        // Available modules for selection with descriptions
        this.availableModules = [
            { value: 'threat_intel', label: 'Threat', description: 'Threat intelligence and monitoring' },
            { value: 'network', label: 'Network', description: 'Network security and monitoring' },
            { value: 'dark_web', label: 'Dark web', description: 'Dark web monitoring and intelligence' },
            { value: 'vip', label: 'VIP', description: 'VIP/executive protection monitoring' },
            { value: 'supply chain', label: 'Supply chain', description: 'Supply chain security monitoring' }
        ];
        this.socialPlatforms = [
            'Twitter',
            'Facebook',
            'LinkedIn',
            'Instagram',
            'YouTube',
            'TikTok',
            'Reddit',
            'Other'
        ];
    }
    ngOnInit() {
        this.clientSubscription = this.clientStateService.selectedClientId$.subscribe((clientId) => {
            this.currentClientId = clientId;
        });
        this.targetSubscription = this.route.paramMap.subscribe(params => {
            this.targetId = params.get('id');
            this.isEditMode = !!this.targetId; // Set edit mode based on targetId presence
            // Attempt to get target data from router state first
            const navigation = this.router.getCurrentNavigation();
            const passedTarget = navigation?.extras.state?.['target'];
            if (this.isEditMode && this.targetId) {
                if (passedTarget && passedTarget._id === this.targetId) {
                    this.populateFormWithTarget(passedTarget);
                    this.isSaving = false; // Set to false after populating form
                }
                else {
                    this.loadTargetForEdit(this.targetId);
                }
            }
            else {
                // This case is for creating a new target (no ID in route)
                this.resetNewTarget();
                this.isSaving = false; // Set to false after resetting for new target
            }
        });
    }
    ngOnDestroy() {
        this.clientSubscription?.unsubscribe();
        this.targetSubscription?.unsubscribe();
    }
    populateFormWithTarget(target) {
        let handlesArr = [];
        const handles = target.public_exposure?.social_media_handles;
        if (handles && typeof handles === 'object' && !Array.isArray(handles)) {
            handlesArr = Object.entries(handles)
                .filter(([_, v]) => !!v)
                .map(([platform, handle]) => {
                // Find the matching display value in socialPlatforms
                const displayPlatform = this.socialPlatforms.find(p => p.toLowerCase() === platform.toLowerCase()) || platform;
                return { platform: displayPlatform, handle };
            });
        }
        else if (Array.isArray(handles)) {
            handlesArr = handles;
        }
        else {
            handlesArr = [{ platform: 'Twitter', handle: '' }];
        }
        this.newTarget = {
            _id: target._id,
            name: target.name || '',
            description: target.description || '',
            keywords: target.keywords ? target.keywords : [''],
            domain_names: target.domain_names ? target.domain_names : [''],
            ip_addresses: target.ip_addresses ? target.ip_addresses : [''],
            partners_affiliates: target.partners_affiliates ? target.partners_affiliates : [''],
            locations: target.locations ? target.locations : [''],
            sector: target.sector || '',
            technologies: target.technologies ? target.technologies : [''],
            modules: target.modules
                ? target.modules.map((m) => m === 'threat' ? 'threat_intel' : m)
                : [''],
            public_exposure: {
                social_media_handles: handlesArr,
                public_forums: target.public_exposure?.public_forums || [''],
                public_reports: target.public_exposure?.public_reports || ['']
            }
        };
        // Deep copy for change tracking
        this.originalTarget = JSON.parse(JSON.stringify(this.newTarget));
    }
    loadTargetForEdit(id) {
        if (!this.currentClientId) {
            console.error('Client ID is not available. Cannot fetch target.');
            this.errorMsg = 'Client ID is missing. Please select a client.';
            this.snackBar.open(this.errorMsg, 'Close', { panelClass: ['error-snackbar'] });
            this.isSaving = false;
            this.router.navigate(['/targets']);
            return;
        }
        this.isSaving = true; // Use isSaving as a loading indicator
        this.landingDataService.getClientTargets(this.currentClientId).subscribe({
            next: (detailedTargets) => {
                const foundTarget = detailedTargets.find(target => target._id === id);
                if (foundTarget) {
                    this.populateFormWithTarget(foundTarget);
                }
                else {
                    console.error('Target with ID', id, 'not found for client', this.currentClientId);
                    this.errorMsg = 'Target not found or not accessible.';
                    this.snackBar.open(this.errorMsg, 'Close', { panelClass: ['error-snackbar'] });
                    this.router.navigate(['/targets']);
                }
                this.isSaving = false;
            },
            error: (err) => {
                console.error('Failed to load targets for editing (API error):', err);
                this.errorMsg = 'Failed to load target data. ';
                if (err.status === 500) {
                    this.errorMsg += 'Internal server error when fetching client targets. Please check backend logs.';
                }
                else if (err.status === 404) {
                    this.errorMsg += 'Client targets not found.';
                }
                else if (err.status === 401) {
                    this.errorMsg += 'Authentication failed. Please log in again.';
                }
                else {
                    this.errorMsg += err.error?.message || err.message || 'Unknown error.';
                }
                this.isSaving = false;
                this.snackBar.open(this.errorMsg, 'Close', { panelClass: ['error-snackbar'] });
                this.router.navigate(['/targets']);
            }
        });
    }
    resetNewTarget() {
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
            modules: [''],
            public_exposure: {
                social_media_handles: [{ platform: 'Twitter', handle: '' }],
                public_forums: [''],
                public_reports: ['']
            }
        };
        this.errorMsg = '';
    }
    // Helper function to validate domain format
    isValidDomain(domain) {
        const domainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,6}$/;
        return domainRegex.test(domain);
    }
    addToArray(field, parentField) {
        if (parentField) {
            if (field === 'social_media_handles' && this.newTarget[parentField]) {
                this.newTarget[parentField][field].push({ platform: '', handle: '' });
            }
            else if (this.newTarget[parentField] && Array.isArray(this.newTarget[parentField][field])) {
                this.newTarget[parentField][field].push('');
            }
        }
        else {
            if (Array.isArray(this.newTarget[field])) {
                this.newTarget[field].push('');
            }
        }
    }
    removeFromArray(field, index, parentField) {
        if (parentField) {
            if (this.newTarget[parentField] && Array.isArray(this.newTarget[parentField][field])) {
                this.newTarget[parentField][field].splice(index, 1);
            }
        }
        else {
            if (Array.isArray(this.newTarget[field])) {
                this.newTarget[field].splice(index, 1);
            }
        }
    }
    isFormValid() {
        const hasKeyword = this.newTarget.keywords.some((k) => k && k.trim());
        const hasDomain = this.newTarget.domain_names.some((d) => d && d.trim());
        const hasPartner = this.newTarget.partners_affiliates.some((p) => p && p.trim());
        const hasLocation = this.newTarget.locations.some((l) => l && l.trim());
        const hasTechnology = this.newTarget.technologies.some((t) => t && t.trim());
        const hasModule = this.newTarget.modules.some((m) => m && m.trim());
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
        this.errorMsg = '';
        this.successMessage = '';
        const targetData = this.prepareTargetData();
        const request = this.isEditMode && this.targetId
            ? this.landingDataService.updateTarget(this.targetId, targetData)
            : this.landingDataService.createNewTarget(targetData);
        request.subscribe({
            next: (response) => {
                this.successMessage = this.isEditMode ? 'Target updated successfully!' : 'Target created successfully!';
                this.isSaving = false;
                this.isLoading = false;
                // Update originalTarget so Save Changes button is disabled until further edits
                this.originalTarget = JSON.parse(JSON.stringify(this.newTarget));
                this.snackBar.open('Saved Successfully', '✕', {
                    duration: 4000,
                    horizontalPosition: 'center',
                    verticalPosition: 'bottom',
                    panelClass: ['success-snackbar-bottom']
                });
                // Do not navigate away after saving
            },
            error: (error) => {
                console.error('Error saving target:', error);
                // Enhanced error message handling
                let detailedError = 'Failed to save target. Please try again.';
                if (error.error && error.error.detail) {
                    if (typeof error.error.detail === 'string') {
                        detailedError = error.error.detail;
                    }
                    else if (error.error.detail.message) {
                        detailedError = error.error.detail.message;
                        if (error.error.detail.details) {
                            detailedError += `: ${error.error.detail.details}`;
                        }
                    }
                }
                else if (error.error && error.error.message) {
                    detailedError = error.error.message;
                }
                this.errorMsg = detailedError;
                this.isSaving = false;
                this.isLoading = false;
            }
        });
    }
    trackByIndex(index, obj) {
        return index;
    }
    // Helper to check for unsaved changes
    get hasUnsavedChanges() {
        return JSON.stringify(this.newTarget) !== JSON.stringify(this.originalTarget);
    }
    // Helper to check for duplicates in all array fields
    get hasDuplicates() {
        const arraysToCheck = [
            this.newTarget.keywords,
            this.newTarget.domain_names,
            this.newTarget.ip_addresses,
            this.newTarget.partners_affiliates,
            this.newTarget.locations,
            this.newTarget.technologies,
            this.newTarget.modules,
            this.newTarget.public_exposure?.public_forums,
            this.newTarget.public_exposure?.public_reports
        ];
        for (const arr of arraysToCheck) {
            if (Array.isArray(arr)) {
                const filtered = arr.filter((v) => v && v.trim());
                const set = new Set(filtered.map(v => v.trim().toLowerCase()));
                if (set.size !== filtered.length) {
                    return true;
                }
            }
        }
        return false;
    }
    isModuleSelected(module) {
        return this.newTarget.modules.includes(module);
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
    getSelectedModulesCount() {
        return this.newTarget.modules.length;
    }
    prepareTargetData() {
        const targetData = {
            name: this.newTarget.name,
            description: this.newTarget.description,
            keywords: this.newTarget.keywords.filter((k) => k && k.trim()),
            domain_names: this.newTarget.domain_names.filter((d) => d && d.trim()),
            partners_affiliates: this.newTarget.partners_affiliates.filter((p) => p && p.trim()),
            locations: this.newTarget.locations.filter((l) => l && l.trim()),
            sector: this.newTarget.sector,
            technologies: this.newTarget.technologies.filter((t) => t && t.trim()),
            modules: this.newTarget.modules.filter((m) => m && m.trim())
        };
        // Conditionally add optional fields
        const ipAddressesFiltered = this.newTarget.ip_addresses.filter((ip) => ip && ip.trim());
        if (ipAddressesFiltered.length > 0) {
            targetData.ip_addresses = ipAddressesFiltered;
        }
        // Social Media Handles
        const handlesArr = this.newTarget.public_exposure.social_media_handles || [];
        const handlesObj = {};
        handlesArr.forEach((item) => {
            if (item.platform && item.handle) {
                handlesObj[item.platform.toLowerCase()] = item.handle;
            }
        });
        targetData.public_exposure = targetData.public_exposure || {};
        targetData.public_exposure.social_media_handles = handlesObj;
        // Public Forums and Reports
        const publicForumsFiltered = this.newTarget.public_exposure.public_forums.filter((f) => f && f.trim());
        const publicReportsFiltered = this.newTarget.public_exposure.public_reports.filter((r) => r && r.trim());
        if (publicForumsFiltered.length > 0) {
            targetData.public_exposure.public_forums = publicForumsFiltered;
        }
        if (publicReportsFiltered.length > 0) {
            targetData.public_exposure.public_reports = publicReportsFiltered;
        }
        return targetData;
    }
    capitalize(str) {
        if (!str)
            return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }
};
EditTargetComponent = __decorate([
    Component({
        selector: 'app-edit-target',
        templateUrl: './edit-target.component.html',
        styleUrls: ['./edit-target.component.scss']
    })
], EditTargetComponent);
export { EditTargetComponent };
//# sourceMappingURL=edit-target.component.js.map