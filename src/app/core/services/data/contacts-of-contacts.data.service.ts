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
    getContactsList(
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
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getContactsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/contacts/filtered-count?filter=${filter}`);
    }

    /**
     * Create contact of contact
     * @param {string} outbreakId
     * @param contactData
     * @returns {Observable<any>}
     */
    createContact(outbreakId: string, contactData): Observable<any>{
        return this.http.post(`outbreaks/${outbreakId}/contacts`, contactData);
    }

    /**
     * Modify an existing contact of contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} contactData
     * @returns {Observable<ContactOfContactModel>}
     */
    modifyContact(
        outbreakId: string,
        contactId: string,
        contactData: string,
    ): Observable<ContactOfContactModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/contacts/${contactId}`, contactData),
            ContactOfContactModel
        );
    }

    /**
     * Delete contact of contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<{}>}
     */
    deleteContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}`);
    }

    /**
     * Restore contact of contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<{}>}
     */
    restoreContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/contacts/${contactId}/restore`, {});
    }
}
