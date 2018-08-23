import { RequestFilter, RequestFilterOperator, RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';
import { ListFilterDataService } from '../services/data/list-filter.data.service';
import { Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { ApplyListFilter, Constants } from '../models/constants';
import { FormRangeModel } from '../../shared/components/form-range/form-range.model';
import { BreadcrumbItemModel } from '../../shared/components/breadcrumbs/breadcrumb-item.model';
import { QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ResetInputOnSideFilterDirective } from '../../shared/directives/reset-input-on-side-filter/reset-input-on-side-filter.directive';
import { MatSort, MatSortable } from '@angular/material';
import { SideFiltersComponent } from '../../shared/components/side-filters/side-filters.component';
import { DebounceTimeCaller } from './debounce-time-caller';
import { Subscriber } from '../../../../node_modules/rxjs/Subscriber';
import { DateRangeModel } from '../models/date-range.model';

export abstract class ListComponent {
    /**
     * Determine all children that we need to reset when side filters are being applied
     */
    @ViewChildren(ResetInputOnSideFilterDirective) protected filterInputs: QueryList<ResetInputOnSideFilterDirective>;

    /**
     * Retrieve Mat Table
     */
    @ViewChild('table', { read: MatSort }) matTableSort: MatSort;

    /**
     * Retrieve Side Filters
     */
    @ViewChild(SideFiltersComponent) sideFilter: SideFiltersComponent;

    public breadcrumbs: BreadcrumbItemModel[];

    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    /**
     * Applied list filter on this list page
     */
    protected appliedListFilter: ApplyListFilter;

    /**
     * List Filter Query Builder
     */
    protected appliedListFilterQueryBuilder: RequestQueryBuilder;

    /**
     * List Filter Callback called when applying side filter query builder
     */
    protected appliedListFilterCleanupBefore: () => void;

    /**
     * Models for the checkbox functionality
     * @type {boolean}
     */
    public checkboxModels = {
        checkAll: false,
        individualCheck: []
    };

    // refresh only after we finish changing data
    private triggerListRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
        this.refreshList();
    }));

    protected constructor(
        protected listFilterDataService: ListFilterDataService = null,
        protected queryParams: Observable<Params> = null
    ) {
        // check the filter after creating the List Component instance
        setTimeout(() => {
            this.checkListFilters();
        });
    }

    /**
     * Refresh list
     */
    public abstract refreshList();

    /**
     * Tell list that we need to refresh list
     */
    protected needsRefreshList(instant: boolean = false) {
        this.triggerListRefresh.call(instant);
    }

    /**
     * Sort asc / desc by specific fields
     * @param data
     */
    public sortBy(data) {
        const property = _.get(data, 'active');
        const direction = _.get(data, 'direction');

        // remove previous sort columns, we can sort only by one column at a time
        this.queryBuilder.sort.clear();

        // retrieve Side filters
        let queryBuilder;
        if (
            this.sideFilter &&
            (queryBuilder = this.sideFilter.getQueryBuilder())
        ) {
            this.queryBuilder.sort.merge(queryBuilder.sort);
        }

        // sort
        if (
            property &&
            direction
        ) {
            // apply sort
            this.queryBuilder.sort.by(property, direction);
        }

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByTextField(
        property: string | string[],
        value: string,
        operator: RequestFilterOperator = RequestFilterOperator.OR
    ) {
        if (_.isArray(property)) {
            this.queryBuilder.filter.byTextMultipleProperties(
                property as string[],
                value,
                true,
                operator
            );
        } else {
            this.queryBuilder.filter.byText(
                property as string,
                value
            );
        }

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByBooleanField(property: string, value: boolean | null | undefined) {
        this.queryBuilder.filter.byBoolean(property, value);

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a range field ('from' / 'to')
     * @param {string} property
     * @param {FormRangeModel} value Object with 'from' and 'to' properties
     */
    filterByRangeField(property: string, value: FormRangeModel) {
        this.queryBuilder.filter.byRange(property, value);

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a date range field ('startDate' / 'endDate')
     * @param {string} property
     * @param value Object with 'startDate' and 'endDate' properties
     */
    filterByDateRangeField(property: string, value: {startDate: Date, endDate: Date}) {
        // filter by date range
        this.queryBuilder.filter.byDateRange(property, value);

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a Select / Multi-Select field
     * @param {string} property
     * @param {any | any[]} values
     * @param {string} valueKey
     */
    filterBySelectField(property: string, values: any | any[], valueKey: string = 'value') {
        this.queryBuilder.filter.bySelect(property, values, true, valueKey);

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter by deleted field
     * @param value
     */
    filterByDeletedField(value: boolean | null | undefined) {
        // filter
        if (value === false) {
            this.queryBuilder.excludeDeleted();
            this.queryBuilder.filter.remove('deleted');
        } else {
            this.queryBuilder.includeDeleted();
            if (value === true) {
                this.queryBuilder.filter.where({
                    'deleted': {
                        'eq': true
                    }
                }, true);
            } else {
                this.queryBuilder.filter.remove('deleted');
            }
        }

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter by relation
     * @param {string | string[]} relation
     * @returns {RequestFilter}
     */
    filterByRelation(relation: string | string[]): RequestFilter {
        // make sure we always have an array of relations
        const relations: string[] = (_.isArray(relation) ?
            relation :
            [relation]
        ) as string[];

        // go through all the relations until we get the desired query builder
        let relationQB: RequestQueryBuilder = this.queryBuilder;
        _.each(relations, (rel: string) => {
            relationQB = relationQB.include(rel).queryBuilder;
        });

        // refresh list
        // this one isn't executed instantly, so there should be enough time to setup the relation filter
        this.needsRefreshList();

        // retrieve filter
        return relationQB.filter;
    }

    /**
     * Clear query builder of conditions & include & ....
     */
    clearQueryBuilder() {
        // clear query filters
        this.queryBuilder.clear();

        // apply list filters which is mandatory
        this.applyListFilter();
    }

    /**
     * Clear table filters
     */
    clearHeaderFilters() {
        // clear header filters
        if (this.filterInputs) {
            this.filterInputs.forEach((input: ResetInputOnSideFilterDirective) => {
                input.reset();
            });
        }

        // refresh of the list is done automatically after debounce time
        // #
    }

    /**
     * Reset table sort columns
     */
    clearHeaderSort() {
        if (this.matTableSort) {
            this.matTableSort.sort({
                id: null
            } as MatSortable);
        }

        // refresh of the list is done automatically after debounce time
        // #
    }

    /**
     * Clear header filters & sort
     */
    resetFiltersToSideFilters() {
        // clear query builder
        this.clearQueryBuilder();

        // clear table filters
        this.clearHeaderFilters();

        // reset table sort columns
        this.clearHeaderSort();

        // retrieve Side filters
        let queryBuilder;
        if (
            this.sideFilter &&
            (queryBuilder = this.sideFilter.getQueryBuilder())
        ) {
            this.queryBuilder = queryBuilder;
        }

        // apply list filters which is mandatory
        this.applyListFilter();

        // refresh of the list is done automatically after debounce time
        // #
    }

    /**
     * Apply the filters selected from the Side Filters section
     * @param {RequestQueryBuilder} queryBuilder
     */
    applySideFilters(queryBuilder: RequestQueryBuilder) {
        // clear table filters
        this.clearHeaderFilters();

        // reset table sort columns
        this.clearHeaderSort();

        // replace query builder with side filters
        this.queryBuilder = queryBuilder;

        // apply list filters which is mandatory
        this.applyListFilter();

        // refresh list
        this.needsRefreshList(true);
    }

    /**
     * Apply list filter
     */
    protected applyListFilter() {
        // apply other modifications to query builder
        if (this.appliedListFilterCleanupBefore) {
            this.appliedListFilterCleanupBefore();
        }

        // merge filter query builder
        if (this.appliedListFilterQueryBuilder) {
            this.queryBuilder.merge(_.cloneDeep(this.appliedListFilterQueryBuilder));
        }
    }

    /**
     *  Check if list filter applies
     */
    protected checkListFilters() {
        if (
            !_.isEmpty(this.queryParams) &&
            !_.isEmpty(this.listFilterDataService)
        ) {
            // get query params
            this.queryParams
                .subscribe((queryParams: any) => {
                    // reset values
                    this.appliedListFilter = null;
                    this.appliedListFilterCleanupBefore = null;
                    this.appliedListFilterQueryBuilder = null;

                    // apply query params
                    if (!_.isEmpty(queryParams)) {
                        // call function to apply filters - update query builder
                        this.applyListFilters(queryParams);

                    // handle browser back / forwards buttons
                    } else {
                        // needs refresh
                        this.needsRefreshList(true);
                    }
                });
        }
    }

    /**
     * Update page breadcrumbs based on the applied filter
     * @param {string} listFilter
     * @param listFilterData
     */
    protected setListFilterBreadcrumbs(listFilter: string, listFilterData: any = {}) {
        const breadcrumbToken = Constants.LIST_FILTER_TITLE[listFilter];

        if (breadcrumbToken) {
            // clone current breadcrumbs
            const currentBreadcrumbs = _.cloneDeep(this.breadcrumbs);

            // get the breadcrumb representing the list page
            const listPageBreadcrumb: BreadcrumbItemModel = _.find(this.breadcrumbs, {active: true});

            if (listPageBreadcrumb) {
                // update the breadcrumb
                listPageBreadcrumb.active = false;
                listPageBreadcrumb.onClick = () => {
                    // clear all filters
                    this.queryBuilder = new RequestQueryBuilder();
                    this.needsRefreshList(true);

                    // revert breadcrumbs
                    this.breadcrumbs = currentBreadcrumbs;
                };
            }

            // add new breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(breadcrumbToken, '.', true, {}, listFilterData)
            );
        }
    }

    /**
     * Verify what list filter is sent into the query params and updates the query builder based in this.
     * @param queryParams
     */
    protected applyListFilters(queryParams: {applyListFilter, x, dateRange, locationIds}): void {
        // update breadcrumbs
        this.setListFilterBreadcrumbs(queryParams.applyListFilter, queryParams);

        // check params for apply list filter
        this.appliedListFilter = queryParams.applyListFilter;
        switch (this.appliedListFilter) {
            // Filter contacts on the followup list
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsOnFollowUpLists()
                    .subscribe((qbFilterContactsOnFollowUpLists) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsOnFollowUpLists;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases deceased
            case Constants.APPLY_LIST_FILTER.CASES_DECEASED:
                // add condition for deceased cases
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    deceased: true
                }, true);

                // merge query builder
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases hospitalised
            case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesHospitalized()
                    .subscribe((qbFilterCasesHospitalized) => {
                        this.appliedListFilterQueryBuilder = qbFilterCasesHospitalized;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter contacts not seen
            case Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN:
                // get the number of days if it was updated
                const noDaysNotSeen = _.get(queryParams, 'x', null);
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsNotSeen(noDaysNotSeen)
                    .subscribe((qbFilterContactsNotSeen) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsNotSeen;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases with less than x contacts
            case Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS:
                // get the number of contacts if it was updated
                const noLessContacts = _.get(queryParams, 'x', null);
                  // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesLessThanContacts(noLessContacts)
                    .subscribe((qbFilterCasesLessThanContacts) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesLessThanContacts;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter contacts lost to follow-up
            case Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsLostToFollowUp()
                    .subscribe((qbFilterContactsLostToFollowUp) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsLostToFollowUp;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter cases in known transmission chains
            case Constants.APPLY_LIST_FILTER.CASES_IN_KNOWN_TRANSMISSION_CHAINS:
                // get the number of days if it was updated
                const noDaysInChains = _.get(queryParams, 'x', null);
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesInKnownChains(noDaysInChains)
                    .subscribe((qbFilterCasesInKnownChains) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesInKnownChains;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases among contacts
            case Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS:
                // get the number of days  if it was updated
                const noDaysAmongContacts = _.get(queryParams, 'x', null);
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesAmongKnownContacts(noDaysAmongContacts)
                    .subscribe((qbFilterCasesAmongKnownContacts) => {
                        // remove condition on property 'id' to not duplicate it
                        this.appliedListFilterCleanupBefore = () => {
                            this.queryBuilder.filter.remove('id');
                        };

                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesAmongKnownContacts;
                        this.applyListFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter suspect cases with pending lab result
            case Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT:
                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter suspect cases refusing treatment
            case Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT:
                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesRefusingTreatment();
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases among contacts
            case Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterActiveChainsOfTransmission();
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter contacts becoming cases overtime and place
            case Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES:
                const dateRange: DateRangeModel = queryParams.dateRange ? JSON.parse(queryParams.dateRange) : undefined;
                const locationIds: string[] = queryParams.locationIds;
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesFromContactsOvertimeAndPlace(
                    dateRange,
                    locationIds
                );
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // refresh list on query params changes ( example browser back button was pressed )
            case Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
                this.needsRefreshList(true);
                break;

            // filter cases without relationships
            case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS:
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesWithoutRelationships();
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter events without relationships
            case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS:
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterEventsWithoutRelationships();
                this.applyListFilter();

                // refresh list
                this.needsRefreshList(true);
                break;
        }
    }

    /**
     * "Check All" checkbox was touched
     */
    checkAll() {
        // check/un-check all individual checkboxes
        for (const key in this.checkboxModels.individualCheck) {
            this.checkboxModels.individualCheck[key] = this.checkboxModels.checkAll;
        }
    }

    /**
     * An individual checkbox was touched
     */
    individualCheck() {
        // un-check the "CheckAll" checkbox
        this.checkboxModels.checkAll = false;
    }

    initIndividualCheckbox(key) {
        this.checkboxModels.individualCheck[key] = !!this.checkboxModels.individualCheck[key];
    }

}
