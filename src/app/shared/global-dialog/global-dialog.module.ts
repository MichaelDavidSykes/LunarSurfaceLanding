import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GlobalDialogComponent } from './global-dialog.component';

@NgModule({
  declarations: [GlobalDialogComponent],
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  exports: [GlobalDialogComponent]
})
export class GlobalDialogModule {} 