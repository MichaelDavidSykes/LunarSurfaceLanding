import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ClientStateService } from './client-state.service';
import { Observable, of } from 'rxjs';
import { map, take, tap, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ClientGuard implements CanActivate {
  constructor(private clientState: ClientStateService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.clientState.accessibleClients$.pipe(
      take(1),
      switchMap(clients => {
        if (clients && clients.length > 0) {
          return of(true);
        }
        // Otherwise, trigger a fetch and check again
        return this.clientState.fetchAccessibleClients().pipe(
          take(1),
          map(fetchedClients => fetchedClients && fetchedClients.length > 0),
          tap(hasClient => {
            if (!hasClient) {
              this.router.navigate(['/client-setup']);
            }
          })
        );
      })
    );
  }
} 