import { RequestFilter, RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';
import { ListFilterDataService } from '../services/data/list-filter.data.service';
import { Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../models/constants';
import { FormRangeModel } from '../../shared/components/form-range/form-range.model';
import { BreadcrumbItemModel } from '../../shared/components/breadcrumbs/breadcrumb-item.model';
import { QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ResetInputOnSideFilterDirective } from '../../shared/directives/reset-input-on-side-filter/reset-input-on-side-filter.directive';
import { MatSort, MatSortable } from '@angular/material';
import { SideFiltersComponent } from '../../shared/components/side-filters/side-filters.component';

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

    // The ID value of the timer
    protected refreshTimeoutID: number = null;

    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    /**
     * Models for the checkbox functionality
     * @type {boolean}
     */
    public checkboxModels = {
        checkAll: false,
        individualCheck: []
    };

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
     * Clear previous refresh request
     */
    protected clearRefreshTimeout() {
        if (this.refreshTimeoutID) {
            clearTimeout(this.refreshTimeoutID);
            this.refreshTimeoutID = null;
        }
    }

    /**
     * Tell list that we need to refresh list
     */
    protected needsRefreshList(instant: boolean = false) {
        // do we want to execute refresh instantly ?
        if (instant) {
            // stop the previous one
            this.clearRefreshTimeout();

            // refresh list
            this.refreshList();
        } else {
            // stop previous request
            this.clearRefreshTimeout();

            // wait for debounce time
            // make new request
            this.refreshTimeoutID = setTimeout(() => {
                // refresh data
                this.refreshList();

                // timeout executed - clear
                this.refreshTimeoutID = null;
            }, Constants.DEFAULT_FILTER_DEBOUNCE_TIME_MILLISECONDS);
        }
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
        operator: string = 'or'
    ) {
        if (_.isArray(property)) {
            this.queryBuilder.filter.byTextMultipleProperties(property as string[], value);
        } else {
            this.queryBuilder.filter.byText(property as string, value);
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
        this.matTableSort.sort({
            id: null
        } as MatSortable);

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

        // refresh list
        this.needsRefreshList(true);
    }

    /**
     *  Check if list filter applies
     */
    protected checkListFilters() {
        if (!_.isEmpty(this.queryParams) && !_.isEmpty(this.listFilterDataService)) {
            // get query params
            this.queryParams
                .subscribe((queryParams: any) => {
                    if (!_.isEmpty(queryParams)) {
                        // call function to apply filters - update query buiilder
                        this.applyListFilters(queryParams);
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
    protected applyListFilters(queryParams: {applyListFilter, x}): void {
        // update breadcrumbs
        this.setListFilterBreadcrumbs(queryParams.applyListFilter, queryParams);

        // check params for apply list filter
        switch (queryParams.applyListFilter) {
            // Filter contacts on the followup list
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsOnFollowUpLists()
                    .subscribe((qbFilterContactsOnFollowUpLists) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterContactsOnFollowUpLists);
                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases deceased
            case Constants.APPLY_LIST_FILTER.CASES_DECEASED:

                // add condition for deceased cases
                this.queryBuilder.filter.where({
                    deceased: true
                }, true);

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases hospitalised
            case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesHospitalized()
                    .subscribe((qbFilterCasesHospitalized) => {
                        this.queryBuilder.merge(qbFilterCasesHospitalized);
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
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterContactsNotSeen);
                        // refresh list
                        this.refreshList();
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
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterCasesLessThanContacts);
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
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterContactsLostToFollowUp);
                        // refresh list
                        this.refreshList();
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
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterCasesInKnownChains);
                        // refresh list
                        this.refreshList();
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
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(qbFilterCasesAmongKnownContacts);
                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter suspect cases with pending lab result
            case Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT:
                // get the correct query builder and merge with the existing one
                const qbFilterCasesPendingLabResult = this.listFilterDataService.filterCasesPendingLabResult();
                this.queryBuilder.merge(qbFilterCasesPendingLabResult);
                // refresh list
                this.needsRefreshList(true);
                break;

            // filter suspect cases refusing treatment
            case Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT:
                // get the correct query builder and merge with the existing one
                const qbFilterCasesRefusingTreatment = this.listFilterDataService.filterCasesRefusingTreatment();
                this.queryBuilder.merge(qbFilterCasesRefusingTreatment);
                this.needsRefreshList(true);
                break;

            // filter cases among contacts
            case Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS:
                const qbFilterActiveChainsOfTransmission = this.listFilterDataService.filterActiveChainsOfTransmission();
                this.queryBuilder.merge(qbFilterActiveChainsOfTransmission);
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
