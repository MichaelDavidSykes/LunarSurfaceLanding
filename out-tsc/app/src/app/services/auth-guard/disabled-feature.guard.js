import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
let DisabledFeatureGuard = class DisabledFeatureGuard {
    constructor(router) {
        this.router = router;
    }
    canActivate(_route) {
        return this.router.parseUrl('/explorer');
    }
};
DisabledFeatureGuard = __decorate([
    Injectable({
        providedIn: 'root'
    })
], DisabledFeatureGuard);
export { DisabledFeatureGuard };
//# sourceMappingURL=disabled-feature.guard.js.map