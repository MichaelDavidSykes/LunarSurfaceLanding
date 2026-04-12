import { __decorate, __param } from "tslib";
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
let GlobalDialogComponent = class GlobalDialogComponent {
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
    }
    onClose() {
        this.dialogRef.close();
    }
};
GlobalDialogComponent = __decorate([
    Component({
        selector: 'app-global-dialog',
        template: `
    <h2 mat-dialog-title *ngIf="data.title">{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-raised-button color="primary" (click)="onClose()">{{ data.okText || 'OK' }}</button>
    </mat-dialog-actions>
  `,
        styles: [`
    mat-dialog-content { min-width: 260px; font-size: 1.1em; }
    h2 { margin-bottom: 0.5em; }
    mat-dialog-actions { margin-top: 1.5em; }
  `]
    }),
    __param(1, Inject(MAT_DIALOG_DATA))
], GlobalDialogComponent);
export { GlobalDialogComponent };
//# sourceMappingURL=global-dialog.component.js.map