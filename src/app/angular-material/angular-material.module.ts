import { NgModule } from '@angular/core';

import {
    MatButtonModule,
    MatInputModule
} from '@angular/material';

@NgModule({
    imports: [
        MatButtonModule,
        MatInputModule
    ],
    exports: [
        MatButtonModule,
        MatInputModule
    ],
    declarations: []
})
export class AngularMaterialModule {
}
