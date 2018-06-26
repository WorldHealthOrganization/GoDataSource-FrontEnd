import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../helper/request-query-builder';
import { EventModel } from '../../models/event.model';

@Injectable()
export class EventDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService
    ) {
    }

    /**
     * Retrieve the list of Events for an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<EventMode[]>}
     */
    getEventsList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<EventModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/events?filter=${filter}`),
            EventModel
        );
    }

    /**
     * Add new Event to an existing Outbreak
     * @param {string} outbreakId
     * @param eventData
     * @returns {Observable<any>}
     */
    createEvent(outbreakId: string, eventData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/events`, eventData);
    }
}

