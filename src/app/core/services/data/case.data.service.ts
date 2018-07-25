import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

@Injectable()
export class CaseDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Cases for an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<CaseModel[]>}
     */
    getCasesList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<CaseModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases?filter=${filter}`),
            CaseModel
        );
    }

    /**
     * Retrieve a Case of an Outbreak
     * @param {string} outbreakId
     * @param {string} caseId
     * @returns {Observable<CaseModel>}
     */
    getCase(outbreakId: string, caseId: string): Observable<CaseModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/${caseId}`),
            CaseModel
        );
    }

    /**
     * Add a new Case for an Outbreak
     * @param {string} outbreakId
     * @param caseData
     * @returns {Observable<any>}
     */
    createCase(outbreakId: string, caseData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/cases`, caseData);
    }

    /**
     * Modify an existing Case of an Outbreak
     * @param {string} outbreakId
     * @param {string} caseId
     * @param caseData
     * @returns {Observable<any>}
     */
    modifyCase(outbreakId: string, caseId: string, caseData): Observable<any> {
        return this.http.put(`outbreaks/${outbreakId}/cases/${caseId}`, caseData);
    }

    /**
     * Delete an existing Case of an Outbreak
     * @param {string} outbreakId
     * @param {string} caseId
     * @returns {Observable<any>}
     */
    deleteCase(outbreakId: string, caseId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/cases/${caseId}`);
    }

    /**
     * Return count of deceased cases
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getDeceasedCasesCount(outbreakId: string): Observable<any> {
        // generate a query builder for deceased
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where({
            deceased: true
        }, true);
        const filter = filterQueryBuilder.buildQuery(true);
        // call endpoint
        return this.http.get(`outbreaks/${outbreakId}/cases/count?where=${filter}`);
    }
}

