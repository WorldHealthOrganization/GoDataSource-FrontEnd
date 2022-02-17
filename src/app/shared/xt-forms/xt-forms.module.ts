// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AngularMaterialModule } from '../angular-material/angular-material.module';
import { TranslateModule } from '@ngx-translate/core';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { components } from './components';
import { validatorDirectives } from './validators';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { NgxPopperjsModule } from 'ngx-popperjs';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    AngularMaterialModule,
    NgxMaterialTimepickerModule,
    NgxMatSelectSearchModule,
    NgxPopperjsModule,
    NgxSliderModule,
    TranslateModule,
    ScrollingModule
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
    NgxPopperjsModule,
    NgxSliderModule,
    ScrollingModule,
    ...components,
    ...validatorDirectives
  ]
})
export class XtFormsModule {
}
