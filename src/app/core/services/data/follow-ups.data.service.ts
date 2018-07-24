import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ModelHelperService } from '../helper/model-helper.service';
import { ContactFollowUpsModel } from '../../models/contact-follow-ups.model';
import { FollowUpModel } from '../../models/follow-up.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { Constants } from '../../models/constants';
import { LocationDataService } from './location.data.service';
import { LocationModel } from '../../models/location.model';
import 'rxjs/add/operator/mergeMap';
import { AddressModel } from '../../models/address.model';
import { MetricContactsFollowUpModel } from '../../models/metric-contacts-follow-up.model';
import { OutbreakModel } from '../../models/outbreak.model';

@Injectable()
export class FollowUpsDataService {
    /**
     * Constructor
     * @param {HttpClient} http
     * @param {ModelHelperService} modelHelper
     */
    constructor(
        private http: HttpClient,
        private modelHelper: ModelHelperService,
        private locationDataService: LocationDataService
    ) {
    }

    /**
     * Generate followups for contacts
     * @param {string} outbreakId
     * @param {number} followUpPeriod
     * @returns {Observable<ContactFollowUpsModel[]>}
     */
    generateFollowUps(outbreakId: string, followUpPeriod: number = Constants.DEFAULT_FOLLOWUP_PERIOD_DAYS): Observable<ContactFollowUpsModel[]> {
        return this.modelHelper.mapObservableListToModel(
            this.http.post(`outbreaks/${outbreakId}/generate-followups`, {followUpPeriod: followUpPeriod}),
            ContactFollowUpsModel
        );
    }

    /**
     * Retrieve the list of FollowUps from an Outbreak
     * @param {string} outbreakId
     * @returns {Observable<FollowUpModel[]>}
     */
    getFollowUpsList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<FollowUpModel[]> {
        // include contact in response
        const qb = new RequestQueryBuilder();
        qb.include('contact');
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
                            followUp.address.location = locationsMapped[followUp.address.locationId];
                        }

                        // finished
                        return followUp;
                    });
                });
            });
    }

    /**
     * Retrieve the list of of contacts that missed their last follow-up
     * @param {string} outbreakId
     * @returns {Observable<FollowUpModel[]>}
     */
    getLastFollowUpsMissedList(outbreakId: string, queryBuilder: RequestQueryBuilder = new RequestQueryBuilder()): Observable<FollowUpModel[]> {
        // include contact in response
        const qb = new RequestQueryBuilder();
        qb.include('contact');
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
                    this.http.get(`outbreaks/${outbreakId}/follow-ups/latest-by-contacts-if-not-performed?filter=${filter}`),
                    FollowUpModel
                ).map((followUps) => {
                    return _.map(followUps, (followUp: FollowUpModel) => {
                        // map location
                        if (
                            followUp.address &&
                            followUp.address.locationId
                        ) {
                            followUp.address.location = locationsMapped[followUp.address.locationId];
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
        qb.include('contact');
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
     * @returns {Observable<any>}
     */
    getCountIdsOfContactsOnTheFollowUpList(outbreakId: string): Observable<MetricContactsFollowUpModel> {
        return this.modelHelper.mapObservableToModel(
            this.http.get(`outbreaks/${outbreakId}/follow-ups/contacts/count`),
            MetricContactsFollowUpModel
        );
    }
}

