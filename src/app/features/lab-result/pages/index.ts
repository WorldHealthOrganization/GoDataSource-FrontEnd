// import each page component
import { EntityLabResultsListComponent } from './entity-lab-results-list/entity-lab-results-list.component';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { LabResultsListComponent } from './lab-results-list/lab-results-list.component';
import { ModifyQuestionnaireLabResultComponent } from './modify-questionnaire-lab-result/modify-questionnaire-lab-result.component';
import {
  LabResultsCreateViewModifyComponent
} from './lab-result-create-view-modify/lab-results-create-view-modify.component';

// export each page component individually
export * from './entity-lab-results-list/entity-lab-results-list.component';
export * from './gantt-chart/gantt-chart.component';
export * from './lab-results-list/lab-results-list.component';
export * from './modify-questionnaire-lab-result/modify-questionnaire-lab-result.component';
export * from './lab-result-create-view-modify/lab-results-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  EntityLabResultsListComponent,
  GanttChartComponent,
  LabResultsListComponent,
  ModifyQuestionnaireLabResultComponent,
  LabResultsCreateViewModifyComponent
];
