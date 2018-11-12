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
     * Retrieve the list of Lab Results for a Case
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<LabResultModel[]>}
     */
    getCaseLabResults(
        outbreakId: string,
        caseId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<LabResultModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/lab-results?filter=${filter}`),
            LabResultModel
        );
    }

    /**
     * Return total number of Lab Results for a Case
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getCaseLabResultsCount(
        outbreakId: string,
        caseId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const whereFilter = queryBuilder.filter.generateCondition(true);

        return this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/lab-results/count?where=${whereFilter}`);
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
     * Get the list of all lab results
     * @param {string} outbreakId
     * @returns {Observable<any[]>}
     */
    getOutbreakLabResults(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {

        const qb = new RequestQueryBuilder();
        // include case data
        qb.include('case');

        qb.merge(queryBuilder);

        const filter  = qb.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/lab-results?filter=${filter}`);
    }

    /**
     * returns total number of lab results
     * @param {string}_outbreakId
     * @param {RequestQueryBuilder}queryBuilder
     * @returns {Observable<any>}
     */
    getOutbreakLabResultsCount(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const filter  = queryBuilder.buildQuery();

        return this.http.get(`/outbreaks/${outbreakId}/lab-results/count?filter=${filter}`);
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

    /**
     * Restore a deleted Lab Result
     * @param {string} outbreakId
     * @param {string} caseId
     * @param {string} labResultId
     * @returns {Observable<any>}
     */
    restoreLabResult(outbreakId: string, caseId: string, labResultId: string): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/cases/${caseId}/lab-results/${labResultId}/restore`, {});
    }
}

