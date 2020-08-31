// import each page component
import { DuplicateRecordsListComponent } from './duplicate-records-list/duplicate-records-list.component';
import { CaseMergeDuplicateRecordsComponent } from './case-merge-duplicate-records/case-merge-duplicate-records.component';
import { ContactMergeDuplicateRecordsComponent } from './contact-merge-duplicate-records/contact-merge-duplicate-records.component';
import { EventMergeDuplicateRecordsComponent } from './event-merge-duplicate-records/event-merge-duplicate-records.component';
import { MarkedNotDuplicatesListComponent } from './marked-not-duplicates-list/marked-not-duplicates-list.component';
import { ContactOfContactMergeDuplicateComponent } from './contact-of-contact-merge-duplicate/contact-of-contact-merge-duplicate.component';

// export each page component individually
export * from './duplicate-records-list/duplicate-records-list.component';
export * from './case-merge-duplicate-records/case-merge-duplicate-records.component';
export * from './contact-merge-duplicate-records/contact-merge-duplicate-records.component';
export * from './contact-of-contact-merge-duplicate/contact-of-contact-merge-duplicate.component';
export * from './event-merge-duplicate-records/event-merge-duplicate-records.component';
export * from './marked-not-duplicates-list/marked-not-duplicates-list.component';

// export the list of all page components
export const pageComponents: any[] = [
    DuplicateRecordsListComponent,
    CaseMergeDuplicateRecordsComponent,
    ContactMergeDuplicateRecordsComponent,
    ContactOfContactMergeDuplicateComponent,
    EventMergeDuplicateRecordsComponent,

    MarkedNotDuplicatesListComponent
];
