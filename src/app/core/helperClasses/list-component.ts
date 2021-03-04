import { ISerializedQueryBuilder, RequestFilter, RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from './request-query-builder';
import * as _ from 'lodash';
import { Subscriber } from 'rxjs';
import { ApplyListFilter, Constants } from '../models/constants';
import { FormRangeModel } from '../../shared/components/form-range/form-range.model';
import { BreadcrumbItemModel } from '../../shared/components/breadcrumbs/breadcrumb-item.model';
import { OnDestroy, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ResetInputOnSideFilterDirective, ResetLocationOnSideFilterDirective } from '../../shared/directives/reset-input-on-side-filter/reset-input-on-side-filter.directive';
import { MatPaginator, MatSort, MatSortable, MatSortHeader, PageEvent } from '@angular/material';
import { SideFiltersComponent } from '../../shared/components/side-filters/side-filters.component';
import { DebounceTimeCaller } from './debounce-time-caller';
import { MetricContactsSeenEachDays } from '../models/metrics/metric-contacts-seen-each-days.model';
import { FormCheckboxComponent } from '../../shared/xt-forms/components/form-checkbox/form-checkbox.component';
import { ContactFollowedUp, MetricContactsWithSuccessfulFollowUp } from '../models/metrics/metric.contacts-with-success-follow-up.model';
import { VisibleColumnModel } from '../../shared/components/side-columns/model';
import { AddressType } from '../models/address.model';
import { moment, Moment } from './x-moment';
import { ListHelperService } from '../services/helper/list-helper.service';
import { SubscriptionLike } from 'rxjs/internal/types';
import { StorageKey } from '../services/helper/storage.service';
import { UserModel } from '../models/user.model';
import { ValueAccessorBase } from '../../shared/xt-forms/core';
import { SavedFilterData } from '../models/saved-filters.model';

/**
 * Used by caching filter
 */
interface ICachedSortItem {
    active: string;
    direction: RequestSortDirection;
}

/**
 * Used by caching filter
 */
interface ICachedFilterItems {
    // keep the actual query executed to bring data
    queryBuilder: ISerializedQueryBuilder;

    // keep filters information
    inputs: {
        [inputName: string]: any
    };

    // keep sort information
    sort: ICachedSortItem;

    // side filters
    sideFilters: SavedFilterData;
}

/**
 * Used by caching filter
 */
interface ICachedFilter {
    [filterKey: string]: ICachedFilterItems;
}

/**
 * Used by caching filter
 */
interface ICachedInputsValues {
    [inputName: string]: any;
}

export abstract class ListComponent implements OnDestroy {
    // handle pop state changes
    private static locationSubscription: SubscriptionLike;

    /**
     * Breadcrumbs
     */
    public breadcrumbs: BreadcrumbItemModel[];

    /**
     * Determine all children that we need to reset when side filters are being applied
     */
    @ViewChildren(ResetInputOnSideFilterDirective) protected filterInputs: QueryList<ResetInputOnSideFilterDirective>;

    /**
     * Determine all location children that we need to reset when side filters are being applied
     */
    @ViewChildren(ResetLocationOnSideFilterDirective) protected filterLocationInputs: QueryList<ResetLocationOnSideFilterDirective>;

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
    @ViewChildren('listCheckedIndividual') protected listCheckedIndividualInputs: QueryList<FormCheckboxComponent>;

    /**
     * List table columns
     */
    tableColumns: VisibleColumnModel[] = [];

    /**
     * List table visible columns
     */
    visibleTableColumns: string[] = [];

    /**
     * List of cells to be expanded for row/column
     *  Example:
     *      {
     *          columnName: {
     *              rowId1: true,
     *              rowId2: false,
     *              rowId3: true
     *          }
     *      }
     */
    expandCell: {
        string?: {
            string?: boolean
        }[]
    } = {};

    /**
     * Expand all cells for a certain column
     *  Example:
     *      {
     *          columnName1: true,
     *          columnName2: false
     *      }
     */
    expandAllCellsForColumn: {string?: boolean} = {};

    /**
     * Query builder
     * @type {RequestQueryBuilder}
     */
    public queryBuilder: RequestQueryBuilder = new RequestQueryBuilder(() => {
        this.updateCachedFilters();
    });

    /**
     * Applied list filter on this list page
     */
    public appliedListFilter: ApplyListFilter;

    /**
     * Preparing loading filter ?
     */
    public appliedListFilterLoading: boolean = false;

    /**
     * List Filter Query Builder
     */
    protected appliedListFilterQueryBuilder: RequestQueryBuilder;

    // pagination
    public pageSize: number = Constants.DEFAULT_PAGE_SIZE;
    public pageSizeOptions: number[] = Constants.PAGE_SIZE_OPTIONS;
    private paginatorInitialized = false;

    // flag set to true if the list is empty
    public isEmptyList: boolean;

    // starting page
    public pageIndex: number = 0;

    // Models for the checkbox functionality
    private checkboxModels: {
        multiCheck: boolean,
        keyPath: string,
        records: any[],
        checkAll: boolean,
        checkedOnlyDeletedRecords: boolean,
        checkedOnlyNotDeletedRecords: boolean,
        checkedRecords: {
            [id: string]: boolean
        }
    } = {
        multiCheck: true,
        keyPath: null,
        records: [],
        checkAll: false,
        checkedOnlyDeletedRecords: false,
        checkedOnlyNotDeletedRecords: false,
        checkedRecords: {}
    };

    // sort by disabled ?
    private _sortByDisabled: boolean = false;

    /**
     * Did we check at least one record ?
     */
    get checkedAtLeastOneRecord(): boolean {
        return !_.isEmpty(this.checkboxModels.checkedRecords);
    }

    /**
     * Checked only deleted records ?
     */
    get checkedOnlyDeletedRecords(): boolean {
        return this.checkboxModels.checkedOnlyDeletedRecords;
    }

    /**
     * Checked only not deleted records ?
     */
    get checkedOnlyNotDeletedRecords(): boolean {
        return this.checkboxModels.checkedOnlyNotDeletedRecords;
    }

    /**
     * Set checkbox behaviour ( key path - id used to identify a record )
     */
    set checkedKeyPath(keyPath: string) {
        this.checkboxModels.keyPath = keyPath;
    }

    /**
     * Get checkbox behaviour ( key path - id used to identify a record )
     */
    get checkedKeyPath(): string {
        return this.checkboxModels.keyPath;
    }

    /**
     * Set checkbox behaviour ( can or can't select multiple checkboxes at the same time )
     */
    set checkedIsMultiSelect(multiCheck: boolean) {
        this.checkboxModels.multiCheck = multiCheck;
    }

    /**
     * Get checkbox behaviour ( can or can't select multiple checkboxes at the same time )
     */
    get checkedIsMultiSelect(): boolean {
        return this.checkboxModels.multiCheck;
    }

    /**
     * All checkbox selected
     * @param value
     */
    set checkedAllRecords(value: boolean) {
        // set master check all
        this.checkboxModels.checkAll = value;

        // check/un-check all individual checkboxes
        this.checkboxModels.checkedOnlyNotDeletedRecords = this.checkboxModels.checkAll;
        this.checkboxModels.checkedOnlyDeletedRecords = this.checkboxModels.checkAll;
        this.checkboxModels.checkedRecords = {};
        if (this.checkboxModels.checkAll) {
            this.checkboxModels.records.forEach((record: any) => {
                // check record
                this.checkboxModels.checkedRecords[this.getCheckRecordKey(record)] = true;

                // all records are deleted ?
                if (!record.deleted) {
                    this.checkboxModels.checkedOnlyDeletedRecords = false;
                }

                // all records aren't deleted ?
                if (record.deleted) {
                    this.checkboxModels.checkedOnlyNotDeletedRecords = false;
                }
            });
        }

        // go through all html checkboxes and update their value - this is faster than using binding which slows down a lot the page
        if (
            this.listCheckedIndividualInputs &&
            this.listCheckedIndividualInputs.length > 0
        ) {
            this.listCheckedIndividualInputs.forEach((checkbox: FormCheckboxComponent) => {
                // retrieve id
                const id = checkbox.name.substring(checkbox.name.lastIndexOf('[') + 1, checkbox.name.lastIndexOf(']'));
                checkbox.value = !!this.checkboxModels.checkedRecords[id];
            });
        }
    }

    get checkedAllRecords(): boolean {
        return this.checkboxModels.checkAll;
    }

    // refresh only after we finish changing data
    // by default each time we get back to a page we should display loading spinner
    public refreshingList: boolean = true;
    private triggerListRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
        // disabled ?
        if (this.appliedListFilterLoading) {
            return;
        }

        // refresh list
        this.refreshingList = true;
        this.refreshList((records: any[]) => {
            // wait for binding
            setTimeout(() => {
                // reset checked items
                this.resetCheckboxData();

                // set items that can be checked
                this.checkboxModels.records = records || [];

                // finished refreshing list
                this.refreshingList = false;
            });
        });
    }));

    // refresh only after we finish changing data
    private triggerListCountRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
        // disabled ?
        if (this.appliedListFilterLoading) {
            return;
        }

        // refresh list
        this.refreshListCount();
    }));

    /**
     * Constructor
     */
    protected constructor(
        protected listHelperService: ListHelperService
    ) {
        // clone current breadcrumbs
        let currentBreadcrumbs;
        setTimeout(() => {
            currentBreadcrumbs = _.cloneDeep(this.breadcrumbs);
        });

        // check filters
        this.checkListFilters();

        // load saved filters
        this.loadCachedFilters();

        // remove old subscription since we shouldn't have more than one list component visible at the same time ( at least not now )
        if (ListComponent.locationSubscription) {
            ListComponent.locationSubscription.unsubscribe();
            ListComponent.locationSubscription = null;
        }

        // listen for back / forward buttons
        ListComponent.locationSubscription = this.listHelperService.location
            .subscribe((popStateEvent) => {
                setTimeout(() => {
                    // check if subscription was closed
                    if (
                        !ListComponent.locationSubscription ||
                        ListComponent.locationSubscription.closed
                    ) {
                        return;
                    }

                    // reset loading
                    this.refreshingList = true;

                    // clear all filters
                    this.queryBuilder = new RequestQueryBuilder(() => {
                        this.updateCachedFilters();
                    });

                    // init paginator ?
                    if (this.paginatorInitialized) {
                        this.initPaginator();
                    }

                    // revert breadcrumbs
                    this.breadcrumbs = _.cloneDeep(currentBreadcrumbs);

                    // refresh filters
                    this.checkListFilters();

                    // refresh page
                    this.needsRefreshList(true);
                });
            });
    }

    /**
     * Release resources
     */
    ngOnDestroy(): void {
        this.releaseSubscribers();
    }

    /**
     * Refresh list
     */
    public abstract refreshList(finishCallback: (records: any[]) => void);

    /**
     * Refresh items count
     * Note: To be overridden on pages that implement pagination
     */
    public refreshListCount() {
        console.error('Component must implement \'refreshListCount\' method');
    }

    /**
     * Release subscribers
     */
    private releaseSubscribers() {
        // query builder
        this.queryBuilder.destroyListeners();

        // location subscriber
        if (ListComponent.locationSubscription) {
            ListComponent.locationSubscription.unsubscribe();
            ListComponent.locationSubscription = null;
        }

        if (this.triggerListRefresh) {
            this.triggerListRefresh.unsubscribe();
            this.triggerListRefresh = null;
        }
        if (this.triggerListCountRefresh) {
            this.triggerListCountRefresh.unsubscribe();
            this.triggerListCountRefresh = null;
        }
    }

    /**
     * Reset checkbox data
     */
    private resetCheckboxData() {
        this.checkboxModels.records = [];
        this.checkboxModels.checkAll = false;
        this.checkboxModels.checkedOnlyDeletedRecords = false;
        this.checkboxModels.checkedOnlyNotDeletedRecords = false;
        this.checkboxModels.checkedRecords = {};
    }

    /**
     * Retrieve record key used by list component checkboxes
     */
    private getCheckRecordKey(record: any): string {
        return this.checkedKeyPath ?
            _.get(record, this.checkedKeyPath) :
            record.id;
    }

    /**
     * Tell list that we need to refresh list
     */
    public needsRefreshList(
        instant: boolean = false,
        resetPagination: boolean = true
    ) {
        // reset checked items
        this.resetCheckboxData();

        // do we need to reset pagination (aka go to the first page) ?
        if (
            resetPagination &&
            this.paginatorInitialized
        ) {
            // re-calculate items count (filters have changed)
            this.triggerListCountRefresh.call(instant);

            // move to the first page (if not already there)
            if (
                this.paginator &&
                this.paginator.hasPreviousPage()
            ) {
                this.paginator.firstPage();
                // no need to refresh the list here, because our 'changePage' hook will trigger that again
                return;
            }
        }

        // refresh list
        this.triggerListRefresh.call(instant);
    }

    /**
     * Checks if list is empty
     */
    checkEmptyList(list: any[]) {
        this.isEmptyList = _.isEmpty(list);
    }

    /**
     * Sort asc / desc by specific fields
     * @param data
     * @param objectDetailsSort
     */
    public sortBy(
        data: any,
        objectDetailsSort?: {
            [property: string]: string[]
        }
    ) {
        // sort by disabled ?
        if (this._sortByDisabled) {
            return;
        }

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
        this.needsRefreshList(
            false,
            false
        );
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
        operator?: RequestFilterOperator,
        useLike?: boolean
    ) {
        // default values
        if (operator === undefined) {
            operator = RequestFilterOperator.OR;
        }

        // filter
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
                value,
                true,
                useLike
            );
        }

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter by phone number
     * @param {string} property
     * @param {string} value
     * @param {string} regexMethod
     */
    filterByPhoneNumber(
        property: string,
        value: string,
        regexMethod: string = 'regex'
    ) {
        this.queryBuilder.filter.byPhoneNumber(
            property as string,
            value,
            true,
            regexMethod
        );

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter the list by equality
     * @param {string} property
     * @param {*} value
     */
    filterByEquality(
        property: string | string[],
        value: any
    ) {
        this.queryBuilder.filter.byEquality(
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
     * @param {boolean} useLike
     */
    filterByTextContainingField(
        property: string,
        value: string,
        useLike?: boolean
    ) {
        this.queryBuilder.filter.byContainingText(
            property as string,
            value,
            true,
            useLike
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
     * @param {boolean} replace
     */
    filterBySelectField(property: string, values: any | any[], valueKey: string = 'value', replace: boolean = true) {
        // no value ?
        if (values === false) {
            this.queryBuilder.filter.byBoolean(
                property,
                false,
                true
            );
        } else {
            this.queryBuilder.filter.bySelect(property, values, replace, valueKey);
        }

        // refresh list
        this.needsRefreshList();
    }

    /**
     * Filter by boolean with exists condition
     * @param {string} property
     * @param value
     */
    filterByBooleanUsingExistField(property: string, value: any) {
        // filter by boolean using exist
        this.queryBuilder.filter.byBooleanUsingExist(property, value);

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
     * Filter by child query builder
     * @param {string} qbFilterKey
     * @returns {RequestFilter}
     */
    filterByChildQueryBuilder(
        qbFilterKey: string
    ): RequestFilter {
        const childQueryBuilder = this.queryBuilder.addChildQueryBuilder(qbFilterKey);

        // refresh list
        this.needsRefreshList();

        return childQueryBuilder.filter;
    }

    /**
     * Reset paginator
     */
    protected resetPaginator(): void {
        // initialize query paginator
        this.queryBuilder.paginator.setPage({
            pageSize: this.pageSize,
            pageIndex: 0
        });

        // update page index
        this.updatePageIndex();
    }

    /**
     * Initialize paginator
     */
    protected initPaginator(): void {
        // initialize query paginator
        this.queryBuilder.paginator.setPage({
            pageSize: this.pageSize,
            pageIndex: this.pageIndex
        });

        // remember that paginator was initialized
        this.paginatorInitialized = true;
    }

    /**
     * Change page
     */
    changePage(page: PageEvent) {
        // update API pagination params
        this.queryBuilder.paginator.setPage(page);

        // update page index
        this.updatePageIndex();

        // refresh list
        this.needsRefreshList(
            true,
            false
        );
    }

    /**
     * Called after query builder is cleared
     */
    clearedQueryBuilder() {
        // NOTHING
    }

    /**
     * Clear query builder of conditions and sorting criterias
     */
    clearQueryBuilder() {
        // clear query filters
        this.queryBuilder.clear();

        // cleared query builder
        this.clearedQueryBuilder();
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

        // clear location header filters
        if (this.filterLocationInputs) {
            this.filterLocationInputs.forEach((input: ResetLocationOnSideFilterDirective) => {
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

        // reset paginator
        this.resetPaginator();

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
        // finished with list filter
        this.appliedListFilterLoading = false;

        // merge filter query builder
        if (this.appliedListFilterQueryBuilder) {
            this.queryBuilder.merge(_.cloneDeep(this.appliedListFilterQueryBuilder));
        }
    }

    /**
     * Check if list filter applies
     */
    protected checkListFilters() {
        // retrieve query params
        const queryParams: any = this.listHelperService.route.snapshot.queryParams;

        // reset values
        this.appliedListFilter = queryParams && queryParams.applyListFilter ? queryParams.applyListFilter : null;
        this.appliedListFilterQueryBuilder = null;

        // do we need to wait for list filter to be initialized ?
        this.appliedListFilterLoading = !_.isEmpty(this.appliedListFilter);

        // wait for component initialization, since this method is called from constructor
        setTimeout(() => {
            // do we have query params to apply ?
            if (_.isEmpty(queryParams)) {
                return;
            }

            // call function to apply filters - update query builder
            this.applyListFilters(queryParams);
        });
    }

    /**
     * Update page breadcrumbs based on the applied filter
     * @param {string} listFilter
     * @param listFilterData
     */
    protected setListFilterBreadcrumbs(
        listFilter: string,
        listFilterData: any = {}
    ) {
        const breadcrumbToken = Constants.LIST_FILTER_TITLE[listFilter];
        if (breadcrumbToken) {
            // get the breadcrumb representing the list page
            const listPageBreadcrumb: BreadcrumbItemModel = _.find(this.breadcrumbs, {active: true});
            if (listPageBreadcrumb) {
                // update the breadcrumb
                const fallbackUrl: string[] | boolean = this.listHelperService.determineFallbackUrl();
                listPageBreadcrumb.active = false;
                listPageBreadcrumb.onClick = () => {
                    // redirect to cases list pages ( hack since we can't use navigate for the same component )
                    if (fallbackUrl) {
                        this.listHelperService.redirectService.to(fallbackUrl as string[]);
                    } else {
                        // DON'T REDIRECT
                    }
                };
            }

            // add new breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    breadcrumbToken,
                    '.',
                    true,
                    {},
                    listFilterData
                )
            );
        }
    }

    /**
     * Verify what list filter is sent into the query params and updates the query builder based in this.
     * @param queryParams
     */
    protected applyListFilters(
        queryParams: {
            applyListFilter,
            x,
            date,
            global
        }
    ): void {
        // there are no filters to apply ?
        if (!this.appliedListFilter) {
            return;
        }

        // update breadcrumbs
        this.setListFilterBreadcrumbs(
            this.appliedListFilter,
            queryParams
        );

        // get global filter values
        const globalFilters = this.getGlobalFilterValues(queryParams);
        let globalQb: RequestQueryBuilder;

        // check params for apply list filter
        switch (this.appliedListFilter) {
            // Filter contacts on the followup list
            case Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST:

                // get the correct query builder and merge with the existing one
                this.listHelperService.listFilterDataService
                    .filterContactsOnFollowUpLists(
                        globalFilters.date,
                        globalFilters.locationId,
                        globalFilters.classificationId
                    )
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
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // condition already include by default on cases list page
                // qb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // date
                if (globalFilters.date) {
                    this.appliedListFilterQueryBuilder.filter.byDateRange(
                        'dateOfOutcome', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // deceased
                this.appliedListFilterQueryBuilder.filter.where({
                    outcomeId: Constants.OUTCOME_STATUS.DECEASED
                }, true);

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases isolated
            case Constants.APPLY_LIST_FILTER.CASES_ISOLATED:
                // add condition for deceased cases
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // condition already include by default on cases list page
                // qb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesIsolated(globalFilters.date);
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases hospitalised
            case Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED:
                // add condition for deceased cases
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // condition already include by default on cases list page
                // qb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesHospitalized(globalFilters.date);
                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            case Constants.APPLY_LIST_FILTER.CASES_NOT_HOSPITALISED:
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // condition already include by default on cases list page
                // qb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesNotHospitalized(globalFilters.date);
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
                this.listHelperService.listFilterDataService
                    .filterContactsNotSeen(
                        globalFilters.date,
                        globalFilters.locationId,
                        globalFilters.classificationId,
                        noDaysNotSeen
                    )
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
                this.listHelperService.listFilterDataService
                    .filterCasesLessThanContacts(
                        globalFilters.date,
                        globalFilters.locationId,
                        globalFilters.classificationId,
                        noLessContacts
                    )
                    .subscribe((qbFilterCasesLessThanContacts) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterCasesLessThanContacts;
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // filter cases by classification criteria
            case Constants.APPLY_LIST_FILTER.CASE_SUMMARY:
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId
                );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                const classificationCriteria = _.get(queryParams, 'x', null);
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    // add and condition because otherwise classification filter if overwritten by the default one
                    and: [{
                        classification: {
                            'eq': classificationCriteria
                        }
                    }]
                }, true);

                if (!globalQb.isEmpty()) {
                    this.appliedListFilterQueryBuilder.merge(globalQb);
                }

                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

            case Constants.APPLY_LIST_FILTER.CASES_BY_LOCATION:
                // add condition for deceased cases
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();

                // construct query builder to filter by location
                const locationId = _.get(queryParams, 'locationId', null);
                this.appliedListFilterQueryBuilder.filter.where({
                    addresses: {
                        elemMatch: {
                            typeId: AddressType.CURRENT_ADDRESS,
                            parentLocationIdFilter: {
                                // fix for not beeing consistent through the website, sometimes we use elemMatch other times $elemMatch which causes some issues on the api
                                // if we want to fix this we need to change in many places, so this is an workaround
                                $in: [locationId]
                            }
                        }
                    }
                });

                // date
                if (globalFilters.date) {
                    this.appliedListFilterQueryBuilder.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // condition already include by default on cases list page
                // qb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // classification
                if (!_.isEmpty(globalFilters.classificationId)) {
                    this.appliedListFilterQueryBuilder.filter.where({
                        and: [{
                            classification: {
                                inq: globalFilters.classificationId
                            }
                        }]
                    });
                }

                // main filters
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter contacts lost to follow-up
            case Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP:
                // get the correct query builder and merge with the existing one
                this.listHelperService.listFilterDataService.filterContactsLostToFollowUp(
                    globalFilters.date,
                    globalFilters.locationId,
                    globalFilters.classificationId
                )
                    .subscribe((qbFilterContactsLostToFollowUp) => {
                        // merge query builder
                        this.appliedListFilterQueryBuilder = qbFilterContactsLostToFollowUp;
                        this.mergeListFilterToMainFilter();

                        // refresh list
                        this.needsRefreshList(true);
                    });
                break;

            // Filter cases in known transmission chains
            case Constants.APPLY_LIST_FILTER.CASES_IN_THE_TRANSMISSION_CHAINS:
                // get the number of days if it was updated
                const noDaysInChains = _.get(queryParams, 'x', null);
                // get the correct query builder and merge with the existing one
                this.listHelperService.listFilterDataService.filterCasesInKnownChains(
                    globalFilters.date,
                    globalFilters.locationId,
                    globalFilters.classificationId,
                    noDaysInChains
                )
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
                this.listHelperService.listFilterDataService.filterCasesAmongKnownContacts(
                    globalFilters.date,
                    globalFilters.locationId,
                    globalFilters.classificationId,
                    noDaysAmongContacts
                )
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
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // condition already include by default on cases list page
                // globalQb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesPendingLabResult();
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
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // condition already include by default on cases list page
                // globalQb.filter.bySelect(
                //     'classification',
                //     this.globalFilterClassificationId,
                //     false,
                //     null
                // );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesRefusingTreatment();
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
                // get the correct query builder and merge with the existing one
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterActiveChainsOfTransmission();

                // change the way we build query
                this.appliedListFilterQueryBuilder.filter.firstLevelConditions();

                // date
                if (globalFilters.date) {
                    this.appliedListFilterQueryBuilder.filter.byDateRange(
                        'contactDate', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // location
                if (globalFilters.locationId) {
                    this.appliedListFilterQueryBuilder.addChildQueryBuilder('person').filter.where({
                        or: [
                            {
                                type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_EVENT',
                                'address.parentLocationIdFilter': globalFilters.locationId
                            }, {
                                type: {
                                    inq: [
                                        'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                        'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CONTACT'
                                    ]
                                },
                                'addresses.parentLocationIdFilter': globalFilters.locationId
                            }
                        ]
                    });
                }

                // classification
                if (!_.isEmpty(globalFilters.classificationId)) {
                    // define classification conditions
                    const classificationConditions = {
                        or: [
                            {
                                type: {
                                    neq: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE'
                                }
                            }, {
                                type: 'LNG_REFERENCE_DATA_CATEGORY_PERSON_TYPE_CASE',
                                classification: {
                                    inq: globalFilters.classificationId
                                }
                            }
                        ]
                    };

                    // top level classification
                    this.appliedListFilterQueryBuilder.filter.where(classificationConditions);

                    // person
                    this.appliedListFilterQueryBuilder.addChildQueryBuilder('person').filter.where(classificationConditions);
                }

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter contacts becoming cases overtime and place
            case Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES:
                // add condition for deceased cases
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // date
                if (globalFilters.date) {
                    this.appliedListFilterQueryBuilder.filter.byDateRange(
                        'dateBecomeCase', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // do we need to include default condition ?
                if (!this.appliedListFilterQueryBuilder.filter.has('dateBecomeCase')) {
                    // any date
                    this.appliedListFilterQueryBuilder.filter.where({
                        'dateBecomeCase': {
                            neq: null
                        }
                    });
                }

                // exclude discarded cases
                this.appliedListFilterQueryBuilder.filter.where({
                    classification: {
                        neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                    }
                });

                // include was contact cases
                this.appliedListFilterQueryBuilder.filter.byBoolean(
                    'wasContact',
                    true
                );

                // merge query builder
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // refresh list on query params changes ( example browser back button was pressed )
            case Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES:
                // no extra filter
                this.appliedListFilterQueryBuilder = null;
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter cases without relationships
            case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS:
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesWithoutRelationships();
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // filter events without relationships
            case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS:
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterEventsWithoutRelationships();
                this.mergeListFilterToMainFilter();

                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter contacts seen
            case Constants.APPLY_LIST_FILTER.CONTACTS_SEEN:
                this.listHelperService.listFilterDataService.filterContactsSeen(
                    globalFilters.date,
                    globalFilters.locationId,
                    globalFilters.classificationId
                )
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
                this.listHelperService.listFilterDataService
                    .filterContactsWithSuccessfulFollowup(
                        globalFilters.date,
                        globalFilters.locationId,
                        globalFilters.classificationId
                    )
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

            // Filter cases without date of last contact
            case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN:
                // get the case ids that need to be updated
                const caseLCIds = _.get(queryParams, 'caseIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': caseLCIds
                    }
                }, true);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

             // Filter cases without date of reporting
            case Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_REPORTING_CHAIN:
                // get the case ids that need to be updated
                const caseDRIds = _.get(queryParams, 'caseIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': caseDRIds
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

            // Filter contacts without date of last contact.
            case Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN:
                // get the contact ids that need to be updated
                const contactDRIds = _.get(queryParams, 'contactIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': contactDRIds
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

            // Filter events without date
            case Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN:
                // get the event ids that need to be updated
                const eventDRIds = _.get(queryParams, 'eventIds', null);
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': eventDRIds
                    }
                }, true);
                this.mergeListFilterToMainFilter();
                // refresh list
                this.needsRefreshList(true);
                break;

            // Filter cases who are not identified though known contact list
            case Constants.APPLY_LIST_FILTER.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS:
                // add condition for deceased cases
                globalQb = this.listHelperService.listFilterDataService.getGlobalFilterQB(
                    null,
                    null,
                    'addresses.parentLocationIdFilter',
                    globalFilters.locationId,
                    globalFilters.classificationId
                );

                // date
                if (globalFilters.date) {
                    globalQb.filter.byDateRange(
                        'dateOfReporting', {
                            endDate: globalFilters.date.endOf('day').format()
                        }
                    );
                }

                // get the correct query builder and merge with the existing one
                // includes
                // classification: {
                //     neq: Constants.CASE_CLASSIFICATION.NOT_A_CASE
                // }
                this.appliedListFilterQueryBuilder = this.listHelperService.listFilterDataService.filterCasesNotIdentifiedThroughContacts();
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
                const itemsIds: string[] = (_.isArray(helpItemsIds) ?
                        helpItemsIds :
                        [helpItemsIds]
                ) as string[];
                // get the correct query builder and merge with the existing one
                // merge query builder
                this.appliedListFilterQueryBuilder = new RequestQueryBuilder();
                this.appliedListFilterQueryBuilder.filter.where({
                    id: {
                        'inq': itemsIds
                    }
                }, true);
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
            locationId?: string,
            classificationId?: string[]
        }
    }): {
        date?: Moment,
        locationId?: string,
        classificationId?: string[]
    } {
        // do we need to decode global filters ?
        const global: {
            date?: Moment,
            locationId?: string,
            classificationId?: string[]
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
    checkedRecord(item: any, checked: boolean) {
        // set value
        const id: string = this.getCheckRecordKey(item);
        if (checked) {
            this.checkboxModels.checkedRecords[id] = true;
        } else {
            delete this.checkboxModels.checkedRecords[id];
        }

        // reset check all
        let checkedAll: boolean = true;
        this.checkboxModels.checkedOnlyDeletedRecords = true;
        this.checkboxModels.checkedOnlyNotDeletedRecords = true;
        this.checkboxModels.records.forEach((record: any) => {
            // uncheck checked all ?
            const idRecord: string = this.getCheckRecordKey(record);
            if (!this.checkboxModels.checkedRecords[idRecord]) {
                checkedAll = false;
            }

            // check only checked records
            if (this.checkboxModels.checkedRecords[idRecord]) {
                // all records are deleted ?
                if (!record.deleted) {
                    this.checkboxModels.checkedOnlyDeletedRecords = false;
                }

                // all records aren't deleted ?
                if (record.deleted) {
                    this.checkboxModels.checkedOnlyNotDeletedRecords = false;
                }

                // single select? - uncheck others
                if (
                    !this.checkedIsMultiSelect &&
                    idRecord !== id
                ) {
                    // update the view
                    delete this.checkboxModels.checkedRecords[idRecord];
                    this.listCheckedIndividualInputs.forEach((checkbox: FormCheckboxComponent) => {
                        if (checkbox.name === 'listCheckedIndividual[' + idRecord + ']') {
                            checkbox.value = false;
                        }
                    });
                }
            }
        });

        // set check all value
        this.checkboxModels.checkAll = checkedAll;
    }

    /**
     * Retrieve list of checked records ( an array of IDs )
     */
    get checkedRecords(): string[] {
        return Object.keys(this.checkboxModels.checkedRecords || {});
    }

    /**
     * Check that we have at least one record selected
     */
    validateCheckedRecords() {
        // get list of ids
        const selectedRecords: string[] = this.checkedRecords;

        // validate
        if (selectedRecords.length < 1) {
            // display message
            if (this.listHelperService.snackbarService) {
                this.listHelperService.snackbarService.showError('LNG_COMMON_LABEL_NO_RECORDS_SELECTED');
            }

            // not valid
            return false;
        }

        // valid, send list of IDs back
        return selectedRecords;
    }

    public checkAllRecords() {
        this.checkedAllRecords = true;
    }

    public uncheckAllRecords() {
        this.checkedAllRecords = false;
    }

    /**
     * Visible columns
     * @param visibleColumns
     */
    applySideColumnsChanged(visibleColumns: string[]) {
        // apply side columns
        this.visibleTableColumns = visibleColumns;

        // disabled saved filters for current user ?
        const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
        if (authUser.dontCacheFilters) {
            return;
        }

        // reload data into columns from cached filters
        // load saved filters
        const currentUserCache: ICachedFilter = this.getCachedFilters(true);
        const currentUserCacheForCurrentPath: ICachedFilterItems = currentUserCache[this.getCachedFilterPageKey()];
        if (currentUserCacheForCurrentPath) {
            // load saved input values
            this.loadCachedInputValues(currentUserCacheForCurrentPath);
        }
    }

    /**
     * Check if a row's cell is expanded
     * @param columnName
     * @param rowId
     */
    public isCellExpanded(columnName: string, rowId: string): boolean {
        // is the whole column marked to be expanded?
        const columnExpanded = _.get(this.expandAllCellsForColumn, columnName);
        // is cell marked to be expanded/collapsed?
        const cellExpanded = _.get(this.expandCell, `${columnName}.${rowId}`);

        // note that individual cell configuration overrides generic configuration
        // e.g. if columnExpanded = true, but cellExpanded = false, then the cell is NOT expanded
        return (
            // expand the cell if it is marked individually
            cellExpanded === true ||
            // expand the cell if column is expanded and cell is NOT collapsed individually
            (columnExpanded === true) && (cellExpanded !== false)
        );
    }

    /**
     * Expand/Collapse a cell individually
     * @param columnName
     * @param rowId
     * @param expand Expand or Collapse the cell?
     */
    public toggleCell(columnName: string, rowId: string, expand: boolean) {
        _.set(this.expandCell, `${columnName}.${rowId}`, expand);
    }

    /**
     * Expand/Collapse all cells of a certain column
     * @param columnName
     * @param expand Expand or Collapse the cells?
     */
    public toggleColumn(columnName: string, expand: boolean) {
        // remove individual cells configurations
        delete this.expandCell[columnName];

        // set column configuration
        this.expandAllCellsForColumn[columnName] = expand;
    }

    /**
     * Retrieve cached filters
     */
    private getCachedFilters(forLoadingFilters: boolean): ICachedFilter {
        // user information
        const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();

        // retrieve filters if there are any initialized
        const cachedFilters: string = this.listHelperService.storageService.get(StorageKey.FILTERS);
        let filters: {
            [userId: string]: any
        } = {};
        if (cachedFilters) {
            filters = JSON.parse(cachedFilters);
        }

        // we need to have data for this user, otherwise remove what we have
        let currentUserCache: ICachedFilter = filters[authUser.id];
        if (!currentUserCache) {
            currentUserCache = {};
        }

        // check if we have something in url, which has priority against storage
        if (
            this.listHelperService.route.snapshot.queryParams &&
            this.listHelperService.route.snapshot.queryParams.cachedListFilters
        ) {
            try {
                // retrieve data
                const cachedListFilters: ICachedFilterItems = JSON.parse(this.listHelperService.route.snapshot.queryParams.cachedListFilters);

                // validate cached url filter
                if (
                    cachedListFilters.sideFilters === undefined ||
                    cachedListFilters.sort === undefined ||
                    cachedListFilters.inputs === undefined ||
                    cachedListFilters.queryBuilder === undefined
                ) {
                    // display only if we're loading data, for save it doesn't matter since we will overwrite it
                    if (forLoadingFilters) {
                        setTimeout(() => {
                            this.listHelperService.snackbarService.showError('LNG_COMMON_LABEL__INVALID_URL_FILTERS');
                        });
                    }
                } else {
                    // apply filter
                    currentUserCache[this.getCachedFilterPageKey()] = cachedListFilters;
                }
            } catch (e) {}
        }

        // finished
        return currentUserCache;
    }

    /**
     * Retrieve filter key for current page
     */
    private getCachedFilterPageKey(): string {
        // get path
        let filterKey: string = this.listHelperService.location.path();
        const pathParamsIndex: number = filterKey.indexOf('?');
        if (pathParamsIndex > -1) {
            filterKey = filterKey.substr(0, pathParamsIndex);
        }

        // if apply list filter then we need to make sure we add it to our key so we don't break other pages by adding filters that we shouldn't
        if (this.appliedListFilter) {
            filterKey += `_${this.appliedListFilter}`;
        }

        // finished
        return filterKey;
    }

    /**
     * Retrieve input values
     */
    private getInputsValuesForCache(): ICachedInputsValues {
        // initialize
        const inputValues: ICachedInputsValues = {};

        // determine filter input values
        // keeping in mind that all filters should have ResetInputOnSideFilterDirective directives
        (this.filterInputs || []).forEach((input: ResetInputOnSideFilterDirective) => {
            inputValues[input.control.name] = input.control && input.control.valueAccessor instanceof ValueAccessorBase ?
                (input.control.valueAccessor as ValueAccessorBase<any>).value :
                input.control.value;
        });

        // determine location input values
        // keeping in mind that all filters should have ResetLocationOnSideFilterDirective directives
        (this.filterLocationInputs || []).forEach((input: ResetLocationOnSideFilterDirective) => {
            inputValues[input.component.name] = input.component.value;
        });

        // finished
        return inputValues;
    }

    /**
     * Determine what columns are sorted by
     */
    private getTableSortForCache(): ICachedSortItem {
        // nothing sorted by ?
        if (
            !this.matTableSort ||
            !this.matTableSort.direction
        ) {
            return null;
        }

        // set sort values
        return {
            active: this.matTableSort.active,
            direction: this.matTableSort.direction as RequestSortDirection
        };
    }

    /**
     * Save cache to url
     */
    private saveCacheToUrl(currentUserCache: ICachedFilterItems): void {
        this.listHelperService.router.navigate(
            [],
            {
                relativeTo: this.listHelperService.route,
                // replaceUrl: true,
                queryParamsHandling: 'merge',
                queryParams: {
                    cachedListFilters: JSON.stringify(currentUserCache)
                }
            }
        );
    }

    /**
     * Update cached query
     */
    private updateCachedFilters(): void {
        // disabled saved filters for current user ?
        const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
        if (authUser.dontCacheFilters) {
            return;
        }

        // update filters
        const currentUserCache: ICachedFilter = this.getCachedFilters(false);
        currentUserCache[this.getCachedFilterPageKey()] = {
            queryBuilder: this.queryBuilder.serialize(),
            inputs: this.getInputsValuesForCache(),
            sort: this.getTableSortForCache(),
            sideFilters: this.sideFilter ?
                this.sideFilter.toSaveData() :
                null
        };

        // update the new filter
        // remove previous user data in case we have any...
        this.listHelperService.storageService.set(
            StorageKey.FILTERS, JSON.stringify({
                [authUser.id]: currentUserCache
            })
        );

        // save to url if possible
        this.saveCacheToUrl(currentUserCache[this.getCachedFilterPageKey()]);
    }

    /**
     * Load cached input values
     */
    private loadCachedInputValues(currentUserCacheForCurrentPath: ICachedFilterItems): void {
        // wait for inputs to be rendered
        setTimeout(() => {
            // nothing to load ?
            if (_.isEmpty(currentUserCacheForCurrentPath.inputs)) {
                return;
            }

            // update filter input values
            // keeping in mind that all filters should have ResetInputOnSideFilterDirective directives
            (this.filterInputs || []).forEach((input: ResetInputOnSideFilterDirective) => {
                if (
                    input.control &&
                    currentUserCacheForCurrentPath.inputs[input.control.name] !== undefined &&
                    input.control.valueAccessor instanceof ValueAccessorBase
                ) {
                    input.updateToAfterPristineValueIsTaken(currentUserCacheForCurrentPath.inputs[input.control.name]);
                }
            });

            // update filter input values
            // keeping in mind that all filters should have ResetLocationOnSideFilterDirective directives
            (this.filterLocationInputs || []).forEach((input: ResetLocationOnSideFilterDirective) => {
                if (
                    input.component &&
                    currentUserCacheForCurrentPath.inputs[input.component.name] !== undefined
                ) {
                    input.updateToAfterPristineValueIsTaken(currentUserCacheForCurrentPath.inputs[input.component.name]);
                }
            });
        });
    }

    /**
     * Load cached sort column
     */
    private loadCachedSortColumn(currentUserCacheForCurrentPath: ICachedFilterItems): void {
        // wait for inputs to be rendered
        setTimeout(() => {
            // no sort applied ?
            // make sure we have the mat table visible
            if (
                !currentUserCacheForCurrentPath.sort ||
                !currentUserCacheForCurrentPath.sort.active ||
                !this.matTableSort
            ) {
                return;
            }

            // reset state so that start is the first sort direction that you will see
            this._sortByDisabled = true;
            this.matTableSort.sort({
                id: null,
                start: currentUserCacheForCurrentPath.sort.direction,
                disableClear: false
            });
            this.matTableSort.sort({
                id: currentUserCacheForCurrentPath.sort.active,
                start: currentUserCacheForCurrentPath.sort.direction,
                disableClear: false
            });

            // ugly hack
            (this.matTableSort.sortables.get(currentUserCacheForCurrentPath.sort.active) as MatSortHeader)._setAnimationTransitionState({ toState: 'active' });
            this._sortByDisabled = false;
        });
    }

    /**
     * Load side filters
     */
    private loadSideFilters(currentUserCacheForCurrentPath: ICachedFilterItems): void {
        // wait for inputs to be rendered
        setTimeout(() => {
            // no side filters ?
            if (
                !currentUserCacheForCurrentPath.sideFilters ||
                !this.sideFilter
            ) {
                return;
            }

            // load side filters
            this.sideFilter.generateFiltersFromFilterData(new SavedFilterData(currentUserCacheForCurrentPath.sideFilters));
        });
    }

    /**
     * Loaded cached filters
     */
    afterLoadCachedFilters(): void {
        // NOTHING
    }

    /**
     * Load cached filters
     */
    private loadCachedFilters(): void {
        // disabled saved filters for current user ?
        const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
        if (authUser.dontCacheFilters) {
            // trigger finish callback
            setTimeout(() => {
                this.afterLoadCachedFilters();
            });

            // finished
            return;
        }

        // load saved filters
        const currentUserCache: ICachedFilter = this.getCachedFilters(true);
        const currentUserCacheForCurrentPath: ICachedFilterItems = currentUserCache[this.getCachedFilterPageKey()];
        if (currentUserCacheForCurrentPath) {
            // load search criteria
            this.queryBuilder.deserialize(currentUserCacheForCurrentPath.queryBuilder);

            // load saved input values
            this.loadCachedInputValues(currentUserCacheForCurrentPath);

            // load sort column
            this.loadCachedSortColumn(currentUserCacheForCurrentPath);

            // load side filters
            this.loadSideFilters(currentUserCacheForCurrentPath);

            // update page index
            this.updatePageIndex();
        }

        // trigger finish callback
        setTimeout(() => {
            this.afterLoadCachedFilters();
        });
    }

    /**
     * Update page index
     */
    private updatePageIndex(): void {
        // set paginator page
        if (this.queryBuilder.paginator) {
            if (
                this.queryBuilder.paginator.skip &&
                this.queryBuilder.paginator.limit
            ) {
                this.pageIndex = this.queryBuilder.paginator.skip / this.queryBuilder.paginator.limit;
            }

            // set page size
            if (this.queryBuilder.paginator.limit) {
                this.pageSize = this.queryBuilder.paginator.limit;
            }
        }
    }
}
