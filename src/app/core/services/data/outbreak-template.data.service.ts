import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakTemplateModel } from '../../models/outbreak-template.model';
import { IBasicCount } from '../../models/basic-count.interface';

@Injectable()
export class OutbreakTemplateDataService {
    /**
     * Constructor
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {}

    /**
     * Retrieve the list of Outbreak Templates
     * @returns {Observable<OutbreakTemplateModel[]>}
     */
    getOutbreakTemplatesList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<OutbreakTemplateModel[]> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`templates?filter=${filter}`),
            OutbreakTemplateModel
        );
    }

    /**
     * Retrieve the number of Outbreak Templates
     * @param {RequestQueryBuilder} queryBuilder
     */
    getOutbreakTemplatesCount(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<IBasicCount> {
        const whereFilter = queryBuilder.filter.generateCondition(true);
        return this.http.get(`templates/count?where=${whereFilter}`);
    }

    /**
     * Delete an existing outbreak template
     * @param {string} outbreakTemplateId
     * @returns {Observable<any>}
     */
    deleteOutbreakTemplate(outbreakTemplateId: string): Observable<any> {
        return this.http.delete(`templates/${outbreakTemplateId}`);
    }

    /**
     * Create a new OutbreakTemplate
     * @param {OutbreakTemplateModel} outbreakTemplate
     * @returns {Observable<any>}
     */
    createOutbreakTemplate(outbreakTemplate: OutbreakTemplateModel): Observable<any> {
        return this. http.post(`templates`, outbreakTemplate);
    }

    /**
     * Retrieve an OutbreakTemplate
     * @param {string} outbreakTemplateId
     * @returns {Observable<OutbreakTemplateModel>}
     */
    getOutbreakTemplate(outbreakTemplateId: string): Observable<OutbreakTemplateModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`templates/${outbreakTemplateId}`),
            OutbreakTemplateModel
        );
    }

    /**
     * Modify an existing Outbreak template
     * @param {string} outbreakTemplateId
     * @param {any} data
     * @returns {Observable<OutbreakTemplateModel>}
     */
    modifyOutbreakTemplate(outbreakTemplateId: string, data: any): Observable<OutbreakTemplateModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`templates/${outbreakTemplateId}`, data),
            OutbreakTemplateModel
        );
    }
}
