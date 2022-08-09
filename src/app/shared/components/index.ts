// import each component
import { FormRelationshipComponent } from './form-relationship/form-relationship.component';
import { YesNoLabelComponent } from './yes-no-label/yes-no-label.component';
import { ReferenceDataLabelComponent } from './reference-data-label/reference-data-label.component';
import { ChronologyComponent } from './chronology/chronology.component';
import { LocationBreadcrumbsComponent } from './location-breadcrumbs/location-breadcrumbs.component';
import { FormRelationshipQuickComponent } from './form-relationship-quick/form-relationship-quick.component';
import { FormContactQuickComponent } from './form-contact-quick/form-contact-quick.component';
import { NumberOfItemsLabelComponent } from './number-of-items-label/number-of-items-label.component';
import { HoverRowActionsComponent } from './hover-row-actions/hover-row-actions.component';
import { FormCaseQuickComponent } from './form-case-quick/form-case-quick.component';
import { FormEventQuickComponent } from './form-event-quick/form-event-quick.component';
import { ListItemLabelComponent } from './list-item-label/list-item-label.component';
import { HotTableWrapperComponent } from './hot-table-wrapper/hot-table-wrapper.component';
import { FormContactOfContactQuickComponent } from './form-contact-of-contact-quick/form-contact-of-contact-quick.component';
import { FancyTooltipComponent } from './fancy-tooltip/fancy-tooltip.component';
import { PieDonutChartComponent } from './pie-donut-graph/pie-donut-chart.component';
import { MatPaginatorExtendedComponent } from './mat-paginator-extended/mat-paginator-extended.component';

// export necessary components individually
export * from './hover-row-actions/hover-row-actions.component';

// export the list of all components
export const components: any[] = [
  // inputs
  FormRelationshipComponent,
  FormRelationshipQuickComponent,
  FormContactQuickComponent,
  FormContactOfContactQuickComponent,
  FormCaseQuickComponent,
  FormEventQuickComponent,
  HotTableWrapperComponent,

  // display information
  YesNoLabelComponent,
  ListItemLabelComponent,
  ReferenceDataLabelComponent,
  LocationBreadcrumbsComponent,
  ChronologyComponent,

  // general
  NumberOfItemsLabelComponent,
  FancyTooltipComponent,

  // layout extensions
  HoverRowActionsComponent,

  // Graphs
  PieDonutChartComponent,

  // Material extensions
  MatPaginatorExtendedComponent
];
