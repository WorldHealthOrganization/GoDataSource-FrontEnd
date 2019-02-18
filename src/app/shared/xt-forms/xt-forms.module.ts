// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { TranslateModule } from '@ngx-translate/core';

import { components } from './components';
import { validatorDirectives } from './validators';
import { Ng5SliderModule } from 'ng5-slider';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule,
        Ng5SliderModule,
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
        Ng5SliderModule,
        ...components,
        ...validatorDirectives
    ]
})
export class XtFormsModule {
}
