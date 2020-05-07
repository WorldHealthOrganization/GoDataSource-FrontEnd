// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { TranslateModule } from '@ngx-translate/core';
import { Ng5SliderModule } from 'ng5-slider';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';

import { components } from './components';
import { validatorDirectives } from './validators';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        FlexLayoutModule,
        AngularMaterialModule,
        Ng5SliderModule,
        NgxMatSelectSearchModule,
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
