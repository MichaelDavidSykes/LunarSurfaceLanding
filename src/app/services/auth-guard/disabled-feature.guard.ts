import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class DisabledFeatureGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot): UrlTree {
    return this.router.parseUrl('/explorer');
  }
}
