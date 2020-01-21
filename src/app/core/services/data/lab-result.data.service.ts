import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LabResultModel } from '../../models/lab-result.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { ModelHelperService } from '../helper/model-helper.service';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class LabResultDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Lab Results for a Case or a Contact
     * @param {string} outbreakId
     * @param {string} entityPath
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<LabResultModel[]>}
     */
    getEntityLabResults(
        outbreakId: string,
        entityPath: string,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<LabResultModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/${entityPath}/${entityId}/lab-results?filter=${filter}`),
            LabResultModel
        );
    }

    /**
     * Return total number of Lab Results for a Case
     * @param {string} outbreakId
     * @param {string} entityPath
     * @param {string} entityId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getEntityLabResultsCount(
        outbreakId: string,
        entityPath: string,
        entityId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`outbreaks/${outbreakId}/${entityPath}/${entityId}/lab-results/count?where=${whereFilter}`);
    }

    /**
     * Get the list of all lab results
     * @param {string} outbreakId
     * @param queryBuilder
     * @returns {Observable<any[]>}
     */
    getOutbreakLabResults(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/lab-results/aggregate?filter=${filter}`),
            LabResultModel
        );
    }

    /**
     * returns total number of lab results
     * @param {string} outbreakId
     * @param {RequestQueryBuilder}queryBuilder
     * @returns {Observable<IBasicCount>}
     */
    getOutbreakLabResultsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`/outbreaks/${outbreakId}/lab-results/aggregate-filtered-count?filter=${filter}`);
    }

    /**
     * Create Lab Result
     * @param {string} outbreakId
     * @param {string} entityPath
     * @param {string} entityId
     * @param labResultData
     * @returns {Observable<any>}
     */
    createLabResult(
        outbreakId: string,
        entityPath: string,
        entityId: string,
        labResultData
    ): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/${entityPath}/${entityId}/lab-results`, labResultData);
    }

    /**
     * Modify Lab Result
     * @param {string} outbreakId
     * @param {string} labResultId
     * @param labResultData
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<LabResultModel>}
     */
    modifyLabResult(
        outbreakId: string,
        labResultId: string,
        labResultData,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<LabResultModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/lab-results/${labResultId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, labResultData),
            LabResultModel
        );
    }

    /**
     * Delete Lab Result
     * @param {string} outbreakId
     * @param {string} labResultId
     * @returns {Observable<any>}
     */
    deleteLabResult(outbreakId: string, labResultId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/lab-results/${labResultId}`);
    }

    /**
     * Restore a deleted Lab Result
     * @param {string} outbreakId
     * @param {string} entityPath
     * @param {string} entityId
     * @param {string} labResultId
     * @returns {Observable<any>}
     */
    restoreLabResult(
        outbreakId: string,
        entityPath: string,
        entityId: string,
        labResultId: string
    ): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/${entityPath}/${entityId}/lab-results/${labResultId}/restore`, {});
    }
}

