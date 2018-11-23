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
import * as _ from 'lodash';
import { RequestFilterOperator } from '../../helperClasses/request-query-builder/request-filter';
import { Moment } from 'moment';
import { ContactDataService } from './contact.data.service';

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
            const defaultDate = moment().add(-1, 'days').format('YYYY-MM-DD');
            return this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id, defaultDate)
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
    filterCasesHospitalized(date: string | Moment): RequestQueryBuilder {
        // generate a query builder for hospitalized cases
        const filterQueryBuilder = new RequestQueryBuilder();

        // compare hospitalisation dates start and end with current date
        filterQueryBuilder.filter.where({
            [RequestFilterOperator.AND]: [
                {
                    'hospitalizationDates.startDate': {
                        lte: moment(date).endOf('day').toISOString()
                    }
                }, {
                    [RequestFilterOperator.OR]: [{
                        'hospitalizationDates.endDate': {
                            eq: null
                        }
                    }, {
                        'hospitalizationDates.endDate': {
                            gte: moment(date).startOf('day').toISOString()
                        }
                    }]
                }
            ]
        }, true);

        // finished
        return filterQueryBuilder;
    }

    /**
     * Create the query builder for filtering the list of cases
     * @returns {RequestQueryBuilder}
     */
    filterCasesIsolated(): Observable<RequestQueryBuilder> {
        // get server current time to compare with isolation dates
        return this.genericDataService
            .getServerUTCCurrentDateTime()
            .map((serverDateTime: string) => {
                // generate a query builder for isolated cases
                const filterQueryBuilder = new RequestQueryBuilder();
                // compare isolation dates start and end with current date
                filterQueryBuilder.filter.where({
                    [RequestFilterOperator.AND]: [
                        {
                            'isolationDates.startDate': {
                                lte: moment(serverDateTime).endOf('day').toISOString()
                            }
                        }, {
                            [RequestFilterOperator.OR]: [{
                                'isolationDates.endDate': {
                                    eq: null
                                }
                            }, {
                                'isolationDates.endDate': {
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
    filterContactsLostToFollowUp(date, location): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = this.getGlobalFilterQB(
                'date',
                date,
                null,
                null
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // location
            if (location) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.followUpDataService
                .getNumberOfContactsWhoAreLostToFollowUp(selectedOutbreak.id, qb)
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
        const labResultsQueryBuilder = filterQueryBuilder.include('labResults');
        labResultsQueryBuilder.queryBuilder.filter.where({
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
     * @returns {Observable<any>}
     */
    filterContactsSeen(date: Moment, location: string): Observable<any> {
        // get the outbreakId
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // build the query builder
            const qb = new RequestQueryBuilder();

            // empty date ?
            if (_.isEmpty(date)) {
                date = moment();
            }

            // filter by date
            qb.filter.byDateRange(
                'date', {
                    // clone date
                    startDate: moment(date).startOf('day'),
                    endDate: moment(date).endOf('day')
                }
            );

            // location
            if (location) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.contactDataService.getNumberOfContactsSeenEachDay(selectedOutbreak.id, qb);
        });
    }

    /**
     *
     * @param {date} date
     * @returns {Observable<any>}
     */
    filterContactsWithSuccessfulFollowup(date: Moment, location: string): Observable<any> {
        // get the outbreakId
        return this.handleFilteringOfLists((selectedOutbreak: OutbreakModel) => {
            // build the query builder
            const qb = new RequestQueryBuilder();

            // empty date ?
            if (_.isEmpty(date)) {
                date = moment();
            }

            // filter by date
            qb.filter.byDateRange(
                'date', {
                    // clone date
                    startDate: moment(date).startOf('day'),
                    endDate: moment(date).endOf('day')
                }
            );

            // location
            if (location) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            // filter
            return this.followUpDataService.getContactsWithSuccessfulFollowUp(selectedOutbreak.id, qb);
        });
    }

    /**
     * Create the query builder for filtering the list of cases who are not identified though known contact list
     * @returns {RequestQueryBuilder}
     */
    filterCasesNotIdentifiedThroughContacts(): RequestQueryBuilder {
        // construct query builder
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            wasContact: {
                neq: true
            }
        });
        return qb;
    }

    /**
     * Global filters
     * @param dateFieldPath
     * @param locationFieldPath
     */
    getGlobalFilterQB(
        dateFieldPath: string,
        dateFieldValue: Moment,
        locationFieldPath: string,
        locationFieldValue: string
    ): RequestQueryBuilder {
        // construct query builder
        const qb = new RequestQueryBuilder();

        // add date condition
        if (
            !_.isEmpty(dateFieldPath) &&
            !_.isEmpty(dateFieldValue)
        ) {
            qb.filter.byDateRange(
                dateFieldPath, {
                    startDate: dateFieldValue.startOf('day').format(),
                    endDate: dateFieldValue.endOf('day').format()
                }
            );
        }

        // add location condition
        if (
            !_.isEmpty(locationFieldPath) &&
            !_.isEmpty(locationFieldValue)
        ) {
            qb.filter.byEquality(
                locationFieldPath,
                locationFieldValue
            );
        }

        // finished
        return qb;
    }
}
