var ClientSetupComponent_1;
import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
let ClientSetupComponent = class ClientSetupComponent {
    static { ClientSetupComponent_1 = this; }
    static { this.PENDING_CLIENT_SETUP_EMAIL_KEY = 'pending_client_setup_email'; }
    constructor(fb, landingDataService, clientStateService, router) {
        this.fb = fb;
        this.landingDataService = landingDataService;
        this.clientStateService = clientStateService;
        this.router = router;
        this.isLoading = false;
        this.error = null;
        this.availableModules = ['threat'];
        this.availablePlans = ['basic'];
        this.clientForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            modules: this.fb.array([], Validators.required),
            plan: ['basic', Validators.required]
        });
    }
    ngOnInit() { }
    get modulesArray() {
        return this.clientForm.get('modules');
    }
    onModuleChange(event) {
        const selectedModules = this.modulesArray;
        if (event.target.checked) {
            selectedModules.push(this.fb.control(event.target.value));
        }
        else {
            let i = 0;
            selectedModules.controls.forEach((item) => {
                if (item.value == event.target.value) {
                    selectedModules.removeAt(i);
                    return;
                }
                i++;
            });
        }
    }
    onSubmit() {
        if (this.clientForm.invalid) {
            this.error = 'Please fill all required fields.';
            this.clientForm.markAllAsTouched();
            return;
        }
        this.isLoading = true;
        this.error = null;
        const clientData = {
            name: this.clientForm.value.name,
            description: this.clientForm.value.description,
            modules: this.clientForm.value.modules || [],
            plan: this.clientForm.value.plan,
            members: [],
            targets: []
        };
        this.landingDataService.createClient(clientData).subscribe({
            next: (newClient) => {
                this.isLoading = false;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem(ClientSetupComponent_1.PENDING_CLIENT_SETUP_EMAIL_KEY);
                }
                this.clientStateService.fetchAccessibleClients().subscribe(() => {
                    if (newClient && newClient._id) {
                        this.clientStateService.setSelectedClient(newClient._id);
                    }
                    this.router.navigate(['/user-home']);
                });
            },
            error: (err) => {
                this.isLoading = false;
                let detailedError = err.message;
                if (err.error) {
                    if (err.error.message) {
                        detailedError += ` Server: ${err.error.message}`;
                    }
                    else if (err.error.detail) {
                        detailedError += ` Server: ${typeof err.error.detail === 'string' ? err.error.detail : JSON.stringify(err.error.detail)}`;
                    }
                    else if (typeof err.error === 'string') {
                        detailedError += ` Server: ${err.error}`;
                    }
                }
                this.error = `Failed to create client: ${detailedError}`;
            }
        });
    }
};
ClientSetupComponent = ClientSetupComponent_1 = __decorate([
    Component({
        selector: 'app-client-setup',
        templateUrl: './client-setup.component.html',
        styleUrls: ['./client-setup.component.scss']
    })
], ClientSetupComponent);
export { ClientSetupComponent };
//# sourceMappingURL=client-setup.component.js.map