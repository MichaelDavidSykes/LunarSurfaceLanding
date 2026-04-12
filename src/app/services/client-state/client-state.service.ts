import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs'; // Added of for returning Observable<boolean>
import { map, catchError, tap } from 'rxjs/operators';
import { LandingDataService } from '../endpoint-service/landing-data.service';

// Define a basic Client interface (adjust as per actual client object structure)
export interface Client {
  _id: string; // Assuming client objects have an _id
  name: string;
  // Add other relevant client properties here
  description?: string;
  modules?: string[];
  plan?: string;
  members?: string[];
  targets?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ClientStateService {
  private accessibleClientsSubject = new BehaviorSubject<Client[]>([]);
  // Make selectedClientSubject public to allow direct value access
  public selectedClientSubject = new BehaviorSubject<Client | null>(null);

  accessibleClients$: Observable<Client[]> = this.accessibleClientsSubject.asObservable();
  selectedClient$: Observable<Client | null> = this.selectedClientSubject.asObservable();
  selectedClientId$: Observable<string | null> = this.selectedClient$.pipe(
    map(client => client ? client._id : null)
  );

  constructor(
    private landingDataService: LandingDataService,
    @Inject(PLATFORM_ID) private platformId: Object // Injected PLATFORM_ID
  ) {
    // Load selected client from localStorage on service initialization, only in browser
    if (isPlatformBrowser(this.platformId)) {
      this.loadSelectedClientFromStorage();
    }
  }

  fetchAccessibleClients(): Observable<Client[]> {
    // Check for auth token presence. If no token, don't try to fetch clients for a non-logged-in user.
    // This check might be more robust if done via an AuthService.isAuthenticated() method.
    if (isPlatformBrowser(this.platformId) && !localStorage.getItem('access_token')) {
      this.accessibleClientsSubject.next([]);
      return of([]); // Return an empty observable or handle as appropriate
    }

    return this.landingDataService.getAccessibleClients().pipe(
      tap(clients => {
        this.accessibleClientsSubject.next(clients);

        if (clients && clients.length === 0) {
          // Only trigger forced creation if we are sure the user is logged in (e.g., token exists)
          // and this wasn't just a speculative fetch.
          if (isPlatformBrowser(this.platformId) && localStorage.getItem('access_token')) {
          } else {
            // If no token, but somehow this fetch was called and returned empty, ensure modal is not shown.
          }
        }

        const currentSelectedId = this.selectedClientSubject.value?._id;
        // Auto-select if only one client and none is selected
        if (!currentSelectedId && clients && clients.length === 1) {
          this.setSelectedClient(clients[0]._id);
        } else if (!currentSelectedId && clients && clients.length > 0) {
          // this.setSelectedClient(clients[0]._id); // Uncomment to select first by default
        } else if (currentSelectedId && (!clients || !clients.find(c => c._id === currentSelectedId))) {
          this.clearSelectedClient();
        }
      }),
      catchError(err => {
        console.error('ClientStateService: Error in fetchAccessibleClients from LandingDataService:', err);
        this.accessibleClientsSubject.next([]);
        this.clearSelectedClient();
        return throwError(err);
      })
    );
  }

  setSelectedClient(clientId: string): void {
    const clients = this.accessibleClientsSubject.value;
    const clientToSelect = clients.find(client => client._id === clientId);
    if (clientToSelect) {
      this.selectedClientSubject.next(clientToSelect);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedClientId', clientId);
      }
    } else {
      this.clearSelectedClient(); // This already handles localStorage and subject
    }
  }

  clearSelectedClient(): void {
    this.selectedClientSubject.next(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('selectedClientId');
    }
  }

  loadSelectedClientFromStorage(): void {
    // This method is now called within a isPlatformBrowser check in the constructor
    const storedClientId = localStorage.getItem('selectedClientId');
    if (storedClientId) {
      this.fetchAccessibleClients().subscribe(clients => {
        if (clients && clients.length > 0) {
           const clientExists = clients.some(c => c._id === storedClientId);
           if (clientExists) {
             this.setSelectedClient(storedClientId);
           } else {
             if (isPlatformBrowser(this.platformId)) {
                localStorage.removeItem('selectedClientId'); 
             }
           }
        } else {
        }
      });
    } else {
    }
  }

  // Call this on user logout
  clearClientState(): void {
    this.accessibleClientsSubject.next([]);
    this.clearSelectedClient();
  }
}
