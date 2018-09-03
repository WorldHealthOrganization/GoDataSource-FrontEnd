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
import { NgSelectModule } from '@ng-select/ng-select';
import { ResizableModule } from 'angular-resizable-element';

@NgModule({
    imports: [
        CommonModule,
        RouterModule,
        NgSelectModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule,
        TranslateModule,
        ResizableModule
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
        NgSelectModule,
        FormsModule,
        FlexLayoutModule,
        TranslateModule,
        XtFormsModule,
        AngularMaterialModule,
        ResizableModule,
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes,
        ...fromSharedComponents.components,
    ],
    entryComponents: [
        fromSharedComponents.SnackbarComponent,
        fromSharedComponents.DialogComponent
    ]
})
export class SharedModule {
}
