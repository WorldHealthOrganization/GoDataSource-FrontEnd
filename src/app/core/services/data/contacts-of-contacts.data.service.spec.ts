import { Observable, of } from 'rxjs';
import * as _ from 'lodash';
import { moment } from '../../helperClasses/x-moment';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';

export const ContactsOfContactsDataServiceMock: {
    selectedContactOfContactId: string,
    contactsOfContacts: {
        [outbreakId: string]: ContactOfContactModel[]
    },
    getContactOfContact: (outbreakId: string, contactOfContactId: string) => Observable<ContactOfContactModel>
} = {
    selectedContactOfContactId: 'contact 1',

    contactsOfContacts: {
        'outbreak 1': [
            new ContactOfContactModel({
                id: 'contact 1',
                dateOfReporting: moment('2019-03-01', 'YYYY-MM-DD'),
                dateBecomeContact: moment('2019-03-03', 'YYYY-MM-DD'),
                dateOfLastContact: moment('2019-03-02', 'YYYY-MM-DD')
            })
        ]
    },

    getContactOfContact: (
        outbreakId: string,
        contactOfContactId: string
    ): Observable<ContactOfContactModel> => {
        return of(
            ContactsOfContactsDataServiceMock.contactsOfContacts[outbreakId] ?
                _.find(ContactsOfContactsDataServiceMock.contactsOfContacts[outbreakId], { id: contactOfContactId }) :
                undefined
        );
    }
};
