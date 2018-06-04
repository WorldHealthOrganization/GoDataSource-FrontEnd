// import each page component
import { CasesListComponent } from './cases-list/cases-list.component';
import { CreateCaseComponent } from './create-case/create-case.component';

// export each page component individually
export * from './cases-list/cases-list.component';
export * from './create-case/create-case.component';

// export the list of all page components
export const pageComponents: any[] = [
    CasesListComponent,
    CreateCaseComponent
];
