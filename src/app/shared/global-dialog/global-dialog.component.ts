import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface GlobalDialogData {
  title?: string;
  message: string;
  okText?: string;
}

@Component({
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
})
export class GlobalDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<GlobalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GlobalDialogData
  ) {}

  onClose(): void {
    this.dialogRef.close();
  }
} 