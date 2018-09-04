import { Injectable } from '@angular/core';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakDataService } from './outbreak.data.service';
import { FollowUpsDataService } from './follow-ups.data.service';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../models/outbreak.model';
import { GenericDataService } from './generic.data.service';
import { RelationshipDataService } from './relationship.data.service';
import { MetricContactsLostToFollowUpModel } from '../../models/metrics/metric-contacts-lost-to-follow-up.model';
import { Constants } from '../../models/constants';
import * as moment from 'moment';
import { DateRangeModel } from '../../models/date-range.model';
import * as _ from 'lodash';
import { RequestFilterOperator } from '../../helperClasses/request-query-builder/request-filter';
import { Moment } from 'moment';
import { ContactDataService } from './contact.data.service';
import { MetricContactsSeenEachDays } from '../../models/metrics/metric-contacts-seen-each-days.model';

@Injectable()
export class ListFilterDataService {

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpDataService: FollowUpsDataService,
        private genericDataService: GenericDataService,
        private relationshipDataService: RelationshipDataService,
        private contactDataService: ContactDataService
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
                    [RequestFilterOperator.AND]: [
                        {
                            'hospitalizationDates.startDate': {
                                lte: moment(serverDateTime).endOf('day').toISOString()
                            }
                        }, {
                            [RequestFilterOperator.OR]: [{
                                'hospitalizationDates.endDate': {
                                    eq: null
                                }
                            }, {
                                'hospitalizationDates.endDate': {
                                    gte: moment(serverDateTime).startOf('day').toISOString()
                                }
                            }]
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
                    // update queryBuilder filter with desired case ids
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

    /**
     * Create the query builder for filtering the list of cases
     * @param {number} noDaysInChains
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesInKnownChains(noDaysInChains: number = null): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.relationshipDataService
                .getCountOfCasesInKnownTransmissionChains(selectedOutbreak.id, noDaysInChains)
                .map((result) => {
                    // update queryBuilder filter with desired case ids
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
     * Create the query builder for filtering the list of cases
     * @param {number} noDaysAmongContacts
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesAmongKnownContacts(noDaysAmongContacts: number = null): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            return this.relationshipDataService
                .getCountIdsOfCasesAmongKnownContacts(selectedOutbreak.id, noDaysAmongContacts)
                .map((result) => {
                    // update queryBuilder filter with desired contacts ids
                    const filterQueryBuilder = new RequestQueryBuilder();
                    filterQueryBuilder.filter.where({
                        id: {
                            'inq': result.newCasesAmongKnownContactsIDs
                        }
                    }, true);
                    return filterQueryBuilder;
                });
        });
    }

    /**
     * Create the query builder for filtering the list of cases
     * @returns RequestQueryBuilder
     */
    filterCasesPendingLabResult(): RequestQueryBuilder {
        // generate a query builder for cases pending lab result
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where({
            classification: Constants.CASE_CLASSIFICATION.SUSPECT
        }, true);

        const labResultsQueryBuilder = filterQueryBuilder.include('labResults');
        labResultsQueryBuilder.queryBuilder.filter
            .where(
                {
                    status: Constants.PROGRESS_OPTIONS.IN_PROGRESS.value
                }, true);

        return filterQueryBuilder;
    }

    /**
     * Create the query builder for filtering the list of cases
     * @returns {RequestQueryBuilder}
     */
    filterCasesRefusingTreatment(): RequestQueryBuilder {
        // generate a query builder for cases refusing treatment
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.where({
            [RequestFilterOperator.AND]: [{
                transferRefused: true
            }, {
                classification: Constants.CASE_CLASSIFICATION.SUSPECT
            }]
        }, true);

        return filterQueryBuilder;
    }

    /**
     * Create the query builder for filtering the list of active chains of transmission
     * @returns {RequestQueryBuilder}
     */
    filterActiveChainsOfTransmission(): RequestQueryBuilder {
        // generate a query builder
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.flag(
            'active',
            true
        );
        return filterQueryBuilder;
    }

    /**
     * Create the query builder for contacts becoming cases overtime and place
     * @returns {RequestQueryBuilder}
     */
    filterCasesFromContactsOvertimeAndPlace(
        dateRange: DateRangeModel = null,
        locationIds: string[] = null
    ): RequestQueryBuilder {
        // generate a query builder
        const qb = new RequestQueryBuilder();

        // filter by date range?
        if (
            !_.isEmpty(dateRange) && (
                !_.isEmpty(dateRange.startDate) ||
                !_.isEmpty(dateRange.endDate)
            )
        ) {
            // filter by date range
            qb.filter.byDateRange('dateBecomeCase', dateRange);
        } else {
            // any date
            qb.filter.where({
                'dateBecomeCase': {
                    neq: null
                }
            });
        }

        // filter by location?
        if (!_.isEmpty(locationIds)) {
            qb.filter.where({
                'addresses.locationId': {
                    inq: locationIds
                }
            });
        }

        return qb;
    }

    /**
     * Create the query builder for filtering the list of cases without relationships
     * @returns {RequestQueryBuilder}
     */
    filterCasesWithoutRelationships(): RequestQueryBuilder {
        // generate a query builder
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.flag(
            'noRelationships',
            true
        );
        return filterQueryBuilder;
    }

    /**
     * Create the query builder for filtering the list of events without relationships
     * @returns {RequestQueryBuilder}
     */
    filterEventsWithoutRelationships(): RequestQueryBuilder {
        // generate a query builder
        const filterQueryBuilder = new RequestQueryBuilder();
        filterQueryBuilder.filter.flag(
            'noRelationships',
            true
        );
        return filterQueryBuilder;
    }

    /**
     * Create the query builder for filtering the contacts seen on selected date
     * @param {date} date
     * @returns {Observable<MetricContactsSeenEachDays>}
     */
    filterContactsSeen(date: Moment): Observable<MetricContactsSeenEachDays> {
        // get the outbreakId
        return this.outbreakDataService
            .getSelectedOutbreak()
            .mergeMap((selectedOutbreak: OutbreakModel) => {
            // build the query builder
                const qb = new RequestQueryBuilder();

                // filter by date
                qb.filter.byDateRange(
                    'date', {
                        // clone date
                        startDate: moment(date).startOf('day'),
                        endDate: moment(date).endOf('day')
                    }
                );

                return this.contactDataService.getNumberOfContactsSeenEachDay(selectedOutbreak.id, qb);
            });
    }
}
