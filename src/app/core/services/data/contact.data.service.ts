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

        const c = `outbreaks/${outbreakId}/contacts?filter=${filter}`;
        const d = c;
        this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`).map(
            (listResult) => {
                const b = listResult;
            });

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/contacts?filter=${filter}`),
            ContactModel
        );
    }

    // /**
    //  * Retrieve a Contact of an Outbreak
    //  * @param {string} outbreakId
    //  * @param {string} contactId
    //  * @returns {Observable<ContactModel>}
    //  */
    // getCase(outbreakId: string, contactId: string): Observable<ContactModel> {
    //     return this.modelHelper.mapObservableToModel(
    //         this.http.get(`outbreaks/${outbreakId}/contacts/${contactId}`),
    //         ContactModel
    //     );
    // }

    // /**
    //  * Add a new Contact for an Outbreak
    //  * @param {string} outbreakId
    //  * @param caseData
    //  * @returns {Observable<any>}
    //  */
    // createCase(outbreakId: string, caseData): Observable<any> {
    //     return this.http.post(`outbreaks/${outbreakId}/cases`, caseData);
    // }

    // /**
    //  * Modify an existing Case of an Outbreak
    //  * @param {string} outbreakId
    //  * @param {string} caseId
    //  * @param caseData
    //  * @returns {Observable<any>}
    //  */
    // modifyCase(outbreakId: string, caseId: string, caseData): Observable<any> {
    //     return this.http.patch(`outbreaks/${outbreakId}/cases/${caseId}`, caseData);
    // }

    // /**
    //  * Delete an existing Case of an Outbreak
    //  * @param {string} outbreakId
    //  * @param {string} caseId
    //  * @returns {Observable<any>}
    //  */
    // deleteRole(outbreakId: string, caseId: string): Observable<any> {
    //     return this.http.delete(`outbreaks/${outbreakId}/cases/${caseId}`);
    // }
}

