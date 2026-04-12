import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

type SnackbarTone = 'success' | 'error' | 'warning' | 'info';

@Injectable({ providedIn: 'root' })
export class GlobalSnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  open(message: string, toneOrAction: string = 'info', duration: number = 4000, action?: string) {
    const lowered = (toneOrAction || '').trim().toLowerCase();
    const isTone = lowered === 'success' || lowered === 'error' || lowered === 'warning' || lowered === 'info';
    const tone: SnackbarTone = isTone ? (lowered as SnackbarTone) : 'info';
    const actionLabel = isTone ? (action ?? 'Dismiss') : (toneOrAction || action || 'Dismiss');

    this.snackBar.open(message, actionLabel, {
      duration,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['global-snackbar', `global-snackbar--${tone}`]
    });
  }
} 
