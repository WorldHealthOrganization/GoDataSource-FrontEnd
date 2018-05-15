// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';

import { XtFormsModule } from './xt-forms/xt-forms.module';
import { AngularMaterialModule } from './angular-material/angular-material.module';

import * as fromSharedComponents from './components';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule
    ],
    declarations: [
        ...fromSharedComponents.components
    ],
    providers: [],
    exports: [
        CommonModule,
        RouterModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule
    ],
    entryComponents: [
        fromSharedComponents.SnackbarComponent
    ]
})
export class SharedModule {
}
