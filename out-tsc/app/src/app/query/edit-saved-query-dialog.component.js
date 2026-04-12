import { __decorate, __param } from "tslib";
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
let EditSavedQueryDialogComponent = class EditSavedQueryDialogComponent {
    constructor(dialogRef, data) {
        this.dialogRef = dialogRef;
        this.data = data;
        this.name = data?.name ?? '';
        this.description = data?.description ?? '';
    }
    get trimmedName() {
        return (this.name || '').trim();
    }
    onCancel() {
        this.dialogRef.close(null);
    }
    onSave() {
        const name = this.trimmedName;
        if (!name) {
            return;
        }
        const cleanedDescription = (this.description || '').trim();
        const payload = {
            name,
            description: cleanedDescription ? cleanedDescription : null
        };
        this.dialogRef.close(payload);
    }
};
EditSavedQueryDialogComponent = __decorate([
    Component({
        selector: 'app-edit-saved-query-dialog',
        template: `
    <h2 mat-dialog-title>Edit Saved Query</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="edit-query-field">
        <mat-label>Name</mat-label>
        <input matInput [(ngModel)]="name" (keydown.enter)="onSave()" />
      </mat-form-field>
      <mat-form-field appearance="outline" class="edit-query-field">
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
    mat-dialog-content { min-width: 340px; }
    .edit-query-field { width: 100%; }
  `]
    }),
    __param(1, Inject(MAT_DIALOG_DATA))
], EditSavedQueryDialogComponent);
export { EditSavedQueryDialogComponent };
//# sourceMappingURL=edit-saved-query-dialog.component.js.map