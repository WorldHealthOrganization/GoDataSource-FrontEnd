// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { XtFormsModule } from './xt-forms/xt-forms.module';
import { AngularMaterialModule } from './angular-material/angular-material.module';

import * as fromSharedComponents from './components';
import * as fromSharedDirectives from './directives';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule,
        TranslateModule
    ],
    declarations: [
        ...fromSharedComponents.components,
        ...fromSharedDirectives.directives
    ],
    providers: [],
    exports: [
        CommonModule,
        RouterModule,
        FormsModule,
        FlexLayoutModule,
        TranslateModule,
        XtFormsModule,
        AngularMaterialModule,
        ...fromSharedComponents.components,
        ...fromSharedDirectives.directives
    ],
    entryComponents: [
        fromSharedComponents.SnackbarComponent,
        fromSharedComponents.DialogConfirmComponent
    ]
})
export class SharedModule {
}
