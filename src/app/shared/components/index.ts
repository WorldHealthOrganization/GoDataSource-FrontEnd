// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { BreadcrumbsComponent} from './breadcrumbs/breadcrumbs.component';
import { FormAddressComponent } from './form-address/form-address.component';
import { FormAddressListComponent } from './form-address-list/form-address-list.component';
import { FormDocumentComponent } from './form-document/form-document.component';
import { FormDocumentListComponent } from './form-document-list/form-document-list.component';
import { FormRangeComponent } from './form-range/form-range.component';
import { NotAuthTemplateComponent } from './not-auth-template/not-auth-template.component';
import { DialogComponent } from './dialog/dialog.component';
import { FormRelationshipComponent } from './form-relationship/form-relationship.component';
import { SideFiltersComponent } from './side-filters/side-filters.component';
import { CountedItemsListComponent } from './counted-items-list/counted-items-list.component';
import { YesNoLabelComponent } from './yes-no-label/yes-no-label.component';
import { FormFillQuestionnaireComponent } from './form-fill-questionnaire/form-fill-questionnaire.component';
import { ReferenceDataLabelComponent } from './reference-data-label/reference-data-label.component';
import { FormInputListComponent } from './form-input-list/form-input-list.component';
import { FormLocationDropdownComponent } from './form-location-dropdown/form-location-dropdown.component';
import { CytoscapeGraphComponent } from './cytoscape-graph/cytoscape-graph.component';
import { DashboardCustomMetricDashletComponent } from './dashboard-custom-metric-dashlet/dashboard-custom-metric-dashlet.component';
import { GoogleMapComponent } from './google-map/google-map.component';
import { GoogleMapMovementComponent } from './google-map-movement/google-map-movement.component';
import { ChronologyComponent } from './chronology/chronology.component';
import { ExportButtonComponent } from './export-button/export-button.component';
import { LocationBreadcrumbsComponent } from './location-breadcrumbs/location-breadcrumbs.component';
import { SideColumnsComponent } from './side-columns/side-columns.component';
import { FormAgeComponent } from './form-age/form-age.component';
import { AgeLabelComponent } from './age-label/age-label.component';
import { FormAgeDobComponent } from './form-age-dob/form-age-dob.component';
import { FormSubQuestionListComponent } from './form-sub-question-list/form-sub-question-list.component';
import { FormQuestionListComponent } from './form-question-list/form-question-list.component';
import { FormSubAnswerListComponent } from './form-sub-answer-list/form-sub-answer-list.component';
import { FormAnswerListComponent } from './form-answer-list/form-answer-list.component';
import { C3StackedBarChartComponent } from './c3-stacked-bar-chart/c3-stacked-bar-chart.component';

// export necessary components individually
export * from './snackbar/snackbar.component';
export * from './dialog/dialog.component';
export * from './counted-items-list/counted-items-list.component';

// export the list of all components
export const components: any[] = [
    // popups
    SnackbarComponent,

    // main layout
    TopnavComponent,
    BreadcrumbsComponent,
    SideFiltersComponent,
    SideColumnsComponent,

    // dashboard
    DashboardCustomMetricDashletComponent,
    CytoscapeGraphComponent,
    C3StackedBarChartComponent,

    // google
    GoogleMapComponent,
    GoogleMapMovementComponent,

    // authentication - #TODO - this needs to be refactored & removed
    NotAuthTemplateComponent,

    // inputs
    FormAddressComponent,
    FormAddressListComponent,
    FormDocumentComponent,
    FormDocumentListComponent,
    FormRangeComponent,
    FormRelationshipComponent,
    FormInputListComponent,
    FormLocationDropdownComponent,
    FormFillQuestionnaireComponent,
    FormAgeComponent,
    FormAgeDobComponent,

    // answers/questions
    FormAnswerListComponent,
    FormSubAnswerListComponent,
    FormQuestionListComponent,
    FormSubQuestionListComponent,

    // display information
    CountedItemsListComponent,
    YesNoLabelComponent,
    ReferenceDataLabelComponent,
    LocationBreadcrumbsComponent,
    ChronologyComponent,
    AgeLabelComponent,

    // dialogs
    DialogComponent,

    // general
    ExportButtonComponent
];
