// import each page component
import { CasesListComponent } from './cases-list/cases-list.component';
import { CreateCaseComponent } from './create-case/create-case.component';
import { ModifyCaseComponent } from './modify-case/modify-case.component';
import { CaseLabResultsListComponent } from './case-lab-results-list/case-lab-results-list.component';
import { CaseRelationshipsListComponent } from './case-relationships-list/case-relationships-list.component';
import { CreateCaseRelationshipComponent } from './create-case-relationship/create-case-relationship.component';

// export each page component individually
export * from './cases-list/cases-list.component';
export * from './create-case/create-case.component';
export * from './modify-case/modify-case.component';
export * from './case-lab-results-list/case-lab-results-list.component';
export * from './case-relationships-list/case-relationships-list.component';
export * from './create-case-relationship/create-case-relationship.component';

// export the list of all page components
export const pageComponents: any[] = [
    CasesListComponent,
    CreateCaseComponent,
    ModifyCaseComponent,
    CaseLabResultsListComponent,
    CaseRelationshipsListComponent,
    CreateCaseRelationshipComponent
];
