// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { CreateContactComponent } from './create-contact/create-contact.component';
import { ModifyContactComponent } from './modify-contact/modify-contact.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
export * from './create-contact/create-contact.component';
export * from './modify-contact/modify-contact.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsListComponent,
    CreateContactComponent,
    ModifyContactComponent
];
