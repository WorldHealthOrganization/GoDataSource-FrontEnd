import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { LabResultModel } from '../../models/lab-result.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ModelHelperService } from '../helper/model-helper.service';

@Injectable()
export class LabResultDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     +     * Retrieve Relationships of a Case / Contact / Event
     +     * @param {string} outbreakId
     +     * @param {string} caseId
     +     * @returns {Observable<LabResultModel[]>}
     +     */
    getCaseLabResults(outbreakId: string, caseId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<LabResultModel[]> {
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/lab-results?filter=${filter}`),
            LabResultModel
        );
    }

    /**
     * Retrieve Lab Result
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {string} labResultId
     * @returns {Observable<LabResultModel>}
     */
    getLabResult(outbreakId: string, caseId: string, labResultId: string): Observable<LabResultModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/lab-results/${labResultId}`),
            LabResultModel
        );
    }

    /**
     * Create Lab Result
     * @param {string} outbreakId
     * @param {string} caseId
     * @param labResultData
     * @returns {Observable<any>}
     */
    createLabResult(outbreakId: string, caseId: string, labResultData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/cases/${caseId}/lab-results`, labResultData);
    }

    /**
     * Modify Lab Result
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {string} labResultId
     * @param labResultData
     * @returns {Observable<any>}
     */
    modifyLabResult(outbreakId: string, caseId: string, labResultId: string, labResultData): Observable<any> {
        return this.http.put(`outbreaks/${outbreakId}/cases/${caseId}/lab-results/${labResultId}`, labResultData);
    }

    /**
     * Delete Lab Result
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {string} labResultId
     * @returns {Observable<any>}
     */
    deleteLabResult(outbreakId: string, caseId: string, labResultId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/cases/${caseId}/lab-results/${labResultId}`);
    }
}

