import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxWigModule } from 'ngx-wig';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
import { DragDropModule } from '@angular/cdk/drag-drop';
import * as fromSharedComponents from './components';
import * as fromSharedPipes from './pipes';
import * as formV2Components from './forms-v2/components';
import * as v2Components from './components-v2';
import { AgGridModule } from '@ag-grid-community/angular';
import { ToastrModule } from 'ngx-toastr';
import { NgxMatTimepickerModule } from 'ngx-mat-timepicker';
import { ColorPickerModule } from 'ngx-color-picker';
import { CdkMenuModule } from '@angular/cdk/menu';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { validatorDirectives } from './forms-v2/validators';
import { NgxPopperjsModule } from 'ngx-popperjs';

@NgModule({
  imports: [
    AgGridModule,
    CdkMenuModule,
    ClipboardModule,
    ColorPickerModule,
    CommonModule,
    DragDropModule,
    RouterModule,
    FormsModule,
    FlexLayoutModule,
    AngularMaterialModule,
    TranslateModule,
    FileUploadModule,
    NgxWigModule,
    NgxMatTimepickerModule,
    NgxMatSelectSearchModule,
    NgxPopperjsModule,
    ScrollingModule,
    ExperimentalScrollingModule,
    ToastrModule.forRoot({
      extendedTimeOut: 5000,
      enableHtml: true,
      progressBar: true,
      progressAnimation: 'decreasing',
      positionClass: 'toast-top-center',
      maxOpened: 5,
      newestOnTop: false,
      closeButton: false
    })
  ],
  declarations: [
    ...validatorDirectives,
    ...fromSharedComponents.components,
    ...fromSharedPipes.pipes,
    ...formV2Components.components,
    ...v2Components.components
  ],
  providers: [],
  exports: [
    AgGridModule,
    CommonModule,
    DragDropModule,
    RouterModule,
    FormsModule,
    FlexLayoutModule,
    TranslateModule,
    AngularMaterialModule,
    NgxPopperjsModule,
    ScrollingModule,
    ExperimentalScrollingModule,
    ToastrModule,
    ...validatorDirectives,
    ...fromSharedPipes.pipes,
    ...fromSharedComponents.components,
    ...formV2Components.components,
    ...v2Components.components
  ]
})
export class SharedModule {
}
