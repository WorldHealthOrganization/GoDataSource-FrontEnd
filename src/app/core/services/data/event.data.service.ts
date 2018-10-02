import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
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
     * @returns {Observable<EventModel[]>}
     */
    getEventsList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<EventModel[]> {

        const filter = queryBuilder.buildQuery();

        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/events?filter=${filter}`),
            EventModel
        );
    }

    /**
     * Return total number of events
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getEventsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {

        const filter = queryBuilder.buildQuery();

        return this.http.get(`outbreaks/${outbreakId}/events/filtered-count?filter=${filter}`);
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

    /**
     * Retrieve an Event of an Outbreak
     * @param {string} outbreakId
     * @param {string} eventId
     * @returns {Observable<EventModel>}
     */
    getEvent(outbreakId: string, eventId: string): Observable<EventModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/events/${eventId}`),
            EventModel
        );
    }

    /**
     * Modify an existing Event of an Outbreak
     * @param {string} outbreakId
     * @param {string} eventId
     * @param eventData
     * @returns {Observable<any>}
     */
    modifyEvent(outbreakId: string, eventId: string, eventData): Observable<any> {
        return this.http.put(`outbreaks/${outbreakId}/events/${eventId}`, eventData);
    }

    /**
     * Delete an existing Event from Outbreak
     * @param {string} outbreakId
     * @param {string} eventId
     * @returns {Observable<any>}
     */
    deleteEvent(outbreakId: string, eventId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/events/${eventId}`);
    }

    /**
     * Restore a deleted event
     * @param {string} outbreakId
     * @param {string} eventId
     * @returns {Observable<any>}
     */
    restoreEvent(outbreakId: string, eventId: string): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/events/${eventId}/restore`, {});
    }
}

