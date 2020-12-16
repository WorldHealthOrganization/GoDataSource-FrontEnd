// import each page component
import { EntityLabResultsListComponent } from './entity-lab-results-list/entity-lab-results-list.component';
import { CreateLabResultComponent } from './create-lab-result/create-lab-result.component';
import { GanttChartComponent } from './gantt-chart/gantt-chart.component';
import { LabResultsListComponent } from './lab-results-list/lab-results-list.component';
import { ModifyLabResultComponent } from './modify-lab-result/modify-lab-result.component';
import { ModifyQuestionnaireLabResultComponent } from './modify-questionnaire-lab-result/modify-questionnaire-lab-result.component';

// export each page component individually
export * from './entity-lab-results-list/entity-lab-results-list.component';
export * from './create-lab-result/create-lab-result.component';
export * from './gantt-chart/gantt-chart.component';
export * from './lab-results-list/lab-results-list.component';
export * from './modify-lab-result/modify-lab-result.component';
export * from './modify-questionnaire-lab-result/modify-questionnaire-lab-result.component';

// export the list of all page components
export const pageComponents: any[] = [
    EntityLabResultsListComponent,
    CreateLabResultComponent,
    GanttChartComponent,
    LabResultsListComponent,
    ModifyLabResultComponent,
    ModifyQuestionnaireLabResultComponent
];
