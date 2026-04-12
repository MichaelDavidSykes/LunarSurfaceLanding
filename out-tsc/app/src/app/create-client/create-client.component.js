import { __decorate } from "tslib";
import { Component, Output, EventEmitter } from '@angular/core'; // Added Output, EventEmitter
import { Validators } from '@angular/forms';
let CreateClientComponent = class CreateClientComponent {
    constructor(fb, landingDataService, clientStateService, router) {
        this.fb = fb;
        this.landingDataService = landingDataService;
        this.clientStateService = clientStateService;
        this.router = router;
        this.isLoading = false;
        this.error = null;
        this.clientCreated = new EventEmitter(); // Event emitter for successful creation
        this.availableModules = ['intelligence', 'monitoring', 'protection', 'response'];
        this.availablePlans = ['basic', 'standard', 'premium', 'enterprise'];
        this.clientForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            modules: this.fb.array([], Validators.required),
            plan: ['premium', Validators.required] // Default plan
            // 'members' and 'targets' are handled by the backend primarily.
        });
    }
    ngOnInit() {
        // Optionally, pre-select some modules or set defaults if needed
        // this.addDefaultModules();
    }
    // --- FormArray helpers for modules ---
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
    // addDefaultModules() {
    //   this.availableModules.slice(0, 2).forEach(moduleName => this.modulesArray.push(this.fb.control(moduleName)));
    // }
    onSubmit() {
        if (this.clientForm.invalid) {
            this.error = 'Please fill all required fields.';
            this.clientForm.markAllAsTouched(); // Show validation errors
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
                this.clientStateService.fetchAccessibleClients().subscribe(() => {
                    if (newClient && newClient._id) {
                        this.clientStateService.setSelectedClient(newClient._id);
                    }
                    this.clientCreated.emit();
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
                console.error('CreateClientComponent: Error creating client via service:', err, 'Response body:', err.error);
            }
        });
    }
};
__decorate([
    Output()
], CreateClientComponent.prototype, "clientCreated", void 0);
CreateClientComponent = __decorate([
    Component({
        selector: 'app-create-client',
        templateUrl: './create-client.component.html',
        styleUrls: ['./create-client.component.scss']
    })
], CreateClientComponent);
export { CreateClientComponent };
//# sourceMappingURL=create-client.component.js.map