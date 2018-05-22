import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTableModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatCardModule,
    MatNativeDateModule,
    MatDatepickerModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule,
        MatTableModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatCardModule,
        MatNativeDateModule,
        MatDatepickerModule
    ],
    declarations: [],
    exports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule,
        MatTableModule,
        MatSlideToggleModule,
        MatTabsModule,
        MatCardModule,
        MatNativeDateModule,
        MatDatepickerModule
    ]
})
export class AngularMaterialModule {
}
