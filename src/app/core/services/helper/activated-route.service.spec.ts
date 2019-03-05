import { ContactDataServiceMock } from '../data/contact.data.service.spec';

export class ActivatedRouteMock {
    variables = {
        contactId: ContactDataServiceMock.selectedContactId
    };

    params = {
        subscribe: ((callback) => {
            callback(this.variables);
        })
    };
}

