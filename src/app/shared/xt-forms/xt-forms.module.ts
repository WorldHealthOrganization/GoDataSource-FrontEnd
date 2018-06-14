// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { TranslateModule } from '@ngx-translate/core';

import { components } from './components';
import { validatorDirectives } from './validators';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule,
        TranslateModule
    ],
    declarations: [
        ...components,
        ...validatorDirectives
    ],
    providers: [],
    exports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule,
        ...components,
        ...validatorDirectives
    ]
})
export class XtFormsModule {
}
