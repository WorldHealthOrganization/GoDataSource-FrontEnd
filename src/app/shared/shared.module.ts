// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';

import { XtFormsModule } from './modules/xt-forms/xt-forms.module';
import { AngularMaterialModule } from './angular-material/angular-material.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule
    ],
    declarations: [],
    providers: [],
    exports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule
    ]
})
export class SharedModule {
}
