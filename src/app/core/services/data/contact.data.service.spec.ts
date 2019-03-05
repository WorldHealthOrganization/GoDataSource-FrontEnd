import { Observable } from 'rxjs/Observable';
import { ContactModel } from '../../models/contact.model';
import { OutbreakDataServiceMock } from './outbreak.data.service.spec';
import * as _ from 'lodash';
import * as moment from 'moment';

export class ContactDataServiceMock {
    static selectedContactId = 'contact 1';

    static contacts: {
        [outbreakId: string]: ContactModel[]
    } = {
        [OutbreakDataServiceMock.selectedOutbreakId]: [
            new ContactModel({
                id: ContactDataServiceMock.selectedContactId,
                dateOfReporting: moment('2019-03-01', 'YYYY-MM-DD'),
                dateBecomeContact: moment('2019-03-03', 'YYYY-MM-DD'),
                dateOfLastContact: moment('2019-03-02', 'YYYY-MM-DD'),
                followUp: {
                    startDate: moment('2019-03-05', 'YYYY-MM-DD'),
                    endDate: moment('2019-03-04', 'YYYY-MM-DD')
                }
            })
        ]
    };

    static getInstance() {
        return new ContactDataServiceMock();
    }

    getContact(outbreakId: string, contactId: string): Observable<ContactModel> {
        return Observable.of(
            ContactDataServiceMock.contacts[outbreakId] ?
                _.find(ContactDataServiceMock.contacts[outbreakId], { id: contactId }) :
                undefined
        );
    }
}

