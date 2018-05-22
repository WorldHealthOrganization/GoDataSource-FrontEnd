import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatSelectModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatCardModule,
        MatTableModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule
    ],
    declarations: [],
    exports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatCardModule,
        MatTableModule,
        MatChipsModule,
        MatTooltipModule,
        MatSelectModule
    ]
})
export class AngularMaterialModule {
}
