// import each component
import { ChronologyComponent } from './chronology/chronology.component';
import { FancyTooltipComponent } from './fancy-tooltip/fancy-tooltip.component';
import { PieDonutChartComponent } from './pie-donut-graph/pie-donut-chart.component';
import { MatPaginatorExtendedComponent } from './mat-paginator-extended/mat-paginator-extended.component';

// export the list of all components
export const components: any[] = [
  // display information
  ChronologyComponent,

  // general
  FancyTooltipComponent,

  // Graphs
  PieDonutChartComponent,

  // Material extensions
  MatPaginatorExtendedComponent
];
