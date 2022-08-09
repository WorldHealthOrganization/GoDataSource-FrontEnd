// import each component
import { FormAddressComponent } from './form-address/form-address.component';
import { FormDocumentComponent } from './form-document/form-document.component';
import { FormRangeComponent } from './form-range/form-range.component';
import { DialogComponent } from './dialog/dialog.component';
import { FormRelationshipComponent } from './form-relationship/form-relationship.component';
import { YesNoLabelComponent } from './yes-no-label/yes-no-label.component';
import { ReferenceDataLabelComponent } from './reference-data-label/reference-data-label.component';
import { ChronologyComponent } from './chronology/chronology.component';
import { LocationBreadcrumbsComponent } from './location-breadcrumbs/location-breadcrumbs.component';
import { FormAgeComponent } from './form-age/form-age.component';
import { FormAgeDobComponent } from './form-age-dob/form-age-dob.component';
import { FormRelationshipQuickComponent } from './form-relationship-quick/form-relationship-quick.component';
import { FormContactQuickComponent } from './form-contact-quick/form-contact-quick.component';
import { LoadingDialogComponent } from './loading-dialog/loading-dialog.component';
import { NumberOfItemsLabelComponent } from './number-of-items-label/number-of-items-label.component';
import { FormCaseCenterDaterangeComponent } from './form-case-center-daterange/form-case-center-daterange.component';
import { HoverRowActionsComponent } from './hover-row-actions/hover-row-actions.component';
import { FormLocationIdentifierListComponent } from './form-location-identifier-list/form-location-identifier-list.component';
import { FormLocationIdentifierComponent } from './form-location-identifier/form-location-identifier.component';
import { FormCaseQuickComponent } from './form-case-quick/form-case-quick.component';
import { FormEventQuickComponent } from './form-event-quick/form-event-quick.component';
import { ListItemLabelComponent } from './list-item-label/list-item-label.component';
import { HotTableWrapperComponent } from './hot-table-wrapper/hot-table-wrapper.component';
import { FormContactOfContactQuickComponent } from './form-contact-of-contact-quick/form-contact-of-contact-quick.component';
import { FancyTooltipComponent } from './fancy-tooltip/fancy-tooltip.component';
import { PieDonutChartComponent } from './pie-donut-graph/pie-donut-chart.component';
import { MatPaginatorExtendedComponent } from './mat-paginator-extended/mat-paginator-extended.component';

// export necessary components individually
export * from './dialog/dialog.component';
export * from './loading-dialog/loading-dialog.component';
export * from './hover-row-actions/hover-row-actions.component';

// export the list of all components
export const components: any[] = [
  // inputs
  FormAddressComponent,
  FormDocumentComponent,
  FormRangeComponent,
  FormRelationshipComponent,
  FormAgeComponent,
  FormAgeDobComponent,
  FormRelationshipQuickComponent,
  FormContactQuickComponent,
  FormContactOfContactQuickComponent,
  FormCaseQuickComponent,
  FormEventQuickComponent,
  FormLocationIdentifierListComponent,
  FormLocationIdentifierComponent,
  HotTableWrapperComponent,

  // display information
  YesNoLabelComponent,
  ListItemLabelComponent,
  ReferenceDataLabelComponent,
  LocationBreadcrumbsComponent,
  ChronologyComponent,

  // dialogs
  DialogComponent,
  LoadingDialogComponent,

  // general
  NumberOfItemsLabelComponent,
  FormCaseCenterDaterangeComponent,
  FancyTooltipComponent,

  // layout extensions
  HoverRowActionsComponent,

  // Graphs
  PieDonutChartComponent,

  // Material extensions
  MatPaginatorExtendedComponent
];
