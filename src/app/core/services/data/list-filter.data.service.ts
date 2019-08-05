import { Injectable } from '@angular/core';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { OutbreakDataService } from './outbreak.data.service';
import { FollowUpsDataService } from './follow-ups.data.service';
import { Observable, of } from 'rxjs';
import { OutbreakModel } from '../../models/outbreak.model';
import { GenericDataService } from './generic.data.service';
import { RelationshipDataService } from './relationship.data.service';
import { MetricContactsLostToFollowUpModel } from '../../models/metrics/metric-contacts-lost-to-follow-up.model';
import { Constants } from '../../models/constants';
import * as _ from 'lodash';
import { RequestFilterOperator } from '../../helperClasses/request-query-builder/request-filter';
import { ContactDataService } from './contact.data.service';
import { DateType } from '../../enums/date-types.enum';
import { map, mergeMap } from 'rxjs/operators';
import { Moment, moment } from '../../helperClasses/x-moment';

@Injectable()
export class ListFilterDataService {

    constructor(
        private outbreakDataService: OutbreakDataService,
        private followUpDataService: FollowUpsDataService,
        private genericDataService: GenericDataService,
        private relationshipDataService: RelationshipDataService,
        private contactDataService: ContactDataService
    ) {}

    private handleFilteringOfLists(callback): Observable<RequestQueryBuilder> | any {
        return this.outbreakDataService
            .getSelectedOutbreakSubject()
            .pipe(
                mergeMap((selectedOutbreak: OutbreakModel) => {
                    if (selectedOutbreak && selectedOutbreak.id) {
                        return callback(selectedOutbreak);
                    } else {
                        return of(new RequestQueryBuilder());
                    }
                })
            );
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

            // date
            if (date) {
                qb.filter
                    .byEquality(
                        'startDate',
                        moment(date).startOf('day').toISOString()
                    ).byEquality(
                        'endDate',
                        moment(date).endOf('day').toISOString()
                    );
            }

            // change the way we build query
            qb.filter.firstLevelConditions();

            // filter
            return this.followUpDataService
                .getCountIdsOfContactsOnTheFollowUpList(selectedOutbreak.id, qb)
                .pipe(
                    map((result) => {
                        // update queryBuilder filter with desired contacts ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.contactIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
        });
    }

    /**
     * Create the query builder for filtering the list of contacts
     * @param date
     * @param location
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
                .pipe(
                    map((result) => {
                        // update queryBuilder filter with desired contacts ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.contactIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
        });
    }

    /**
     * Construct hospitalized condition
     * @param negated
     */
    private getFilterHospitalizedCondition(date, negated: boolean = false) {
        const elementCondition = {
            [negated ? '$elemMatch' : 'elemMatch']: {
                typeId: DateType.HOSPITALIZATION_DATE,
                startDate: {
                    $lte: moment(date).endOf('day').toISOString()
                },
                $or: [
                    {
                        endDate: {
                            $eq: null
                        }
                    }, {
                        endDate: {
                            $gte: moment(date).endOf('day').toISOString()
                        }
                    }
                ]
            }
        };

        // finished
        return {
            dateRanges: negated ?
                { not: elementCondition } :
                elementCondition
        };
    }

    /**
     * Create the query builder for filtering the list of cases
     * @returns {RequestQueryBuilder}
     */
    filterCasesHospitalized(date: string | Moment): RequestQueryBuilder {
        // generate a query builder for hospitalized cases
        const filterQueryBuilder = new RequestQueryBuilder();

        // compare hospitalisation dates start and end with current date
        filterQueryBuilder.filter.where(
            this.getFilterHospitalizedCondition(date, false),
            true
        );

        // finished
        return filterQueryBuilder;
    }

    /**
     * Retrieve cases that aren't hospitalized
     * @param date
     */
    filterCasesNotHospitalized(date: string | Moment): RequestQueryBuilder {
        // generate a query builder for hospitalized cases
        const filterQueryBuilder = new RequestQueryBuilder();

        // compare hospitalisation dates start and end with current date
        filterQueryBuilder.filter.where(
            this.getFilterHospitalizedCondition(date, true),
            true
        );

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
                    'dateRanges.typeId': DateType.ISOLATION_DATE
                },
                {
                    'dateRanges.startDate': {
                        lte: moment(date).endOf('day').toISOString()
                    }
                }, {
                    [RequestFilterOperator.OR]: [{
                        'dateRanges.endDate': {
                            eq: null
                        }
                    }, {
                        'dateRanges.endDate': {
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
     * @param date
     * @param location
     * @param classificationId
     * @param {number} noLessContacts
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesLessThanContacts(
        date,
        location,
        classificationId,
        noLessContacts
    ): Observable<RequestQueryBuilder> {
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
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            // classification
            if (!_.isEmpty(classificationId)) {
                qb.include('people').queryBuilder.filter
                    .where({
                        and: [{
                            classification: {
                                inq: classificationId
                            }
                        }]
                    });
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
                .pipe(
                    map((result) => {
                        // update queryBuilder filter with desired case ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.caseIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
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

            // location
            if (location) {
                qb.filter.byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.followUpDataService
                .getNumberOfContactsWhoAreLostToFollowUp(selectedOutbreak.id, qb)
                .pipe(
                    map((result: MetricContactsLostToFollowUpModel) => {
                        // update queryBuilder filter with desired contacts ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.contactIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
        });
    }

    /**
     * Create the query builder for filtering the list of cases
     * @param date
     * @param location
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
                    .byEquality('addresses.parentLocationIdFilter', location);
            }

            return this.relationshipDataService
                .getCountOfCasesOutsideTheTransmissionChains(selectedOutbreak.id, qb)
                .pipe(
                    map((result) => {
                        // update queryBuilder filter with desired case ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.caseIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
        });
    }

    /**
     * Create the query builder for filtering the list of cases
     * @param date
     * @param location
     * @param classificationId
     * @param {number} noDaysAmongContacts
     * @returns {Observable<RequestQueryBuilder>}
     */
    filterCasesAmongKnownContacts(
        date,
        location,
        classificationId,
        noDaysAmongContacts
    ): Observable<RequestQueryBuilder> {
        return this.handleFilteringOfLists((selectedOutbreak) => {
            // add global filters
            const qb = this.getGlobalFilterQB(
                null,
                null,
                'addresses.parentLocationIdFilter',
                location,
                classificationId
            );

            // exclude discarded cases
            qb.filter.where({
                classification: {
                    neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                }
            });

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
                .pipe(
                    map((result) => {
                        // update queryBuilder filter with desired contacts ids
                        const filterQueryBuilder = new RequestQueryBuilder();
                        filterQueryBuilder.filter.where({
                            id: {
                                'inq': result.newCasesAmongKnownContactsIDs
                            }
                        }, true);
                        return filterQueryBuilder;
                    })
                );
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
     * @param {string} location
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
     * Create the query builder for filtering the contacts that have been successfully followed up
     * @param {date} date
     * @param {string} location
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
            },
            classification: {
                neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
            }
        });
        return qb;
    }

    /**
     * Global filters
     * @param dateFieldPath
     * @param dateFieldValue
     * @param locationFieldPath
     * @param locationFieldValue
     * @param classificationFieldValue
     */
    getGlobalFilterQB(
        dateFieldPath: string,
        dateFieldValue: Moment,
        locationFieldPath: string,
        locationFieldValue: string,
        classificationFieldValue?: string[]
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

        // classification
        if (!_.isEmpty(classificationFieldValue)) {
            qb.filter.where({
                and: [{
                    classification: {
                        inq: classificationFieldValue
                    }
                }]
            });
        }

        // finished
        return qb;
    }
}
