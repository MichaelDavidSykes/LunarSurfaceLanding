import { __decorate, __param } from "tslib";
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
let SaveQueryDialogComponent = class SaveQueryDialogComponent {
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
        this.name = data?.defaultName ?? '';
        this.description = '';
    }
    get trimmedName() {
        return (this.name || '').trim();
    }
    onCancel() {
        this.dialogRef.close(null);
    }
    onSave() {
        const value = this.trimmedName;
        if (!value) {
            return;
        }
        const cleanedDescription = (this.description || '').trim();
        const payload = {
            name: value,
            description: cleanedDescription ? cleanedDescription : null
        };
        this.dialogRef.close(payload);
    }
};
SaveQueryDialogComponent = __decorate([
    Component({
        selector: 'app-save-query-dialog',
        template: `
    <h2 mat-dialog-title>Save Query</h2>
    <mat-dialog-content>
      <p>Name and describe this query so it is easy to recognize later.</p>
      <mat-form-field appearance="outline" class="save-query-field">
        <mat-label>Query name</mat-label>
        <input matInput [(ngModel)]="name" (keydown.enter)="onSave()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="save-query-field">
        <mat-label>Description (optional)</mat-label>
        <textarea matInput rows="3" [(ngModel)]="description"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" type="button" [disabled]="!trimmedName" (click)="onSave()">Save</button>
    </mat-dialog-actions>
  `,
        styles: [`
    mat-dialog-content { min-width: 320px; }
    p { margin: 0 0 12px; color: rgba(255,255,255,0.72); }
    .save-query-field { width: 100%; }
  `]
    }),
    __param(1, Inject(MAT_DIALOG_DATA))
], SaveQueryDialogComponent);
export { SaveQueryDialogComponent };
//# sourceMappingURL=save-query-dialog.component.js.map