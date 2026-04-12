import { __decorate } from "tslib";
import { Injectable } from '@angular/core';
let GlobalSnackbarService = class GlobalSnackbarService {
    constructor(snackBar) {
        this.snackBar = snackBar;
    }
    open(message, toneOrAction = 'info', duration = 4000, action) {
        const lowered = (toneOrAction || '').trim().toLowerCase();
        const isTone = lowered === 'success' || lowered === 'error' || lowered === 'warning' || lowered === 'info';
        const tone = isTone ? lowered : 'info';
        const actionLabel = isTone ? (action ?? 'Dismiss') : (toneOrAction || action || 'Dismiss');
        this.snackBar.open(message, actionLabel, {
            duration,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['global-snackbar', `global-snackbar--${tone}`]
        });
    }
};
GlobalSnackbarService = __decorate([
    Injectable({ providedIn: 'root' })
], GlobalSnackbarService);
export { GlobalSnackbarService };
//# sourceMappingURL=global-snackbar.service.js.map