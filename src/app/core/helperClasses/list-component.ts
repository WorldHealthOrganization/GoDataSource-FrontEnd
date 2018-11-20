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
import { MatPaginator, MatSort, MatSortable, PageEvent } from '@angular/material';
import { SideFiltersComponent } from '../../shared/components/side-filters/side-filters.component';
import { DebounceTimeCaller } from './debounce-time-caller';
import { Subscriber } from '../../../../node_modules/rxjs/Subscriber';
import { DateRangeModel } from '../models/date-range.model';
import { Moment } from 'moment';
import { MetricContactsSeenEachDays } from '../models/metrics/metric-contacts-seen-each-days.model';
import * as moment from 'moment';
import { FormCheckboxComponent } from '../../shared/xt-forms/components/form-checkbox/form-checkbox.component';
import { SnackbarService } from '../services/helper/snackbar.service';
import {
    ContactFollowedUp,
    MetricContactsWithSuccessfulFollowUp
} from '../models/metrics/metric.contacts-with-success-follow-up.model';
import { VisibleColumnModel } from '../../shared/components/side-columns/model';

export abstract class ListComponent {
    /**
     * Breadcrumbs
     */
    public breadcrumbs: BreadcrumbItemModel[];

    /**
     * Determine all children that we need to reset when side filters are being applied
     */
    @ViewChildren(ResetInputOnSideFilterDirective) protected filterInputs: QueryList<ResetInputOnSideFilterDirective>;

    /**
     * Retrieve Mat Table sort handler
     */
    @ViewChild('table', { read: MatSort }) matTableSort: MatSort;

    /**
     * Retrieve Side Filters
     */
    @ViewChild(SideFiltersComponent) sideFilter: SideFiltersComponent;

    /**
     * Retrieve Paginator
     */
    @ViewChild(MatPaginator) paginator: MatPaginator;

    /**
     * Individual checkboxes selects
     */
    @ViewChildren('listCheckedIndividual') protected listCheckedIndividualInputs: QueryList<FormCheckboxComponent >;

    /**
     * List table columns
     */
    tableColumns: VisibleColumnModel[] = [];

    /**
     * List table visible columns
     */
    visibleTableColumns: string[] = [];

    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    /**
     * Applied list filter on this list page
     */
    public appliedListFilter: ApplyListFilter;

    /**
     * List Filter Query Builder
     */
    protected appliedListFilterQueryBuilder: RequestQueryBuilder;

    public pageSize: number = Constants.DEFAULT_PAGE_SIZE;
    public pageSizeOptions: number[] = Constants.PAGE_SIZE_OPTIONS;
    private paginatorInitialized = false;

    /**
     * Models for the checkbox functionality
     * @type {boolean}
     */
    private checkboxModels = {
        checkAll: false,
        individualCheck: {}
    };

    /**
     * All checkbox selected
     * @param value
     */
    set checkedAllRecords(value: boolean) {
        // set master check all
        this.checkboxModels.checkAll = value;

        // check/un-check all individual checkboxes
        for (const id in this.checkboxModels.individualCheck) {
            this.checkboxModels.individualCheck[id] = this.checkboxModels.checkAll;
        }

        // go through all html checkboxes and update their value - this is faster than using binding which slows down a lot the page
        if (
            this.listCheckedIndividualInputs &&
            this.listCheckedIndividualInputs.length > 0
        ) {
            this.listCheckedIndividualInputs.forEach((checkbox: FormCheckboxComponent) => {
                // retrieve id
                const id = checkbox.name.substring(checkbox.name.lastIndexOf('[') + 1, checkbox.name.lastIndexOf(']'));
                checkbox.value = !!this.checkboxModels.individualCheck[id];
            });
        }
    }
    get checkedAllRecords(): boolean {
        return this.checkboxModels.checkAll;
    }

    // refresh only after we finish changing data
    private triggerListRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
        // refresh list
        this.refreshList();
    }));

    // refresh only after we finish changing data
    private triggerListCountRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
        // refresh list
        this.refreshListCount();
    }));

    protected constructor(
        protected snackbarService: SnackbarService,
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
     * Refresh items count
     * Note: To be overridden on pages that implement pagination
     */
    public refreshListCount() {
        console.error('Component must implement \'refreshListCount\' method');
    }

    /**
     * Tell list that we need to refresh list
     */
    public needsRefreshList(instant: boolean = false, resetPagination: boolean = true) {
        // reset checked items
        this.checkboxModels.checkAll = false;
        this.checkboxModels.individualCheck = {};

        // do we need to reset pagination (aka go to the first page) ?
        if (
            resetPagination &&
            this.paginatorInitialized
        ) {
            // re-calculate items count (filters have changed)
            this.triggerListCountRefresh.call(instant);

            // move to the first page (if not already there)
            if (this.paginator.hasPreviousPage()) {
                this.paginator.firstPage();
                // no need to refresh the list here, because our 'changePage' hook will trigger that again
                return;
            }
        }

        // refresh list
        this.triggerListRefresh.call(instant);
    }

    /**
     * Sort asc / desc by specific fields
     * @param data
     */
    public sortBy(
        data: any,
        objectDetailsSort?: {
            [property: string]: string[]
        }
    ) {
        // sort information
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
            // add sorting criteria
            if (
                objectDetailsSort &&
                objectDetailsSort[property]
            ) {
                _.each(objectDetailsSort[property], (childProperty: string) => {
                    this.queryBuilder.sort.by(
                        `${property}.${childProperty}`,
                        direction
                    );
                });
            } else {
                this.queryBuilder.sort.by(
                    property,
                    direction
                );
            }
        }

        // refresh list
        this.needsRefreshList(false, false);
    }

    /**
     * Filter the list by a text field
     * @param {string | string[]} property
     * @param {string} value
     * @param {RequestFilterOperator} operator
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
    filterByTextContainingField(
        property: string,
        value: string
    ) {
        this.queryBuilder.filter.byContainingText(
            property as string,
            value
        );

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
     * Filter the list by an age range field ('from' / 'to')
     * @param {string} property
     * @param {FormRangeModel} value Object with 'from' and 'to' properties
     */
    filterByAgeRangeField(
        property: string,
        value: FormRangeModel
    ) {
        // filter by age range
        this.queryBuilder.filter.byAgeRange(property, value);

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by a date field ( startOf day => endOf day )
     * @param {string} property
     * @param value Date
     */
    filterByDateField(property: string, value: Moment) {
        // filter by date
        if (_.isEmpty(value)) {
            this.queryBuilder.filter.byDateRange(property, value);
        } else {
            this.queryBuilder.filter.byDateRange(
                property, {
                    startDate: moment(value).startOf('day'),
                    endDate: moment(value).endOf('day')
                }
            );
        }

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
     * Initialize paginator
     */
    protected initPaginator() {
        // initialize query paginator
        this.queryBuilder.paginator.setPage({
            pageSize: this.pageSize,
            pageIndex: 0
        });

        this.paginatorInitialized = true;
    }

    changePage(page: PageEvent) {
        // update API pagination params
        this.queryBuilder.paginator.setPage(page);

        // refresh list
        this.needsRefreshList(true, false);
    }

    /**
     * Clear query builder of conditions and sorting criterias
     */
    clearQueryBuilder() {
        // clear query filters
        this.queryBuilder.clear();

        // apply list filters which is mandatory
        this.mergeListFilterToMainFilter();
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
     * Callback called when resetting search filters ( can be used to add default filter criteria )
     */
    resetFiltersAddDefault() {
        // NOTHING
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

        // add default filter criteria
        this.resetFiltersAddDefault();

        // retrieve Side filters
        let queryBuilder;
        if (
            this.sideFilter &&
            (queryBuilder = this.sideFilter.getQueryBuilder())
        ) {
            this.queryBuilder.merge(queryBuilder);
        }

        // apply list filters which is mandatory
        this.mergeListFilterToMainFilter();

        // refresh of the list is done automatically after debounce time
        // #

        // refresh paginator?
        if (this.paginatorInitialized) {
            // refresh total number of items
            this.triggerListCountRefresh.call(true);
        }
    }

    /**
     * Apply the filters selected from the Side Filters section
     * @param {RequestQueryBuilder} queryBuilder
     */
    applySideFilters(queryBuilder: RequestQueryBuilder) {
        // clear query builder of conditions and sorting criterias
        this.clearQueryBuilder();

        // clear table filters
        this.clearHeaderFilters();

        // reset table sort columns
        this.clearHeaderSort();

        // merge query builder with side filters
        this.queryBuilder.merge(queryBuilder);

        // apply list filters which is mandatory
        this.mergeListFilterToMainFilter();

        // refresh list
        this.needsRefreshList(true);
    }

    /**
     * Apply list filter
     */
    protected mergeListFilterToMainFilter() {
        // merge filter query builder
        if (this.appliedListFilterQueryBuilder) {
            this.queryBuilder.merge(_.cloneDeep(this.appliedListFilterQueryBuilder));
        }
    }

    /**
     * Check if list filter applies
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
    protected applyListFilters(queryParams: {
        applyListFilter,
        x,
        dateRange,
        locationIds,
        date,
        global
    }): void {
        // update breadcrumbs
        this.setListFilterBreadcrumbs(queryParams.applyListFilter, queryParams);

        // get global filter values
        const globalFilters = this.getGlobalFilterValues(queryParams);
        let globalQb: RequestQueryBuilder;

        // check params for apply list filter
        this.appliedListFilter = queryParams.applyListFilter;
        switch (this.appliedListFilter) {
            // Filter contacts on the followup list
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsOnFollowUpLists()
                    .subscribe((qbFilterContactsOnFollowUpLists) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsOnFollowUpLists;
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases deceased
            case Constants.APPLY_LIST_FILTER.CASES_DECEASED:
                // add condition for deceased cases
                this.appliedListFilterQueryBuilder = this.listFilterDataService.getGlobalFilterQB(
                    'dateDeceased',
                    globalFilters.date,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );
                this.appliedListFilterQueryBuilder.filter.where({
                    deceased: true
                }, true);

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases hospitalised
            case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
                // add condition for deceased cases
                globalQb = this.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesHospitalized(globalFilters.date);
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter contacts not seen
            case Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN:
                // get the number of days if it was updated
                const noDaysNotSeen = _.get(queryParams, 'x', null);
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsNotSeen(noDaysNotSeen)
                    .subscribe((qbFilterContactsNotSeen) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsNotSeen;
                        this.mergeListFilterToMainFilter();

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
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesLessThanContacts;
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter contacts lost to follow-up
            case Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsLostToFollowUp()
                    .subscribe((qbFilterContactsLostToFollowUp) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsLostToFollowUp;
                        this.mergeListFilterToMainFilter();

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
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesInKnownChains;
                        this.mergeListFilterToMainFilter();

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
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesAmongKnownContacts;
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter suspect cases with pending lab result
            case Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT:
                // add condition for deceased cases
                globalQb = this.listFilterDataService.getGlobalFilterQB(
                    'dateOfOnset',
                    globalFilters.date,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter suspect cases refusing treatment
            case Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT:
                // add condition for deceased cases
                globalQb = this.listFilterDataService.getGlobalFilterQB(
                    'dateOfOnset',
                    globalFilters.date,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesRefusingTreatment();
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases among contacts
            case Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterActiveChainsOfTransmission();
                this.mergeListFilterToMainFilter();

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
                this.mergeListFilterToMainFilter();

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
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter events without relationships
            case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS:
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterEventsWithoutRelationships();
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter contacts seen
            case Constants.APPLY_LIST_FILTER.CONTACTS_SEEN:

                const date: Moment = moment(queryParams.date);
                this.listFilterDataService.filterContactsSeen(date)
                    .subscribe((result: MetricContactsSeenEachDays) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                        this.appliedListFilterQueryBuilder.filter.where({
                            id: {
                                'inq': result.contactIDs
                            }
                        }, true);
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter contacts witch successful follow-up
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP:

                const followedDate: Moment = moment(queryParams.date);
                this.listFilterDataService.filterContactsWithSuccessfulFollowup(followedDate)
                    .subscribe((result: MetricContactsWithSuccessfulFollowUp) => {
                        const contactIDs: string[] = _.chain(result.contacts)
                            .filter((item: ContactFollowedUp) => item.successfulFollowupsCount > 0)
                            .map((item: ContactFollowedUp) => {
                                return item.id;
                            }).value();
                        // merge query builder
                        this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                        this.appliedListFilterQueryBuilder.filter.where({
                            id: {
                                'inq': contactIDs
                            }
                        }, true);

                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter cases without date of onset.
            case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN:
                // get the case ids that need to be updated
                const caseIds = _.get(queryParams, 'caseIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': caseIds
                    }
                }, true);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter contacts without date of last contact.
            case Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN:
                // get the contact ids that need to be updated
                const contactIds = _.get(queryParams, 'contactIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': contactIds
                    }
                }, true);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter events without date
            case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN:
                // get the event ids that need to be updated
                const eventIds = _.get(queryParams, 'eventIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': eventIds
                    }
                }, true);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter cases who are not identified though known contact list
            case Constants.APPLY_LIST_FILTER.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS:
                // add condition for deceased cases
                globalQb = this.listFilterDataService.getGlobalFilterQB(
                    'dateOfOnset',
                    globalFilters.date,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listFilterDataService.filterCasesNotIdentifiedThroughContacts();
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter context sensitive help items
            case Constants.APPLY_LIST_FILTER.CONTEXT_SENSITIVE_HELP_ITEMS:
                // get the help items ids that need to be updated
                const helpItemsIds = _.get(queryParams, 'helpItemsIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': helpItemsIds
                    }
                }, false);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

        }
    }

    /**
     * Retrieve Global Filter Values
     * @param queryParams
     */
    getGlobalFilterValues(queryParams: {
        global?: string | {
            date?: Moment,
            locationId?: string
        }
    }): {
        date?: Moment,
        locationId?: string
    } {
        // do we need to decode global filters ?
        const global: {
            date?: Moment,
            locationId?: string
        } = !queryParams.global ?
            {} : (
                _.isString(queryParams.global) ?
                    JSON.parse(queryParams.global as string) :
                    queryParams.global
            );

        // parse date
        if (global.date) {
            global.date = moment(global.date);
        }

        // finished
        return global;
    }

    /**
     * Individual Checkbox
     */
    checkedRecord(id: string, checked: boolean) {
        // set value
        this.checkboxModels.individualCheck[id] = checked ? true : false;

        // reset check all
        let checkedAll: boolean = true;
        _.each(this.checkboxModels.individualCheck, (check: boolean) => {
            if (!check) {
                checkedAll = false;
                return false;
            }
        });

        // set check all value
        this.checkboxModels.checkAll = checkedAll;
    }

    /**
     * Retrieve list of checked records ( an array of IDs )
     */
    get checkedRecords(): string[] {
        const ids: string[] = [];
        _.each(
            this.checkboxModels.individualCheck,
            (checked: boolean, id: string) => {
                if (checked) {
                    ids.push(id);
                }
            }
        );
        return ids;
    }

    /**
     * Check that we have at least one record selected
     * @returns {false|string[]} False if not valid, list of ids otherwise
     */
    validateCheckedRecords() {
        // get list of ids
        const selectedRecords: string[] = this.checkedRecords;

        // validate
        if (selectedRecords.length < 1) {
            // display message
            if (this.snackbarService) {
                this.snackbarService.showError('LNG_COMMON_LABEL_NO_RECORDS_SELECTED');
            }

            // not valid
            return false;
        }

        // valid, send list of IDs back
        return selectedRecords;
    }

    /**
     * Visible columns
     * @param visibleColumns
     */
    applySideColumnsChanged(visibleColumns: string[]) {
        this.visibleTableColumns = visibleColumns;
    }
}
