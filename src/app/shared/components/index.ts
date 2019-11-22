// import each component
import { SnackbarComponent } from './snackbar/snackbar.component';
import { TopnavComponent } from './topnav/topnav.component';
import { BreadcrumbsComponent } from './breadcrumbs/breadcrumbs.component';
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
import { ChronologyComponent } from './chronology/chronology.component';
import { ExportButtonComponent } from './export-button/export-button.component';
import { LocationBreadcrumbsComponent } from './location-breadcrumbs/location-breadcrumbs.component';
import { SideColumnsComponent } from './side-columns/side-columns.component';
import { FormAgeComponent } from './form-age/form-age.component';
import { AgeLabelComponent } from './age-label/age-label.component';
import { FormAgeDobComponent } from './form-age-dob/form-age-dob.component';
import { FormNameUrlListComponent } from './form-name-url-list/form-name-url-list.component';
import { FormRelationshipQuickComponent } from './form-relationship-quick/form-relationship-quick.component';
import { ModifyContactFollowUpQuestionnaireDialogComponent } from './modify-contact-follow-up-questionnaire-dialog/modify-contact-follow-up-questionnaire-dialog.component';
import { ColorListLegendComponent } from './color-list-legend/color-list-legend.component';
import { FormContactQuickComponent } from './form-contact-quick/form-contact-quick.component';
import { TotalNumberOfRecordsComponent } from './total-number-of-records/total-number-of-records.component';
import { LoadingDialogComponent } from './loading-dialog/loading-dialog.component';
import { GlobalEntitySearchComponent } from './global-entity-search/global-entity-search.component';
import { NumberOfItemsLabelComponent } from './number-of-items-label/number-of-items-label.component';
import { FormCaseCenterDaterangeComponent } from './form-case-center-daterange/form-case-center-daterange.component';
import { FormCaseCenterDaterangeListComponent } from './form-case-center-daterange-list/form-case-center-daterange-list.component';
import { ViewCotNodeDialogComponent } from './view-cot-node-dialog/view-cot-node-dialog.component';
import { ViewCotEdgeDialogComponent } from './view-cot-edge-dialog/view-cot-edge-dialog.component';
import { ViewHelpDialogComponent } from './view-help-dialog/view-help-dialog.component';
import { ViewHelpDetailsDialogComponent } from './view-help-details-dialog/view-help-details-dialog.component';
import { FormModifyQuestionnaireComponent } from './form-modify-questionnaire/form-modify-questionnaire.component';
import { HoverRowActionsComponent } from './hover-row-actions/hover-row-actions.component';
import { FormLocationIdentifierListComponent } from './form-location-identifier-list/form-location-identifier-list.component';
import { FormLocationIdentifierComponent } from './form-location-identifier/form-location-identifier.component';
import { FormCaseQuickComponent } from './form-case-quick/form-case-quick.component';
import { FormEventQuickComponent } from './form-event-quick/form-event-quick.component';
import { FormSelectChangeDetectionPushComponent } from './form-select-change-detection-push/form-select-change-detection-push.component';
import { ListItemLabelComponent } from './list-item-label/list-item-label.component';
import { FormNgxWigComponent } from './form-ngx-wig/form-ngx-wig.component';
import { FormVaccinesListComponent } from './form-vaccines-list/form-vaccines-list.component';
import { HotTableWrapperComponent } from './hot-table-wrapper/hot-table-wrapper.component';
import { LocationDialogComponent } from './location-dialog/location-dialog.component';
import { ViewEntityRelationshipsComponent } from './view-entity-relationships/view-entity-relationships.component';

// export necessary components individually
export * from './snackbar/snackbar.component';
export * from './dialog/dialog.component';
export * from './modify-contact-follow-up-questionnaire-dialog/modify-contact-follow-up-questionnaire-dialog.component';
export * from './loading-dialog/loading-dialog.component';
export * from './counted-items-list/counted-items-list.component';
export * from './view-cot-node-dialog/view-cot-node-dialog.component';
export * from './view-cot-edge-dialog/view-cot-edge-dialog.component';
export * from './view-help-dialog/view-help-dialog.component';
export * from './view-help-details-dialog/view-help-details-dialog.component';
export * from './form-modify-questionnaire/form-modify-questionnaire.component';
export * from './hover-row-actions/hover-row-actions.component';
export * from './location-dialog/location-dialog.component';
export * from './view-entity-relationships/view-entity-relationships.component';

// export the list of all components
export const components: any[] = [
    // popups
    SnackbarComponent,

    // main layout
    TopnavComponent,
    BreadcrumbsComponent,
    SideFiltersComponent,
    SideColumnsComponent,
    GlobalEntitySearchComponent,

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
    FormNameUrlListComponent,
    FormLocationDropdownComponent,
    FormModifyQuestionnaireComponent,
    FormFillQuestionnaireComponent,
    FormAgeComponent,
    FormAgeDobComponent,
    FormRelationshipQuickComponent,
    FormContactQuickComponent,
    FormCaseQuickComponent,
    FormEventQuickComponent,
    FormLocationIdentifierListComponent,
    FormLocationIdentifierComponent,
    FormNgxWigComponent,
    FormVaccinesListComponent,
    HotTableWrapperComponent,

    // display information
    CountedItemsListComponent,
    YesNoLabelComponent,
    ListItemLabelComponent,
    ReferenceDataLabelComponent,
    LocationBreadcrumbsComponent,
    ChronologyComponent,
    AgeLabelComponent,
    ColorListLegendComponent,
    TotalNumberOfRecordsComponent,

    // dialogs
    DialogComponent,
    ModifyContactFollowUpQuestionnaireDialogComponent,
    LoadingDialogComponent,
    ViewCotNodeDialogComponent,
    ViewCotEdgeDialogComponent,
    ViewHelpDialogComponent,
    ViewHelpDetailsDialogComponent,
    LocationDialogComponent,
    ViewEntityRelationshipsComponent,

    // general
    ExportButtonComponent,
    NumberOfItemsLabelComponent,
    FormCaseCenterDaterangeComponent,
    FormCaseCenterDaterangeListComponent,
    FormSelectChangeDetectionPushComponent,

    // layout extensions
    HoverRowActionsComponent
];
