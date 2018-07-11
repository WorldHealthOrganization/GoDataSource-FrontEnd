import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactFollowUpsModel } from '../../models/contact-follow-ups.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';

@Injectable()
export class FollowUpsDataService {
    // constants
    static DEFAULT_FOLLOWUP_PERIOD_DAYS = 1;

    /**
     * Constructor
     * @param {HttpClient} http
     * @param {ModelHelperService} modelHelper
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Generate followups for contacts
     * @param {string} outbreakId
     * @param {number} followUpPeriod
     * @returns {Observable<ContactFollowUpsModel[]>}
     */
    generateFollowUps(outbreakId: string, followUpPeriod: number = FollowUpsDataService.DEFAULT_FOLLOWUP_PERIOD_DAYS): Observable<ContactFollowUpsModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.post(`outbreaks/${outbreakId}/generate-followups`, { followUpPeriod: followUpPeriod }),
            ContactFollowUpsModel
        );
    }

    /**
     * Retrieve the list of FollowUps from an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<FollowUpModel[]>}
     */
    getFollowUpsList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<FollowUpModel[]> {
        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
            FollowUpModel
        );
    }
}

