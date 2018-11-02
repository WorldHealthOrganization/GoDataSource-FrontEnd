// import each page component
import { CasesListComponent } from './cases-list/cases-list.component';
import { CreateCaseComponent } from './create-case/create-case.component';
import { ModifyCaseComponent } from './modify-case/modify-case.component';
import { CaseLabResultsListComponent } from './case-lab-results-list/case-lab-results-list.component';
import { CreateCaseLabResultComponent } from './create-case-lab-result/create-case-lab-result.component';
import { ModifyCaseLabResultComponent } from './modify-case-lab-result/modify-case-lab-result.component';
import { ViewMovementCaseComponent } from './view-movement-case/view-movement-case.component';
import { ViewChronologyCaseComponent } from './view-chronology-case/view-chronology-case.component';
import { LabResultsComponent } from './lab-results/lab-results.component';

// export each page component individually
export * from './cases-list/cases-list.component';
export * from './create-case/create-case.component';
export * from './modify-case/modify-case.component';
export * from './case-lab-results-list/case-lab-results-list.component';
export * from './create-case-lab-result/create-case-lab-result.component';
export * from './modify-case-lab-result/modify-case-lab-result.component';
export * from './view-movement-case/view-movement-case.component';
export * from './view-chronology-case/view-chronology-case.component';
export * from './lab-results/lab-results.component';

// export the list of all page components
export const pageComponents: any[] = [
    CasesListComponent,
    CreateCaseComponent,
    ModifyCaseComponent,
    ViewMovementCaseComponent,
    CaseLabResultsListComponent,
    CreateCaseLabResultComponent,
    ModifyCaseLabResultComponent,
    ViewChronologyCaseComponent,
    LabResultsComponent
];
