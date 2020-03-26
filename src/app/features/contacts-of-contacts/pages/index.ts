import { ContactsOfContactsListComponent } from './contacts-of-contacts-list/contacts-of-contacts-list.component';
import { CreateContactOfContactComponent } from './create-contact-of-contact/create-contact-of-contact.component';
import { ModifyContactOfContactComponent } from './modify-contact-of-contact/modify-contact-of-contact.component';
import { ViewChronologyContactOfContactComponent } from './view-chronology-contact-of-contact/view-chronology-contact-of-contact.component';
import { ViewMovementContactOfContactComponent } from './view-movement-contact-of-contact/view-movement-contact-of-contact.component';

// export each page component individually
export * from './contacts-of-contacts-list/contacts-of-contacts-list.component';
export * from './create-contact-of-contact/create-contact-of-contact.component';
export * from './modify-contact-of-contact/modify-contact-of-contact.component';
export * from './view-chronology-contact-of-contact/view-chronology-contact-of-contact.component';
export * from './view-movement-contact-of-contact/view-movement-contact-of-contact.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsOfContactsListComponent,
    CreateContactOfContactComponent,
    ModifyContactOfContactComponent,

    ViewChronologyContactOfContactComponent,
    ViewMovementContactOfContactComponent
];
