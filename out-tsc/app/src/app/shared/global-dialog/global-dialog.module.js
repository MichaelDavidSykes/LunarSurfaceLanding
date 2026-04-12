import { __decorate } from "tslib";
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { GlobalDialogComponent } from './global-dialog.component';
let GlobalDialogModule = class GlobalDialogModule {
};
GlobalDialogModule = __decorate([
    NgModule({
        declarations: [GlobalDialogComponent],
        imports: [CommonModule, MatDialogModule, MatButtonModule],
        exports: [GlobalDialogComponent]
    })
], GlobalDialogModule);
export { GlobalDialogModule };
//# sourceMappingURL=global-dialog.module.js.map