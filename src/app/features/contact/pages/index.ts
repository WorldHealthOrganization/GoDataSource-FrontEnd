// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { CreateContactFollowUpComponent } from './create-contact-follow-up/create-contact-follow-up.component';
import { ModifyContactFollowUpComponent } from './modify-contact-follow-up/modify-contact-follow-up.component';
import { ViewMovementContactComponent } from './view-movement-contact/view-movement-contact.component';
import { ViewChronologyContactComponent } from './view-chronology-contact/view-chronology-contact.component';
import { ModifyContactFollowUpListComponent } from './modify-contact-follow-up-list/modify-contact-follow-up-list.component';
import { BulkCreateContactsComponent } from './bulk-create-contacts/bulk-create-contacts.component';
import { ContactDailyFollowUpsListComponent } from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
import { ContactRangeFollowUpsListComponent } from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';
import { IndividualContactFollowUpsListComponent } from './individual-contact-follow-ups-list/individual-contact-follow-ups-list.component';
import { BulkModifyContactsComponent } from './bulk-modify-contacts/bulk-modify-contacts.component';
import { ContactsCreateViewModifyComponent } from './contacts-create-view-modify/contacts-create-view-modify.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
export * from './bulk-create-contacts/bulk-create-contacts.component';
export * from './bulk-modify-contacts/bulk-modify-contacts.component';
export * from './create-contact-follow-up/create-contact-follow-up.component';
export * from './modify-contact-follow-up/modify-contact-follow-up.component';
export * from './view-movement-contact/view-movement-contact.component';
export * from './view-chronology-contact/view-chronology-contact.component';
export * from './modify-contact-follow-up-list/modify-contact-follow-up-list.component';
export * from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
export * from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';
export * from './individual-contact-follow-ups-list/individual-contact-follow-ups-list.component';

// export the list of all page components
export const pageComponents: any[] = [
  BulkCreateContactsComponent,
  BulkModifyContactsComponent,
  ContactsCreateViewModifyComponent,
  ContactsListComponent,
  ViewChronologyContactComponent,
  ViewMovementContactComponent,



  ContactDailyFollowUpsListComponent,
  ContactRangeFollowUpsListComponent,
  CreateContactFollowUpComponent,
  ModifyContactFollowUpComponent,
  ModifyContactFollowUpListComponent,
  IndividualContactFollowUpsListComponent
];
