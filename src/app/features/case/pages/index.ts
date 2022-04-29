// import each page component
import { CasesListComponent } from './cases-list/cases-list.component';
import { ViewMovementCaseComponent } from './view-movement-case/view-movement-case.component';
import { ViewChronologyCaseComponent } from './view-chronology-case/view-chronology-case.component';
import { ModifyQuestionnaireCaseComponent } from './modify-questionnaire-case/modify-questionnaire-case.component';
import { CasesCreateViewModifyComponent } from './cases-create-view-modify/cases-create-view-modify.component';

// export each page component individually
export * from './cases-create-view-modify/cases-create-view-modify.component';
export * from './cases-list/cases-list.component';
export * from './modify-questionnaire-case/modify-questionnaire-case.component';
export * from './view-movement-case/view-movement-case.component';
export * from './view-chronology-case/view-chronology-case.component';

// export the list of all page components
export const pageComponents: any[] = [
  CasesCreateViewModifyComponent,
  CasesListComponent,

  ModifyQuestionnaireCaseComponent,
  ViewMovementCaseComponent,
  ViewChronologyCaseComponent
];
