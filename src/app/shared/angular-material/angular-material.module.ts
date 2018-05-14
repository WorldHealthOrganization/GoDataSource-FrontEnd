import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule
    ],
    declarations: [],
    exports: [
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule
    ]
})
export class AngularMaterialModule {
}
