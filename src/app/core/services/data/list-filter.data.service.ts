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
import { EntityType } from '../../models/entity-type';

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
    filterContactsOnFollowUpLists(date, location): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                null,
                'address.parentLocationIdFilter',
                location
            );

            // no date provided, then we need to set the default one
            // filter by day - default - yesterday
            if (!date) {
                date = moment().add(-1, 'days');
            }

            // date condition
            qb.filter.byEquality(
                'date',
                moment(date).format('YYYY-MM-DD')
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // filter
            return this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id, qb)
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
    filterContactsNotSeen(date, location, noDaysNotSeen): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // convert
            noDaysNotSeen = _.isNumber(noDaysNotSeen) || _.isEmpty(noDaysNotSeen) ? noDaysNotSeen : _.parseInt(noDaysNotSeen);
            if (_.isNumber(noDaysNotSeen)) {
                // add number of days until current day
                if (date) {
                    noDaysNotSeen += moment().endOf('day').diff(moment(date).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysNotSeen',
                    noDaysNotSeen
                );
            }

            // date
            if (date) {
                qb.filter.where({
                    date: {
                        lte: moment(date).toISOString()
                    }
                });
            }

            // location
            if (location) {
                qb.include('contact').queryBuilder.filter
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.followUpDataService
                .getCountIdsOfContactsNotSeen(selectedOutbreak.id, qb)
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
    filterCasesIsolated(date): RequestQueryBuilder {
        // generate a query builder for isolated cases
        const filterQueryBuilder = new RequestQueryBuilder();

        // compare isolation dates start and end with current date
        filterQueryBuilder.filter.where({
            [RequestFilterOperator.AND]: [
                {
                    'isolationDates.startDate': {
                        lte: moment(date).endOf('day').toISOString()
                    }
                }, {
                    [RequestFilterOperator.OR]: [{
                        'isolationDates.endDate': {
                            eq: null
                        }
                    }, {
                        'isolationDates.endDate': {
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
     * @param {number} noLessContacts
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesLessThanContacts(date, location, noLessContacts): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (date) {
                qb.filter.byDateRange(
                    'contactDate', {
                        endDate: date.endOf('day').format()
                    }
                );
            }

            // location
            if (location) {
                qb.include('people').queryBuilder.filter
                    .byEquality('type', EntityType.CONTACT)
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            // convert noLessContacts to number as the API expects
            noLessContacts = _.isNumber(noLessContacts) || _.isEmpty(noLessContacts) ? noLessContacts  : _.parseInt(noLessContacts);
            if (_.isNumber(noLessContacts)) {
                // create filter for daysNotSeen
                qb.filter.byEquality(
                    'noLessContacts',
                    noLessContacts
                );
            }

            return this.relationshipDataService
                .getCountIdsOfCasesLessThanXContacts(selectedOutbreak.id, qb)
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
            const qb = new RequestQueryBuilder();

            // no date provided, then wqe need to set teh default one
            // filter by day - default - yesterday
            if (!date) {
                date = moment().add(-1, 'days');
            }

            // date condition
            qb.filter.byEquality(
                'date',
                moment(date).format('YYYY-MM-DD')
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
    filterCasesInKnownChains(date, location, noDaysInChains): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = new RequestQueryBuilder();

            // change the way we build query
            qb.filter.firstLevelConditions();

            // convert
            noDaysInChains = _.isNumber(noDaysInChains) || _.isEmpty(noDaysInChains) ? noDaysInChains : _.parseInt(noDaysInChains);
            if (_.isNumber(noDaysInChains)) {
                // add number of days until current day
                if (date) {
                    noDaysInChains += moment().endOf('day').diff(moment(date).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysInChains',
                    noDaysInChains
                );
            }

            // date
            if (date) {
                qb.filter.where({
                    contactDate: {
                        lte: moment(date).toISOString()
                    }
                });
            }

            // location
            if (location) {
                qb.include('people').queryBuilder.filter
                    .byEquality('type', EntityType.CASE)
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.relationshipDataService
                .getCountOfCasesInKnownTransmissionChains(selectedOutbreak.id, qb)
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
    filterCasesAmongKnownContacts(date, location, noDaysAmongContacts): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                null,
                'addresses.parentLocationIdFilter',
                location
            );

            // change the way we build query
            qb.filter.firstLevelConditions();

            // date
            if (date) {
                qb.filter.where({
                    dateOfReporting: {
                        lte: moment(date).toISOString()
                    }
                });
            }

            // convert
            noDaysAmongContacts = _.isNumber(noDaysAmongContacts) || _.isEmpty(noDaysAmongContacts) ? noDaysAmongContacts  : _.parseInt(noDaysAmongContacts);
            if (_.isNumber(noDaysAmongContacts)) {
                // add number of days until current day
                if (date) {
                    noDaysAmongContacts += moment().endOf('day').diff(moment(date).endOf('day'), 'days');
                }

                // create filter
                qb.filter.byEquality(
                    'noDaysAmongContacts',
                    noDaysAmongContacts
                );
            }

            return this.relationshipDataService
                .getCountIdsOfCasesAmongKnownContacts(selectedOutbreak.id, qb)
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
