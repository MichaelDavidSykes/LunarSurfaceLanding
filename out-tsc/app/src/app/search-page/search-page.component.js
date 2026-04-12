import { __decorate, __param } from "tslib";
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../environments/environment';
let SearchPageComponent = class SearchPageComponent {
    constructor(http, landingDataService, clientStateService, router, platformId) {
        this.http = http;
        this.landingDataService = landingDataService;
        this.clientStateService = clientStateService;
        this.router = router;
        this.platformId = platformId;
        this.targets = [];
        this.selectedTarget = '';
        this.url = '';
        this.isLoading = false;
        this.results = [];
        this.currentClientId = null;
        this.searchQuery = '';
        this.searchResults = [];
        this.errorMessage = '';
    }
    ngOnInit() {
        this.clientSubscription = this.clientStateService.selectedClientId$.subscribe(clientId => {
            this.currentClientId = clientId;
            if (clientId) {
                this.fetchTargets(clientId);
            }
            else {
                this.targets = [];
            }
        });
    }
    ngOnDestroy() {
        if (this.clientSubscription) {
            this.clientSubscription.unsubscribe();
        }
    }
    fetchTargets(clientId) {
        this.landingDataService.getClientTargets(clientId).subscribe({
            next: (response) => {
                this.targets = (response || []).map((target) => ({
                    name: target.name,
                    value: target._id
                }));
            },
            error: (err) => {
                this.targets = [];
            }
        });
    }
    startScraping() {
        if (!this.url) {
            return;
        }
        this.isLoading = true;
        this.results = [];
        // Call the new scraping API
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/clients/web_scrape`, {
            urls: [this.url]
        }).subscribe({
            next: (response) => {
                if (Array.isArray(response) && response.length > 0) {
                    this.results = response.map((result) => ({
                        url: result.url,
                        content: result.content,
                        timestamp: new Date()
                    }));
                }
                else {
                    // Static demo results if no real results
                    this.results = [
                        {
                            url: 'Demo Article 1',
                            content: 'This is a static demo result for demonstration purposes.',
                            timestamp: new Date()
                        },
                        {
                            url: 'Demo Article 2',
                            content: 'Another example of a static result card. Replace with real data.',
                            timestamp: new Date()
                        }
                    ];
                }
                this.isLoading = false;
            },
            error: (error) => {
                // Show static demo results on error as well
                this.results = [
                    {
                        url: 'Demo Article 1',
                        content: 'This is a static demo result for demonstration purposes.',
                        timestamp: new Date()
                    },
                    {
                        url: 'Demo Article 2',
                        content: 'Another example of a static result card. Replace with real data.',
                        timestamp: new Date()
                    }
                ];
                this.isLoading = false;
                // Optionally log error
                // console.error('Scraping failed:', error);
            }
        });
    }
    performSearch() {
        if (!this.searchQuery.trim()) {
            return;
        }
        this.isLoading = true;
        this.searchResults = [];
        this.errorMessage = '';
        const searchData = {
            query: this.searchQuery,
            client_id: this.currentClientId
        };
        this.http.post(`${environment.apiUrl}/api/${environment.apiVersion}/clients/web_scrape`, searchData).subscribe({
            next: (response) => {
                if (Array.isArray(response) && response.length > 0) {
                    this.searchResults = response.map((result) => ({
                        url: result.url,
                        content: result.content,
                        timestamp: new Date()
                    }));
                }
                else {
                    // Static demo results if no real results
                    this.searchResults = [
                        {
                            url: 'Demo Article 1',
                            content: 'This is a static demo result for demonstration purposes.',
                            timestamp: new Date()
                        },
                        {
                            url: 'Demo Article 2',
                            content: 'Another example of a static result card. Replace with real data.',
                            timestamp: new Date()
                        }
                    ];
                }
                this.isLoading = false;
            },
            error: (error) => {
                // Show static demo results on error as well
                this.searchResults = [
                    {
                        url: 'Demo Article 1',
                        content: 'This is a static demo result for demonstration purposes.',
                        timestamp: new Date()
                    },
                    {
                        url: 'Demo Article 2',
                        content: 'Another example of a static result card. Replace with real data.',
                        timestamp: new Date()
                    }
                ];
                this.isLoading = false;
                // Optionally log error
                // console.error('Scraping failed:', error);
            }
        });
    }
};
SearchPageComponent = __decorate([
    Component({
        selector: 'app-search-page',
        templateUrl: './search-page.component.html',
        styleUrls: ['./search-page.component.scss'],
        standalone: true,
        imports: [
            CommonModule,
            FormsModule,
            MatFormFieldModule,
            MatInputModule,
            MatSelectModule,
            MatButtonModule,
            MatCardModule,
            MatProgressSpinnerModule,
            MatIconModule
        ]
    }),
    __param(4, Inject(PLATFORM_ID))
], SearchPageComponent);
export { SearchPageComponent };
//# sourceMappingURL=search-page.component.js.map