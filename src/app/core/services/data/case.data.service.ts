import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { CaseModel } from '../../models/case.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ListFilterDataService } from './list-filter.data.service';
import { MetricCasesCountStratified } from '../../models/metrics/metric-cases-count-stratified.model';
import { MetricCasesPerLocationCountsModel } from '../../models/metrics/metric-cases-per-location-counts.model';
import { AddressModel } from '../../models/address.model';
import { MetricCasesDelayBetweenOnsetLabTestModel } from '../../models/metrics/metric-cases-delay-between-onset-lab-test.model';
import * as moment from 'moment';
import { EntityDuplicatesModel } from '../../models/entity-duplicates.model';
import { VisualIdErrorModel, VisualIdErrorModelCode } from '../../models/visual-id-error.model';
import * as _ from 'lodash';
import { MetricCasesDelayBetweenOnsetHospitalizationModel } from '../../models/metrics/metric-cases-delay-between-onset-hospitalization.model';
import { Constants } from '../../models/constants';
import { IGeneralAsyncValidatorResponse } from '../../../shared/xt-forms/validators/general-async-validator.directive';
import { MetricCasesCountStratifiedOutcome } from '../../models/metrics/metric-cases-count-stratified-outcome.model';

@Injectable()
export class CaseDataService {
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private listFilterDataService: ListFilterDataService
    ) {}

    /**
     * Retrieve the list of Cases for an Outbreak
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<CaseModel[]>}
     */
    getCasesList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<CaseModel[]> {
        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.include(`dateRangeLocations`, true);
        qb.merge(queryBuilder);
        const filter = qb.buildQuery();
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
     * Retrieve Case movement information
     * @param {string} outbreakId
     * @param {string} caseId
     * @returns {Observable<AddressModel[]>}
     */
    getCaseMovement(outbreakId: string, caseId: string): Observable<AddressModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/${caseId}/movement`),
            AddressModel
        );
    }

    /**
     * Find case duplicates
     * @param outbreakId
     * @param caseData
     */
    findDuplicates(
        outbreakId: string,
        caseData: any,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EntityDuplicatesModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.post(
                `outbreaks/${outbreakId}/cases/duplicates/find?filter=${filter}`,
                caseData
            ),
            EntityDuplicatesModel
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
     * @returns {Observable<CaseModel>}
     */
    modifyCase(outbreakId: string, caseId: string, caseData): Observable<CaseModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/cases/${caseId}`, caseData),
            CaseModel
        );
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
     * Count Cases grouped by Classification
     * @param outbreakId
     * @param queryBuilder
     */
    getCasesGroupedByClassification(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/per-classification/count?filter=${filter}`);
    }

    /**
     * Return count of deceased cases
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getDeceasedCasesCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // construct query
        const filterQueryBuilder = new RequestQueryBuilder();

        // add other conditions
        if (!queryBuilder.isEmpty()) {
            filterQueryBuilder.merge(queryBuilder);
        }

        // deceased condition
        filterQueryBuilder.filter.where({
            outcomeId: Constants.OUTCOME_STATUS.DECEASED
        }, true);

        // generate a query builder for deceased
        const filter = filterQueryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }

    /**
     * Return count of hospitalised cases
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getHospitalisedCasesCount(
        outbreakId: string,
        date,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // set default date ?
        if (!date) {
            date = moment();
        }

        // get the query builder and call the endpoint
        const filterQueryBuilder = this.listFilterDataService.filterCasesHospitalized(date);

        // add other conditions
        if (!queryBuilder.isEmpty()) {
            filterQueryBuilder.merge(queryBuilder);
        }

        // call endpoint
        const filter = filterQueryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }

    /**
     * Return count of isolated cases
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getIsolatedCasesCount(
        outbreakId: string,
        date,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // set default date ?
        if (!date) {
            date = moment();
        }

        // construct query builder
        const filterQueryBuilder = this.listFilterDataService.filterCasesIsolated(date);

        // add other conditions
        if (!queryBuilder.isEmpty()) {
            filterQueryBuilder.merge(queryBuilder);
        }

        // call endpoint
        const filter = filterQueryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }

    /**
     * Return count of suspect cases pending lab result
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getCasesPendingLabResultCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // get the query builder and call the endpoint
        const filterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();

        // add other conditions
        if (!queryBuilder.isEmpty()) {
            filterQueryBuilder.merge(queryBuilder);
        }

        // call endpoint
        const filter = filterQueryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }


    /**
     * Return count of cases refusing to be transferred to a treatment unit
     * @param {string} outbreakId
     * @returns {Observable<any>}
     */
    getCasesRefusingTreatmentCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        // generate a query builder for cases refusing treatment
        const filterQueryBuilder = this.listFilterDataService.filterCasesRefusingTreatment();

        // add other conditions
        if (!queryBuilder.isEmpty()) {
            filterQueryBuilder.merge(queryBuilder);
        }

        // call endpoint
        const filter = filterQueryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/cases/filtered-count?filter=${filter}`);
    }

    /**
     * Cases count stratified by classification over time
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricCasesCountStratified[]>}
     */
    getCasesStratifiedByClassificationOverTime(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesCountStratified[]> {
        const filter = queryBuilder.buildQuery();
        const obs = this.http.get(`outbreaks/${outbreakId}/cases/classification-over-time/count?filter=${filter}`);
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
     * Cases count stratified by classification over reporting time
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricCasesCountStratified[]>}
     */
    getCasesStratifiedByClassificationOverReportingTime(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesCountStratified[]> {
        const filter = queryBuilder.buildQuery();
        const obs = this.http.get(`outbreaks/${outbreakId}/cases/classification-over-reporting-time/count?filter=${filter}`);
        return obs.map(
            (listResult) => {
                const results = [];
                Object.keys(listResult).forEach((key) => {
                    const metricResult = listResult[key];
                    results.push(metricResult);
                });
                return results;
            }
        );
    }

    /**
     * Cases count stratified by outcome over time
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricCasesCountStratifiedOutcome[]>}
     */
    getCasesStratifiedByOutcomeOverTime(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesCountStratifiedOutcome[]> {
        const filter = queryBuilder.buildQuery();
        const obs = this.http.get(`outbreaks/${outbreakId}/cases/outcome-over-time/count?filter=${filter}`);
        return obs.map(
            (listResult) => {
                const results = [];
                Object.keys(listResult).forEach((key) => {
                    const metricResult = listResult[key];
                    results.push(metricResult);
                });
                return results;
            }
        );
    }

    /**
     * Retrieve cases per location metrics
     * @param {string} outbreakId
     * @returns {Observable<MetricCasesPerLocationCountsModel>}
     */
    getCasesPerLocation(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesPerLocationCountsModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/per-location-level/count?filter=${filter}`),
            MetricCasesPerLocationCountsModel
        );
    }

    /**
     * get delay between date of onset and date of first lab testing - gantt chart
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricCasesDelayBetweenOnsetLabTestModel[]>}
     */
    getDelayBetweenOnsetAndLabTesting(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesDelayBetweenOnsetLabTestModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/delay-onset-lab-testing?filter=${filter}`),
            MetricCasesDelayBetweenOnsetLabTestModel
        );
    }

    /**
     * get delay between date of onset and date of hospitalization / isolation - first - gantt chart
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricCasesDelayBetweenOnsetHospitalizationModel[]>}
     */
    getDelayBetweenOnsetAndHospitalization(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricCasesDelayBetweenOnsetHospitalizationModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/cases/delay-onset-hospitalization?filter=${filter}`),
            MetricCasesDelayBetweenOnsetHospitalizationModel
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

    /**
     * Generate Case Visual ID
     * @param outbreakId
     * @param visualIdMask
     * @param personId Optional
     */
    generateCaseVisualID(
        outbreakId: string,
        visualIdMask: string,
        personId?: string
    ): Observable<string | VisualIdErrorModel> {
        return this.http
            .post(
                `outbreaks/${outbreakId}/cases/generate-visual-id`,
                {
                    visualIdMask: visualIdMask,
                    personId: personId
                }
            ).catch((response: Error | VisualIdErrorModel) => {
                return (response as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ||
                (response as VisualIdErrorModel).code === VisualIdErrorModelCode.DUPLICATE_VISUAL_ID ?
                    Observable.of(
                        this.modelHelper.getModelInstance(
                            VisualIdErrorModel,
                            response
                        )
                    ) :
                    Observable.throw(response);
            });
    }

    /**
     * Check if visual ID is valid
     * @param outbreakId
     * @param visualIdRealMask
     * @param visualIdMask
     * @param personId Optional
     */
    checkCaseVisualIDValidity(
        outbreakId: string,
        visualIdRealMask: string,
        visualIdMask: string,
        personId?: string
    ): Observable<boolean | IGeneralAsyncValidatorResponse> {
        return this.generateCaseVisualID(
            outbreakId,
            visualIdMask,
            personId
        ).map((visualID: string | VisualIdErrorModel) => {
            return _.isString(visualID) ?
                true : {
                    isValid: false,
                    errMsg: (visualID as VisualIdErrorModel).code === VisualIdErrorModelCode.INVALID_VISUAL_ID_MASK ?
                        'LNG_API_ERROR_CODE_INVALID_VISUAL_ID_MASK' :
                        'LNG_API_ERROR_CODE_DUPLICATE_VISUAL_ID',
                    errMsgData: {
                        mask: visualIdRealMask
                    }
                };
        });
    }
}
