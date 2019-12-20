import { ContactsOfContactsListComponent } from './contacts-of-contacts-list/contacts-of-contacts-list.component';
import {CreateContactOfContactComponent} from './create-contact-of-contact/create-contact-of-contact.component';
import {ModifyContactOfContactComponent} from './modify-contact-of-contact/modify-contact-of-contact.component';

// export each page component individually
export * from './contacts-of-contacts-list/contacts-of-contacts-list.component';
export * from './create-contact-of-contact/create-contact-of-contact.component';
export * from './modify-contact-of-contact/modify-contact-of-contact.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsOfContactsListComponent,
    CreateContactOfContactComponent,
    ModifyContactOfContactComponent
];
