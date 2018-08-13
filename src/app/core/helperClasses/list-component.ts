import { RequestQueryBuilder } from './request-query-builder';
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

export abstract class ListComponent {
    /**
     * Determine all children that we need to reset when side filters are being applied
     */
    @ViewChildren(ResetInputOnSideFilterDirective) protected filterInputs: QueryList<ResetInputOnSideFilterDirective>;

    /**
     * Retrieve Mat Table
     */
    @ViewChild('table', { read: MatSort }) matTableSort: MatSort;

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
        if (direction) {
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
    filterByTextField(property: string, value: string) {
        this.queryBuilder.filter.byText(property, value);

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
        const rangeValue: any = {};
        if (value.startDate) {
            rangeValue.from = value.startDate.toISOString();
        }
        if (value.endDate) {
            rangeValue.to = value.endDate.toISOString();
        }

        this.queryBuilder.filter.byRange(property, rangeValue);

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
     * Apply the filters selected from the Side Filters section
     * @param {RequestQueryBuilder} queryBuilder
     */
    applySideFilters(queryBuilder: RequestQueryBuilder) {
        // clear table filters without triggering search for all the changes
        if (this.filterInputs) {
            this.filterInputs.forEach((input: ResetInputOnSideFilterDirective) => {
                input.reset();
            });
        }

        // reset table sort columns
        this.matTableSort.sort({
            id: null
        } as MatSortable);

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
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
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
                    .subscribe((filterQueryBuilder) => {
                        this.queryBuilder.merge(filterQueryBuilder);
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
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
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
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter contacts lost to follow-up
            case Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP:

                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterContactsLostToFollowUp()
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
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
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
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
                    .subscribe((filterQueryBuilder) => {
                        // remove condition on property 'id' to not duplicate it
                        this.queryBuilder.filter.remove('id');
                        this.queryBuilder.merge(filterQueryBuilder);
                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter suspect cases with pending lab result
            case Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT:
                // get the correct query builder and merge with the existing one
                const filterQueryBuilder = this.listFilterDataService.filterCasesPendingLabResult();
                this.queryBuilder.merge(filterQueryBuilder);
                // refresh list
                this.needsRefreshList(true);
                break;

            // filter suspect cases refusing treatment
            case Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT:
                // get the correct query builder and merge with the existing one
                const filterQueryBuilderRefusingTreatment = this.listFilterDataService.filterCasesRefusingTreatment();
                this.queryBuilder.merge(filterQueryBuilderRefusingTreatment);
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
