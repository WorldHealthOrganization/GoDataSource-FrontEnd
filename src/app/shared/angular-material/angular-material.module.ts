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
    MatChipsModule
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
        MatChipsModule
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
        MatChipsModule
    ]
})
export class AngularMaterialModule {
}
