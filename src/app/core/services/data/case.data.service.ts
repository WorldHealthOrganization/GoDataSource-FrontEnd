import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { GenericDataService } from './generic.data.service';
import { ListFilterDataService } from './list-filter.data.service';
import { MetricCasesCountStratified } from '../../models/metrics/metric-cases-count-stratified.model';

@Injectable()
export class CaseDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private genericDataService: GenericDataService,
        private listFilterDataService: ListFilterDataService
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
     * Return count of cases
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getCasesCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
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
        const filter = filterQueryBuilder.filter.generateCondition(true);
        // call endpoint
        return this.http.get(`outbreaks/${outbreakId}/cases/count?where=${filter}`);
    }

    /**
     * Return count of hospitalised cases
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getHospitalisedCasesCount(outbreakId: string): Observable<any> {
        // get the query builder and call the endpoint
        return this.listFilterDataService.filterCasesHospitalized()
            .mergeMap((filterQueryBuilder) => {
                const filter = filterQueryBuilder.buildQuery();
                // call endpoint
                return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
            });
    }

    /**
     * Return count of suspect cases pending lab result
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getCasesPendingLabResultCount(outbreakId: string): Observable<any> {
        // get the query builder and call the endpoint
        const filterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();
        const filter = filterQueryBuilder.buildQuery();
        // call endpoint
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }


    /**
     * Return count of cases refusing to be transferred to a treatment unit
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getCasesRefusingTreatmentCount(outbreakId: string): Observable<any> {
        // generate a query builder for cases refusing treatment
        const filterQueryBuilder = this.listFilterDataService.filterCasesRefusingTreatment();
        const filter = filterQueryBuilder.buildQuery();
        // call endpoint
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }

    /**
     * Cases count stratified by classification over time
     * @param {string} outbreakId
     * @returns {Observable<MetricCasesCountStratified[]>}
     */
    getCasesStratifiedByClassificationOverTime(outbreakId: string, periodType: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<MetricCasesCountStratified[]> {

         queryBuilder.filter.where({periodType: periodType});
         const filter = queryBuilder.filter.generateFirstCondition(true,true); //.buildQuery();

   //     const filter = queryBuilder.buildQuery();

        const obs = this.http.get(`outbreaks/${outbreakId}/contacts/classification-over-time/count?filter=${filter}`);

        return obs.map(
            (listResult) => {
                const results = [];
                Object.keys(listResult).forEach((key) => {
                    // const metricResult = new MetricCasesCountStratified(listResult[key]);
                    const metricResult = listResult[key];
                    results.push(metricResult);
                });
                return results;
            }
        );
    }

    /**
     *  Restore a case that was deleted
     * @param {string} outbreakId
     * @param {string} caseId
     * @returns {Observable<any>}
     */
    restoreCase(outbreakId: string, caseId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/cases/${caseId}/restore`, {});
    }

    /**
     * Convert a case to contact
     * @param {string} outbreakId
     * @param {string} caseId
     * @returns {Observable<any>}
     */
    convertToContact(outbreakId: string, caseId: string): Observable<any> {
        return this.http.post(`/outbreaks/${outbreakId}/cases/${caseId}/convert-to-contact`, {});
    }

}

