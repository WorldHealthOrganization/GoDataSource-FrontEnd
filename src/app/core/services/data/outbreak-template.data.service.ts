import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/takeUntil';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakTemplateModel } from '../../models/outbreak-template.model';

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
    getOutbreakTemplatesList(queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<OutbreakTemplateModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`templates?filter=${filter}`),
            OutbreakTemplateModel
        );
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
     * @returns {Observable<any>}
     */
    modifyOutbreakTemplate(outbreakTemplateId: string, data: any): Observable<any> {
        return this.http.put(`templates/${outbreakTemplateId}`, data)
            .map((res) => {
                return res;
            });
    }
}
