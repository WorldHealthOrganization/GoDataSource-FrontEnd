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
import * as fromSharedPipes from './pipes';

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
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes,
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
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes,
        ...fromSharedComponents.components,
    ],
    entryComponents: [
        fromSharedComponents.SnackbarComponent,
        fromSharedComponents.DialogConfirmComponent
    ]
})
export class SharedModule {
}
