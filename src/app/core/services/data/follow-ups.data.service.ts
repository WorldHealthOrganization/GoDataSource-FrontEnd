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
                const locationsMapped = _.transform(locations, (result, location: LocationModel) => {
                    result[location.id] = location;
                });

                return this.modelHelper.mapObservableListToModel(
                    this.http.get(`outbreaks/${outbreakId}/follow-ups?filter=${filter}`),
                    FollowUpModel
                ).map((followUps) => {
                    return _.map(followUps, (followUp: FollowUpModel) => {
                        // map location
                        if (followUp.address) {
                            followUp.address = new AddressModel(followUp.address);
                            if (followUp.address.locationId) {
                                followUp.address.location = locationsMapped[followUp.address.locationId];
                            }
                        }

                        // finished
                        return followUp;
                    });
                });
            });
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
}
