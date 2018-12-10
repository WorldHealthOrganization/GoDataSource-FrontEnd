import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactFollowUpsModel } from '../../models/contact-follow-ups.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { LocationDataService } from './location.data.service';
import 'rxjs/add/operator/mergeMap';
import { MetricContactsLostToFollowUpModel } from '../../models/metrics/metric-contacts-lost-to-follow-up.model';
import { MetricContactsModel } from '../../models/metrics/metric-contacts.model';
import { MetricContactsWithSuccessfulFollowUp } from '../../models/metrics/metric.contacts-with-success-follow-up.model';
import { TeamFollowupsPerDayModel } from '../../models/team-followups-per-day.model';
import { FormRangeModel } from '../../../shared/components/form-range/form-range.model';

@Injectable()
export class FollowUpsDataService {

    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private locationDataService: LocationDataService
    ) {}

    /**
     * Generate followups for contacts
     * @returns {Observable<ContactFollowUpsModel[]>}
     */
    generateFollowUps(
        outbreakId: string,
        startDate: any,
        endDate: any,
        targeted: boolean
    ): Observable<ContactFollowUpsModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.post(
                `outbreaks/${outbreakId}/generate-followups`, {
                    startDate: startDate,
                    endDate: endDate,
                    targeted: targeted
                }
            ),
            ContactFollowUpsModel
        );
    }

    /**
     * Retrieve the list of FollowUps from an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<FollowUpModel[]>}
     */
    getFollowUpsList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(),
        needsContactData: boolean = true
    ): Observable<FollowUpModel[]> {
        // include contact in response
        const qb = new RequestQueryBuilder();
        qb.include('contact', needsContactData);
        qb.merge(queryBuilder);

        // construct query
        const filter = qb.buildQuery();

        // retrieve locations
        return this.locationDataService
            .getLocationsList()
            .mergeMap((locations) => {
                // map names to id
                const locationsMapped = _.groupBy(locations, 'id');
                return this.modelHelper.mapObservableListToModel(
                    this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
                    FollowUpModel
                ).map((followUps) => {
                    return _.map(followUps, (followUp: FollowUpModel) => {
                        // map location
                        if (
                            followUp.address &&
                            followUp.address.locationId
                        ) {
                            followUp.address.location = locationsMapped[followUp.address.locationId] ?
                                locationsMapped[followUp.address.locationId][0] :
                                null;
                        }

                        // finished
                        return followUp;
                    });
                });
            });
    }

    /**
     * Retrieve Follow-up of a Contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @returns {Observable<FollowUpModel>}
     */
    getFollowUp(outbreakId: string, contactId: string, followUpId: string): Observable<FollowUpModel> {
        // include contact in response
        const qb = new RequestQueryBuilder();
        qb.include('contact', true);
        qb.filter.where({
            id: followUpId
        });

        // construct query
        const filter = qb.buildQuery();

        // !!!IMPORTANT!!!
        // since include doesn't work in GET single follow-up item, we need to use get list or make two requests ( 1 for contact and 1 for follow-up which would be slower )
        return this.modelHelper.mapObservableListToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
            FollowUpModel
        ).mergeMap(followUps => followUps);
    }

    /**
     * Return count of follow-ups
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<any>}
     */
    getFollowUpsCount(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.http.get(`outbreaks/${outbreakId}/follow-ups/filtered-count?filter=${filter}`);
    }

    /**
     * Add a new Follow-up for a Contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @param followUpData
     * @returns {Observable<any>}
     */
    createFollowUp(outbreakId: string, contactId: string, followUpData): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups`, followUpData);
    }

    /**
     * Modify an existing Follow-up for a Contact
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @param followUpData
     * @returns {Observable<any>}
     */
    modifyFollowUp(outbreakId: string, contactId: string, followUpId: string, followUpData): Observable<any> {
        return this.http.put(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups/${followUpId}`, followUpData);
    }

    /**
     * Delete an existing Follow-up of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @returns {Observable<any>}
     */
    deleteFollowUp(outbreakId: string, contactId: string, followUpId: string): Observable<any> {
        return this.http.delete(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups/${followUpId}`);
    }

    /**
     * Restore an existing Follow-up of an Outbreak
     * @param {string} outbreakId
     * @param {string} contactId
     * @param {string} followUpId
     * @returns {Observable<any>}
     */
    restoreFollowUp(outbreakId: string, contactId: string, followUpId: string): Observable<any> {
        return this.http.post(`outbreaks/${outbreakId}/contacts/${contactId}/follow-ups/${followUpId}/restore`, {});
    }

    /**
     * Get metrics for contacts on follow-up lists
     * @param {string} outbreakId
     * @param {string} date
     * @returns {Observable<MetricContactsModel>}
     */
    getCountIdsOfContactsOnTheFollowUpList(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricContactsModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts/count?filter=${filter}`),
            MetricContactsModel
        );
    }

    /**
     * Download the Daily Follow-Ups Form file
     * @param {string} outbreakId
     * @param {string} date
     * @returns {Observable<any>}
     */
    downloadDailyFollowUpsForm(outbreakId: string, date: string): Observable<any> {
        return this.http.get(
            `outbreaks/${outbreakId}/contacts/daily-followup-form/export?date=${date}`,
            {
                responseType: 'blob'
            }
        );
    }

    /**
     * Get metrics for contacts not seen
     * @param {string} outbreakId
     * @param {number} daysNotSeen
     * @returns {Observable<MetricContactsModel>}
     */
    getCountIdsOfContactsNotSeen(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricContactsModel> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-not-seen/count?filter=${filter}`),
            MetricContactsModel
        );
    }

    /**
     * Get the number of contacts who are lost to followup
     * @param outbreakId
     * @param {string} date
     * @returns {Observable<Object>}
     */
    getNumberOfContactsWhoAreLostToFollowUp(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<any> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-lost-to-follow-up/count?filter=${filter}`),
            MetricContactsLostToFollowUpModel
        );
    }

    /**
     * Retrieve the list of contacts who have successful followup
     * @param {string} outbreakId
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<MetricContactsWithSuccessfulFollowUp>}
     */
    getContactsWithSuccessfulFollowUp(
        outbreakId: string,
        queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()
    ): Observable<MetricContactsWithSuccessfulFollowUp> {
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts-with-successful-follow-ups/count?filter=${filter}`),
            MetricContactsWithSuccessfulFollowUp
        );
    }

    /**
     * get team workload
     * @param {string} outbreakId
     * @param {string} firstDate
     * @param {string} lastDate
     * @param {RequestQueryBuilder} queryBuilder
     * @returns {Observable<TeamFollowupsPerDayModel>}
     */
    getFollowUpsPerDayTeam(outbreakId: string, firstDate: string, lastDate: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<TeamFollowupsPerDayModel> {
        queryBuilder.filter.byRange('date', new FormRangeModel({from: firstDate, to: lastDate}));
        const filter = queryBuilder.buildQuery();
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/per-team-per-day/count?filter=${filter}`),
            TeamFollowupsPerDayModel
        );
    }

}

