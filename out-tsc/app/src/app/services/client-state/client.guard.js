import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { map, take, tap, switchMap } from 'rxjs/operators';
let ClientGuard = class ClientGuard {
    constructor(clientState, router) {
        this.clientState = clientState;
        this.router = router;
    }
    canActivate() {
        return this.clientState.accessibleClients$.pipe(take(1), switchMap(clients => {
            if (clients && clients.length > 0) {
                return of(true);
            }
            // Otherwise, trigger a fetch and check again
            return this.clientState.fetchAccessibleClients().pipe(take(1), map(fetchedClients => fetchedClients && fetchedClients.length > 0), tap(hasClient => {
                if (!hasClient) {
                    this.router.navigate(['/client-setup']);
                }
            }));
        }));
    }
};
ClientGuard = __decorate([
    Injectable({ providedIn: 'root' })
], ClientGuard);
export { ClientGuard };
//# sourceMappingURL=client.guard.js.map