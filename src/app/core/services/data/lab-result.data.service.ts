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
}

