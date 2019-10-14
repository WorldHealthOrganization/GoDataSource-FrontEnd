// modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { XtFormsModule } from './xt-forms/xt-forms.module';
import { AngularMaterialModule } from './angular-material/angular-material.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { MglTimelineModule } from 'angular-mgl-timeline';
import { FileUploadModule } from 'ng2-file-upload';
import { NgxWigModule } from 'ngx-wig';
import { HotTableModule } from '@handsontable/angular';

// components
import * as fromSharedComponents from './components';
import * as fromSharedDirectives from './directives';
import * as fromSharedPipes from './pipes';

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
        MglTimelineModule,
        FileUploadModule,
        NgxWigModule,
        HotTableModule.forRoot()
    ],
    declarations: [
        ...fromSharedComponents.components,
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes
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
        MglTimelineModule,
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes,
        ...fromSharedComponents.components
    ],
    entryComponents: [
        fromSharedComponents.SnackbarComponent,
        fromSharedComponents.DialogComponent,
        fromSharedComponents.ModifyContactFollowUpQuestionnaireDialogComponent,
        fromSharedComponents.LoadingDialogComponent,
        fromSharedComponents.ViewCotNodeDialogComponent,
        fromSharedComponents.ViewCotEdgeDialogComponent,
        fromSharedComponents.ViewHelpDialogComponent,
        fromSharedComponents.ViewHelpDetailsDialogComponent
    ]
})
export class SharedModule {
}
