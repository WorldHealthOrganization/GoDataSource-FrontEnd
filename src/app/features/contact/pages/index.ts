// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { ViewMovementContactComponent } from './view-movement-contact/view-movement-contact.component';
import { ViewChronologyContactComponent } from './view-chronology-contact/view-chronology-contact.component';
import { ContactFollowUpsBulkModifyComponent } from './contact-follow-ups-bulk-modify/contact-follow-ups-bulk-modify.component';
import { ContactDailyFollowUpsListComponent } from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
import { ContactRangeFollowUpsListComponent } from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';
import { IndividualContactFollowUpsListComponent } from './individual-contact-follow-ups-list/individual-contact-follow-ups-list.component';
import { ContactsCreateViewModifyComponent } from './contacts-create-view-modify/contacts-create-view-modify.component';
import { FollowUpCreateViewModifyComponent } from './follow-up-create-view-modify/follow-up-create-view-modify.component';
import { ContactsBulkCreateModifyComponent } from './contacts-bulk-create-modify/contacts-bulk-create-modify.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
export * from './contacts-bulk-create-modify/contacts-bulk-create-modify.component';
export * from './view-movement-contact/view-movement-contact.component';
export * from './view-chronology-contact/view-chronology-contact.component';
export * from './contact-follow-ups-bulk-modify/contact-follow-ups-bulk-modify.component';
export * from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
export * from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';
export * from './individual-contact-follow-ups-list/individual-contact-follow-ups-list.component';
export * from './follow-up-create-view-modify/follow-up-create-view-modify.component';

// export the list of all page components
export const pageComponents: any[] = [
  ContactsBulkCreateModifyComponent,
  ContactsCreateViewModifyComponent,
  ContactsListComponent,
  ViewChronologyContactComponent,
  ViewMovementContactComponent,
  FollowUpCreateViewModifyComponent,


  ContactDailyFollowUpsListComponent,
  ContactRangeFollowUpsListComponent,
  ContactFollowUpsBulkModifyComponent,
  IndividualContactFollowUpsListComponent
];
