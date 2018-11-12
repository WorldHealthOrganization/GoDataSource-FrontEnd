// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { CreateContactComponent } from './create-contact/create-contact.component';
import { ModifyContactComponent } from './modify-contact/modify-contact.component';
import { CreateContactFollowUpComponent } from './create-contact-follow-up/create-contact-follow-up.component';
import { ModifyContactFollowUpComponent } from './modify-contact-follow-up/modify-contact-follow-up.component';
import { ViewMovementContactComponent } from './view-movement-contact/view-movement-contact.component';
import { ViewChronologyContactComponent } from './view-chronology-contact/view-chronology-contact.component';
import { ModifyContactFollowUpListComponent } from './modify-contact-follow-up-list/modify-contact-follow-up-list.component';
import { BulkCreateContactsComponent } from './bulk-create-contacts/bulk-create-contacts.component';
import { ContactDailyFollowUpsListComponent } from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
import { ContactRangeFollowUpsListComponent } from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
export * from './create-contact/create-contact.component';
export * from './modify-contact/modify-contact.component';
export * from './create-contact-follow-up/create-contact-follow-up.component';
export * from './modify-contact-follow-up/modify-contact-follow-up.component';
export * from './view-movement-contact/view-movement-contact.component';
export * from './view-chronology-contact/view-chronology-contact.component';
export * from './modify-contact-follow-up-list/modify-contact-follow-up-list.component';
export * from './bulk-create-contacts/bulk-create-contacts.component';
export * from './contact-daily-follow-ups-list/contact-daily-follow-ups-list.component';
export * from './contact-range-follow-ups-list/contact-range-follow-ups-list.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsListComponent,
    CreateContactComponent,
    BulkCreateContactsComponent,
    ModifyContactComponent,

    ViewMovementContactComponent,

    ContactDailyFollowUpsListComponent,
    ContactRangeFollowUpsListComponent,
    CreateContactFollowUpComponent,
    ModifyContactFollowUpComponent,
    ModifyContactFollowUpListComponent,

    ViewChronologyContactComponent
];
