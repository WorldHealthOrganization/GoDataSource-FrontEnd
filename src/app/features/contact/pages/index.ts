// import each page component
import { ContactsListComponent } from './contacts-list/contacts-list.component';
import { CreateContactComponent } from './create-contact/create-contact.component';
import { ModifyContactComponent } from './modify-contact/modify-contact.component';
import { ContactsFollowUpsListComponent } from './contacts-follow-ups-list/contacts-follow-ups-list.component';
import { CreateContactFollowUpComponent } from './create-contact-follow-up/create-contact-follow-up.component';
import { ModifyContactFollowUpComponent } from './modify-contact-follow-up/modify-contact-follow-up.component';

// export each page component individually
export * from './contacts-list/contacts-list.component';
export * from './create-contact/create-contact.component';
export * from './modify-contact/modify-contact.component';
export * from './contacts-follow-ups-list/contacts-follow-ups-list.component';
export * from './create-contact-follow-up/create-contact-follow-up.component';
export * from './modify-contact-follow-up/modify-contact-follow-up.component';

// export the list of all page components
export const pageComponents: any[] = [
    ContactsListComponent,
    CreateContactComponent,
    ModifyContactComponent,

    ContactsFollowUpsListComponent,
    CreateContactFollowUpComponent,
    ModifyContactFollowUpComponent
];
