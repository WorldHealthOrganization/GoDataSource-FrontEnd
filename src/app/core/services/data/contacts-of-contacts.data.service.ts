import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {ContactModel} from '../../models/contact.model';
import {RequestQueryBuilder} from '../../helperClasses/request-query-builder';
import { HttpClient } from '@angular/common/http';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactOfContactModel } from '../../models/contact-of-contact.model';

@Injectable()

export class ContactsOfContactsDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {

    }

    /**
     * Get list of contacts of contacts
     */
    getContactsOfContactsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<ContactOfContactModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`),
                ContactOfContactModel);
    }

    /**
     * Get the total number of contacts of contacts
     * @param {string} selectedOutbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getContactsOfContactsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/contacts/filtered-count?filter=${filter}`);
    }

    deleteContact(outbreakId: string, contactId: string) {
        return of({});
    }

    restoreContact(outbreakId: string, contactId: string) {
        return of({});

    }

    convertContactToCase(outbreakId: string, contactId: string) {
        return of({});

    }
}
