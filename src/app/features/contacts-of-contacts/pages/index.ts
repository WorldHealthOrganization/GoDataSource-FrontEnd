import { ContactsOfContactsListComponent } from './contacts-of-contacts-list/contacts-of-contacts-list.component';
import { ViewChronologyContactOfContactComponent } from './view-chronology-contact-of-contact/view-chronology-contact-of-contact.component';
import { ViewMovementContactOfContactComponent } from './view-movement-contact-of-contact/view-movement-contact-of-contact.component';
import { ContactsOfContactsCreateViewModifyComponent } from './contacts-of-contacts-create-view-modify/contacts-of-contacts-create-view-modify.component';
import { ContactsOfContactsBulkCreateModifyComponent } from './contacts-of-contacts-bulk-create-modify/contacts-of-contacts-bulk-create-modify.component';

// export each page component individually
export * from './contacts-of-contacts-bulk-create-modify/contacts-of-contacts-bulk-create-modify.component';
export * from './contacts-of-contacts-list/contacts-of-contacts-list.component';
export * from './view-chronology-contact-of-contact/view-chronology-contact-of-contact.component';
export * from './view-movement-contact-of-contact/view-movement-contact-of-contact.component';
export * from './contacts-of-contacts-create-view-modify/contacts-of-contacts-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  ContactsOfContactsBulkCreateModifyComponent,
  ContactsOfContactsCreateViewModifyComponent,
  ContactsOfContactsListComponent,
  ViewChronologyContactOfContactComponent,
  ViewMovementContactOfContactComponent
];
