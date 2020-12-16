import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ModelHelperService } from '../helper/model-helper.service';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { EventModel } from '../../models/event.model';
import { IBasicCount } from '../../models/basic-count.interface';

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
     * @param queryBuilder
     * @returns {Observable<EventModel[]>}
     */
    getEventsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<EventModel[]> {

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
     * @returns {Observable<IBasicCount>}
     */
    getEventsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<IBasicCount> {

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
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<EventModel>}
     */
    getEvent(
        outbreakId: string,
        eventId: string,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<EventModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/events/${eventId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`),
            EventModel
        );
    }

    /**
     * Modify an existing Event of an Outbreak
     * @param {string} outbreakId
     * @param {string} eventId
     * @param eventData
     * @param {boolean} retrieveCreatedUpdatedBy
     * @returns {Observable<EventModel>}
     */
    modifyEvent(
        outbreakId: string,
        eventId: string,
        eventData,
        retrieveCreatedUpdatedBy?: boolean
    ): Observable<EventModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.put(`outbreaks/${outbreakId}/events/${eventId}${retrieveCreatedUpdatedBy ? '?retrieveCreatedUpdatedBy=1' : ''}`, eventData),
            EventModel
        );
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

    /**
     * Get event relationships count
     * @param {string} outbreakId
     * @param {string} eventId
     */
    getEventRelationshipsCount(outbreakId: string, eventId: string): Observable<any> {
        return this.http.get(`outbreaks/${outbreakId}/events/${eventId}/relationships/filtered-count`);
    }
}

