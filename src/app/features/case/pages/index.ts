// import each page component
import { CasesListComponent } from './cases-list/cases-list.component';
import { CreateCaseComponent } from './create-case/create-case.component';
import { ModifyCaseComponent } from './modify-case/modify-case.component';
import { ViewMovementCaseComponent } from './view-movement-case/view-movement-case.component';
import { ViewChronologyCaseComponent } from './view-chronology-case/view-chronology-case.component';
import { ModifyQuestionnaireCaseComponent } from './modify-questionnaire-case/modify-questionnaire-case.component';

// export each page component individually
export * from './cases-list/cases-list.component';
export * from './create-case/create-case.component';
export * from './modify-case/modify-case.component';
export * from './modify-questionnaire-case/modify-questionnaire-case.component';
export * from './view-movement-case/view-movement-case.component';
export * from './view-chronology-case/view-chronology-case.component';

// export the list of all page components
export const pageComponents: any[] = [
    CasesListComponent,
    CreateCaseComponent,
    ModifyCaseComponent,
    ModifyQuestionnaireCaseComponent,
    ViewMovementCaseComponent,
    ViewChronologyCaseComponent
];
