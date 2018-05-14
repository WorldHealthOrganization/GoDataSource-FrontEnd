import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    MatMenuModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule
    ],
    declarations: [],
    exports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule,
        MatMenuModule
    ]
})
export class AngularMaterialModule {
}
