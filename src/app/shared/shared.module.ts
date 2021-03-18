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
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { ScrollingModule as ExperimentalScrollingModule } from '@angular/cdk-experimental/scrolling';
import { MdePopoverModule } from '@material-extended/mde';
import { DragDropModule } from '@angular/cdk/drag-drop';

// components
import * as fromSharedComponents from './components';
import * as fromSharedDirectives from './directives';
import * as fromSharedPipes from './pipes';

@NgModule({
    imports: [
        CommonModule,
        DragDropModule,
        RouterModule,
        NgSelectModule,
        FormsModule,
        FlexLayoutModule,
        XtFormsModule,
        AngularMaterialModule,
        TranslateModule,
        MdePopoverModule,
        MglTimelineModule,
        FileUploadModule,
        NgxWigModule,
        NgxMatSelectSearchModule,
        HotTableModule.forRoot(),
        ScrollingModule,
        ExperimentalScrollingModule
    ],
    declarations: [
        ...fromSharedComponents.components,
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes
    ],
    providers: [],
    exports: [
        CommonModule,
        DragDropModule,
        RouterModule,
        NgSelectModule,
        FormsModule,
        FlexLayoutModule,
        TranslateModule,
        XtFormsModule,
        AngularMaterialModule,
        MdePopoverModule,
        MglTimelineModule,
        ScrollingModule,
        ExperimentalScrollingModule,
        ...fromSharedDirectives.directives,
        ...fromSharedPipes.pipes,
        ...fromSharedComponents.components
    ],
    entryComponents: [
        fromSharedComponents.MultipleSnackbarComponent,
        fromSharedComponents.DialogComponent,
        fromSharedComponents.ModifyContactFollowUpQuestionnaireDialogComponent,
        fromSharedComponents.LoadingDialogComponent,
        fromSharedComponents.ViewCotNodeDialogComponent,
        fromSharedComponents.ViewCotEdgeDialogComponent,
        fromSharedComponents.ViewHelpDialogComponent,
        fromSharedComponents.ViewHelpDetailsDialogComponent,
        fromSharedComponents.LocationDialogComponent
    ]
})
export class SharedModule {
}
