// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
// import { CreateCaseComponent } from './create-case/create-case.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
// export * from './create-case/create-case.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsListComponent//,
    // CreateCaseComponent
];
