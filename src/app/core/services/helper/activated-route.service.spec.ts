import { ContactDataServiceMock } from '../data/contact.data.service.spec';
import { CaseDataServiceMock } from '../data/case.data.service.spec';

export const ActivatedRouteMock: {
    callbackData: {
        [key: string]: any
    },
    params: {
        subscribe: (callback: (any) => void) => void
    }
} = {
    callbackData: null,

    params: {
        subscribe: (callback) => {
            callback(ActivatedRouteMock.callbackData ? ActivatedRouteMock.callbackData : {
                contactId: ContactDataServiceMock.selectedContactId,
                caseId: CaseDataServiceMock.selectedCaseId
            });
        }
    }
};

