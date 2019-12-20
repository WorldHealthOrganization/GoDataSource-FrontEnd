import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ContactModel} from '../../models/contact.model';
import {RequestQueryBuilder} from '../../helperClasses/request-query-builder';

@Injectable()

export class ContactsOfContactsDataService {

    /**
     * Get list of contacts of contacts
     */
    getContactsOfContacts(
        selectedOutbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<ContactModel[]> {
        return of([new ContactModel()]);
    }

    getContactsOfContactsCount(
        selectedOutbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        return of(3);
    }
}
