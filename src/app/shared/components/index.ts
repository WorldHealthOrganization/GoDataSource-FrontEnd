// import each component
import { ChronologyComponent } from './chronology/chronology.component';
import { FormRelationshipQuickComponent } from './form-relationship-quick/form-relationship-quick.component';
import { FormContactQuickComponent } from './form-contact-quick/form-contact-quick.component';
import { HoverRowActionsComponent } from './hover-row-actions/hover-row-actions.component';
import { FormCaseQuickComponent } from './form-case-quick/form-case-quick.component';
import { FormEventQuickComponent } from './form-event-quick/form-event-quick.component';
import { FormContactOfContactQuickComponent } from './form-contact-of-contact-quick/form-contact-of-contact-quick.component';
import { FancyTooltipComponent } from './fancy-tooltip/fancy-tooltip.component';
import { PieDonutChartComponent } from './pie-donut-graph/pie-donut-chart.component';
import { MatPaginatorExtendedComponent } from './mat-paginator-extended/mat-paginator-extended.component';

// export necessary components individually
export * from './hover-row-actions/hover-row-actions.component';

// export the list of all components
export const components: any[] = [
  // inputs
  FormRelationshipQuickComponent,
  FormContactQuickComponent,
  FormContactOfContactQuickComponent,
  FormCaseQuickComponent,
  FormEventQuickComponent,

  // display information
  ChronologyComponent,

  // general
  FancyTooltipComponent,

  // layout extensions
  HoverRowActionsComponent,

  // Graphs
  PieDonutChartComponent,

  // Material extensions
  MatPaginatorExtendedComponent
];
