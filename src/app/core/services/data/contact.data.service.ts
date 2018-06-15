import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactModel } from '../../models/contact.model';
import { RequestQueryBuilder } from '../helper/request-query-builder';

@Injectable()
export class ContactDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Contacts for an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<ContactModel[]>}
     */
    getContactsList(outbreakId: string, queryBuilder: RequestQueryBuilder = null): Observable<ContactModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`),
            ContactModel
        );
    }

    /**
     * Delete an existing Contact of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @returns {Observable<any>}
     */
    deleteContact(outbreakId: string, contactId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}`);
    }
}

