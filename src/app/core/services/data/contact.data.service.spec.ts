import { Observable, of } from 'rxjs';
import { ContactModel } from '../../models/contact.model';
import * as _ from 'lodash';
import * as moment from 'moment';

export const ContactDataServiceMock: {
    selectedContactId: string,
    contacts: {
        [outbreakId: string]: ContactModel[]
    },
    getContact: (outbreakId: string, contactId: string) => Observable<ContactModel>
} = {
    selectedContactId: 'contact 1',

    contacts: {
        'outbreak 1': [
            new ContactModel({
                id: 'contact 1',
                dateOfReporting: moment('2019-03-01', 'YYYY-MM-DD'),
                dateBecomeContact: moment('2019-03-03', 'YYYY-MM-DD'),
                dateOfLastContact: moment('2019-03-02', 'YYYY-MM-DD'),
                followUp: {
                    startDate: moment('2019-03-05', 'YYYY-MM-DD'),
                    endDate: moment('2019-03-04', 'YYYY-MM-DD')
                }
            })
        ]
    },

    getContact: (
        outbreakId: string,
        contactId: string
    ): Observable<ContactModel> => {
        return of(
            ContactDataServiceMock.contacts[outbreakId] ?
                _.find(ContactDataServiceMock.contacts[outbreakId], { id: contactId }) :
                undefined
        );
    }
};
