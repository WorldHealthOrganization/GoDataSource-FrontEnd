import { Injectable } from '@angular/core';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakDataService } from './outbreak.data.service';
import { FollowUpsDataService } from './follow-ups.data.service';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../models/outbreak.model';
import { GenericDataService } from './generic.data.service';
import { RelationshipDataService } from './relationship.data.service';
import { MetricContactsLostToFollowUpModel } from '../../models/metrics/metric-contacts-lost-to-follow-up.model';

@Injectable()
export class ListFilterDataService {

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpDataService: FollowUpsDataService,
        private genericDataService: GenericDataService,
        private relationshipDataService: RelationshipDataService
    ) {}


    private handleFilteringOfLists(callback): Observable<RequestQueryBuilder> {
        return this.outbreakDataService
            .getSelectedOutbreakSubject()
            .mergeMap((selectedOutbreak: OutbreakModel) => {
                if (selectedOutbreak && selectedOutbreak.id) {
                    return callback(selectedOutbreak);
                } else {
                    return Observable.of(new RequestQueryBuilder());
                }
            });
    }

    /**
     * Create the query builder for filtering the list of contacts
     * @returns {RequestQueryBuilder}
     */
    filterContactsOnFollowUpLists(): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id)
                .map((result) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.contactIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

    /**
     * Create the query builder for filtering the list of contacts
     * @param {number} noDaysNotSeen
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterContactsNotSeen(noDaysNotSeen: number = null): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.followUpDataService
                .getCountIdsOfContactsNotSeen(selectedOutbreak.id, noDaysNotSeen)
                .map((result) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.contactIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

    /**
     * Create the query builder for filtering the list of cases
     * @returns {RequestQueryBuilder}
     */
    filterCasesHospitalized(): Observable<RequestQueryBuilder> {
        // get server current time to compare with hospitalisation dates
        return this.genericDataService
            .getServerUTCCurrentDateTime()
            .map((serverDateTime: string) => {
                // generate a query builder for hospitalized cases
                const filterQueryBuilder = new RequestQueryBuilder();
                // compare hospitalisation dates start and end with current date
                filterQueryBuilder.filter.where({
                    'and': [
                        {
                            'hospitalizationDates.startDate': {
                                lte: serverDateTime
                            }
                        },
                        {
                            'or': [
                                {'hospitalizationDates.endDate': null},
                                {
                                    'hospitalizationDates.endDate': {
                                        gte: serverDateTime
                                    }
                                }
                            ]
                        }
                    ]
                }, true);
                return filterQueryBuilder;
            });
    }

    /**
     * Create the query builder for filtering the list of cases
     * @param {number} noLessContacts
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesLessThanContacts(noLessContacts: number = null): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.relationshipDataService
                .getCountIdsOfCasesLessThanXContacts(selectedOutbreak.id, noLessContacts)
                .map((result) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.caseIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

    /**
     * Create the query builder for filtering the list of contacts that are lost to follow-up
     * @returns {RequestQueryBuilder}
     */
    filterContactsLostToFollowUp(): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.followUpDataService
                .getNumberOfContactsWhoAreLostToFollowUp(selectedOutbreak.id)
                .map((result: MetricContactsLostToFollowUpModel) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.contactIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

}
