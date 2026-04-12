import { __decorate } from "tslib";
import { Component, ViewChild } from '@angular/core';
let TargetsComponent = class TargetsComponent {
    constructor(landingDataService, clientStateService, router) {
        this.landingDataService = landingDataService;
        this.clientStateService = clientStateService;
        this.router = router;
        this.selectedReportId = null; // Renaming this to selectedTargetId for clarity would be good practice
        this.showCreateTargetForm = false;
        // editMode = false; // To distinguish between create and update for the form
        // currentTargetForForm: Target | any = {}; // Holds data for create or edit
        this.newTarget = {
            name: '',
            description: '',
            keywords: '',
            domain_names: '',
            ip_addresses: '',
            partners_affiliates: '',
            locations: '',
            sector: '',
            public_exposure: {
                social_media_handles: { twitter: '', facebook: '', linkedin: '' },
                public_forums: '', public_reports: ''
            }
        };
        this.targets = [];
        this.isLoading = false; // For form submission
        this.isLoadingTargets = false; // Added for targets gallery loading state
        this.error = null;
        this.currentClientId = null;
        // Add property to hold formatted data for the modal
        this.modalData = [];
        this.lineChartOptions = {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } }
        };
        this.sentimentData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                    data: [65, 59, 80, 81, 56, 55, 40], fill: true, tension: 0.4,
                    borderColor: '#3f51b5', backgroundColor: 'rgba(63, 81, 181, 0.1)'
                }]
        };
        // Method to handle clicks outside the modal content
        this.handleOutsideClick = (event) => {
            // Check if the click target is the modal background itself
            if (event.target === this.targetDetailsModal.nativeElement) {
                this.closeModal();
            }
        };
    }
    ngOnInit() {
        this.clientSubscription = this.clientStateService.selectedClientId$.subscribe(clientId => {
            this.currentClientId = clientId;
            if (clientId) {
                this.fetchTargets(clientId);
                this.error = null; // Clear previous errors
            }
            else {
                this.targets = [];
                this.isLoading = false;
                this.error = 'Please select a client from the top navigation to view targets.';
            }
        });
    }
    ngOnDestroy() {
        if (this.clientSubscription) {
            this.clientSubscription.unsubscribe();
        }
    }
    fetchTargets(clientId) {
        this.isLoadingTargets = true;
        this.error = null;
        this.targets = [];
        this.landingDataService.getClientTargets(clientId).subscribe({
            next: (response) => {
                this.targets = response || [];
                setTimeout(() => {
                    this.isLoadingTargets = false;
                }, 1000);
            },
            error: (err) => {
                this.error = `Failed to load targets. Error: ${err.message}`;
                setTimeout(() => {
                    this.isLoadingTargets = false;
                }, 1000);
                if (err.status === 401) {
                    this.router.navigate(['/']);
                }
            }
        });
    }
    // Modal for viewing target details
    openReportModal(targetId) {
        this.selectedReportId = targetId;
        const selectedTarget = this.getSelectedTarget();
        // Prepare data for the modal
        this.modalData = []; // Clear previous data
        if (selectedTarget) {
            // Use Object.keys to iterate over all properties
            Object.keys(selectedTarget).forEach(key => {
                // Exclude _id, client_id, and settings from display
                if (key === '_id' || key === 'client_id' || key === 'settings') {
                    return; // Skip this iteration if the key is one of the excluded ones
                }
                // Use any to bypass type checking for dynamic access
                let value = selectedTarget[key];
                // Do not stringify objects/arrays, just pass them as-is
                if (value === null || value === undefined) {
                    value = 'N/A'; // Display 'N/A' for null or undefined values
                }
                // Exclude properties you don't want to show in the modal if any
                // For now, include all properties as requested, but exclude functions if any get added
                if (typeof value !== 'function') {
                    this.modalData.push({ key: key, value: value });
                }
            });
        }
        // Add event listener to the modal for outside clicks AFTER it's potentially rendered
        // Use a short timeout to ensure the modal element is in the DOM
        setTimeout(() => {
            if (this.targetDetailsModal) {
                this.targetDetailsModal.nativeElement.addEventListener('click', this.handleOutsideClick);
            }
        }, 0);
    }
    closeModal() {
        this.selectedReportId = null;
        this.modalData = []; // Clear modal data when closing
        // Remove the event listener when closing the modal
        if (this.targetDetailsModal) {
            this.targetDetailsModal.nativeElement.removeEventListener('click', this.handleOutsideClick);
        }
    }
    getSelectedTarget() {
        if (!this.selectedReportId)
            return undefined;
        // Ensure the Target interface is properly defined to include all possible properties from the API
        // For now, casting to 'any' to safely access all properties from the API response
        return this.targets.find((t) => t._id === this.selectedReportId);
    }
    // Form handling for Create/Edit
    openCreateTargetForm() {
        if (!this.currentClientId) {
            alert('Please select a client before creating a target.');
            return;
        }
        this.error = null; // Clear any previous errors
        this.resetNewTarget(); // Ensure form is for new target
        this.showCreateTargetForm = true;
    }
    openEditTargetForm(targetToEdit) {
        this.router.navigate(['/edit-target', targetToEdit._id], { state: { target: targetToEdit } });
    }
    closeCreateTargetForm() {
        this.showCreateTargetForm = false;
        this.resetNewTarget();
    }
    resetNewTarget() {
        this.newTarget = {
            _id: undefined,
            name: '', description: '', keywords: '', domain_names: '', ip_addresses: '',
            partners_affiliates: '', locations: '', sector: '',
            public_exposure: {
                social_media_handles: { twitter: '', facebook: '', linkedin: '' },
                public_forums: '', public_reports: ''
            }
        };
    }
    prepareTargetDataForApi(targetInput) {
        return {
            name: targetInput.name || '',
            client_id: this.currentClientId,
            description: targetInput.description || '',
            keywords: Array.isArray(targetInput.keywords) ? targetInput.keywords : (targetInput.keywords ? [targetInput.keywords] : []),
            domain_names: Array.isArray(targetInput.domain_names) ? targetInput.domain_names : (targetInput.domain_names ? [targetInput.domain_names] : []),
            ip_addresses: Array.isArray(targetInput.ip_addresses) ? targetInput.ip_addresses : (targetInput.ip_addresses ? [targetInput.ip_addresses] : []),
            partners_affiliates: Array.isArray(targetInput.partners_affiliates) ? targetInput.partners_affiliates : (targetInput.partners_affiliates ? [targetInput.partners_affiliates] : []),
            locations: Array.isArray(targetInput.locations) ? targetInput.locations : (targetInput.locations ? [targetInput.locations] : []),
            sector: targetInput.sector || '',
            public_exposure: {
                social_media_handles: {
                    twitter: targetInput.public_exposure?.social_media_handles?.twitter || '',
                    facebook: targetInput.public_exposure?.social_media_handles?.facebook || '',
                    linkedin: targetInput.public_exposure?.social_media_handles?.linkedin || ''
                },
                public_forums: Array.isArray(targetInput.public_exposure?.public_forums) ? targetInput.public_exposure.public_forums : (targetInput.public_exposure?.public_forums ? [targetInput.public_exposure.public_forums] : []),
                public_reports: Array.isArray(targetInput.public_exposure?.public_reports) ? targetInput.public_exposure.public_reports : (targetInput.public_exposure?.public_reports ? [targetInput.public_exposure.public_reports] : [])
            },
            technologies: Array.isArray(targetInput.technologies) ? targetInput.technologies : (targetInput.technologies ? [targetInput.technologies] : []),
            modules: ['threat']
        };
    }
    submitForm() {
        if (!this.currentClientId) {
            alert('Cannot save target: No client selected.');
            return;
        }
        const preparedData = this.prepareTargetDataForApi(this.newTarget);
        this.isLoading = true;
        if (this.newTarget._id) { // If _id exists, it's an update
            this.landingDataService.updateTarget(this.newTarget._id, preparedData).subscribe({
                next: (updatedTarget) => {
                    const index = this.targets.findIndex(t => t._id === updatedTarget._id);
                    if (index !== -1) {
                        this.targets[index] = updatedTarget;
                    }
                    this.isLoading = false;
                    this.closeCreateTargetForm();
                },
                error: (err) => {
                    this.errorHandling(err, 'update');
                }
            });
        }
        else { // No _id, so it's a create
            this.landingDataService.createNewTarget(preparedData).subscribe({
                next: (createdTarget) => {
                    this.targets.push(createdTarget);
                    this.isLoading = false;
                    this.closeCreateTargetForm();
                },
                error: (err) => {
                    this.errorHandling(err, 'create');
                }
            });
        }
    }
    errorHandling(err, type) {
        console.error(`Error during ${type} target:`, err);
        this.isLoading = false;
        if (type === 'create' && err.error && err.error.detail && err.error.detail.message === 'Target limit exceeded') {
            this.error = err.error.detail.details || 'You have reached the maximum number of targets for your plan.';
        }
        else {
            // Fallback to a generic error message display
            this.error = `Failed to ${type} target. Please check your input data and try again.`;
        }
    }
    // Target deletion
    confirmDeleteTarget(targetId) {
        if (confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
            this.deleteTarget(targetId);
        }
    }
    deleteTarget(targetId) {
        this.isLoading = true; // Use a more specific loading state if available
        this.landingDataService.deleteTarget(targetId).subscribe({
            next: () => {
                this.targets = this.targets.filter(t => t._id !== targetId);
                this.isLoading = false;
            },
            error: (err) => {
                this.errorHandling(err, 'delete');
            }
        });
    }
    // Helper for modal value formatting
    isDateString(value) {
        if (typeof value !== 'string')
            return false;
        // Checks for ISO date string format
        return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
    }
    isArray(value) {
        return Array.isArray(value);
    }
    isObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value);
    }
    getObjectKeys(obj) {
        return obj ? Object.keys(obj) : [];
    }
};
__decorate([
    ViewChild('targetDetailsModal')
], TargetsComponent.prototype, "targetDetailsModal", void 0);
TargetsComponent = __decorate([
    Component({
        selector: 'app-targets',
        templateUrl: './targets.component.html',
        styleUrls: ['./targets.component.scss']
    })
], TargetsComponent);
export { TargetsComponent };
//# sourceMappingURL=targets.component.js.map