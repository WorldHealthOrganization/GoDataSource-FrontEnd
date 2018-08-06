import { RequestQueryBuilder } from './request-query-builder';
import * as _ from 'lodash';
import { ListFilterDataService } from '../services/data/list-filter.data.service';
import { Params } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../models/constants';
import { FormRangeModel } from '../../shared/components/form-range/form-range.model';
import { BreadcrumbItemModel } from '../../shared/components/breadcrumbs/breadcrumb-item.model';

export abstract class ListComponent {

    public breadcrumbs: BreadcrumbItemModel[];

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
     * Sort asc / desc by specific fields
     * @param data
     */
    public sortBy(data) {
        const property = _.get(data, 'active');
        const direction = _.get(data, 'direction');

        if (direction) {
            // apply sort
            this.queryBuilder.sort.by(property, direction);
        } else {
            // remove sort
            this.queryBuilder.sort.remove(property);
        }

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByTextField(property: string, value: string) {
        this.queryBuilder.filter.byText(property, value);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a text field
     * @param {string} property
     * @param {string} value
     */
    filterByBooleanField(property: string, value: boolean | null | undefined) {
        this.queryBuilder.filter.byBoolean(property, value);

        // refresh list
        this.refreshList();
    }

    /**
     * Filter the list by a range field ('from' / 'to')
     * @param {string} property
     * @param {FormRangeModel} value Object with 'from' and 'to' properties
     */
    filterByRangeField(property: string, value: FormRangeModel) {
        this.queryBuilder.filter.byRange(property, value);

        // refresh list
        this.refreshList();
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
        this.refreshList();
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
        this.refreshList();
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
        this.refreshList();
    }

    /**
     * Apply the filters selected from the Side Filters section
     * @param {RequestQueryBuilder} queryBuilder
     */
    applySideFilters(queryBuilder: RequestQueryBuilder) {
        this.queryBuilder = queryBuilder;

        // refresh list
        this.refreshList();
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
                    this.refreshList();

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
                        this.refreshList();
                    });
                break;

            // filter cases deceased
            case Constants.APPLY_LIST_FILTER.CASES_DECEASED:

                // add condition for deceased cases
                this.queryBuilder.filter.where({
                    deceased: true
                }, true);

                // refresh list
                this.refreshList();
                break;

            // filter cases hospitalised
            case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
                // get the correct query builder and merge with the existing one
                this.listFilterDataService.filterCasesHospitalized()
                    .subscribe((filterQueryBuilder) => {
                        this.queryBuilder.merge(filterQueryBuilder);
                        // refresh list
                        this.refreshList();
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
                        this.refreshList();
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
