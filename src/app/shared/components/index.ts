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

    // dashboard
    DashboardCustomMetricDashletComponent,
    CytoscapeGraphComponent,

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

    // display information
    CountedItemsListComponent,
    YesNoLabelComponent,
    ReferenceDataLabelComponent,

    // dialogs
    DialogComponent
];
