import { RequestQueryBuilder, RequestSortDirection } from './request-query-builder';
import * as _ from 'lodash';
import { ReplaySubject, Subscriber, Subscription } from 'rxjs';
import { Constants } from '../models/constants';
import { PageEvent } from '@angular/material/paginator';
import { DebounceTimeCaller } from './debounce-time-caller';
import { ListHelperService } from '../services/helper/list-helper.service';
import { SubscriptionLike } from 'rxjs/internal/types';
import { StorageKey } from '../services/helper/storage.service';
import { UserModel, UserSettings } from '../models/user.model';
import * as LzString from 'lz-string';
import { IV2Column } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel, V2ActionMenuItem } from '../../shared/components-v2/app-list-table-v2/models/action.model';
import { OutbreakModel } from '../models/outbreak.model';
import { IV2GroupedData } from '../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { IBasicCount } from '../models/basic-count.interface';
import { AuthenticatedComponent } from '../components/authenticated/authenticated.component';
import { ICachedFilter, ICachedFilterItems, ICachedInputsValues, ICachedSortItem } from './models/cache.model';
import { ListAppliedFiltersComponent } from './list-applied-filters-component';
import { V2FilterType } from '../../shared/components-v2/app-list-table-v2/models/filter.model';

/**
 * List component
 */
export abstract class ListComponent extends ListAppliedFiltersComponent {
  // handle pop state changes
  private static locationSubscription: SubscriptionLike;

  // handler for stopping take until
  protected destroyed$: ReplaySubject<boolean> = new ReplaySubject<boolean>();

  // authenticated user data
  authUser: UserModel;

  // breadcrumbs
  public breadcrumbs: IV2Breadcrumb[];

  // quick actions
  quickActions: IV2ActionMenuLabel;

  // group actions
  groupActions: V2ActionMenuItem[];

  // add action
  addAction: IV2ActionIconLabel;

  // grouped data
  groupedData: IV2GroupedData;

  // selected outbreak
  selectedOutbreak: OutbreakModel;
  selectedOutbreakSubscription: Subscription;

  // check if selected outbreak is the active one
  get selectedOutbreakIsActive(): boolean {
    return this.authUser &&
      this.selectedOutbreak &&
      this.selectedOutbreak.id &&
      this.selectedOutbreak.id === this.authUser.activeOutbreakId;
  }

  // page information
  pageCount: IBasicCount;
  pageIndex: number = 0;

  // constants
  UserSettings = UserSettings;

  // table columns
  tableColumns: IV2Column[] = [];

  // apply has more limit
  protected applyHasMoreLimit: boolean = true;

  // pagination
  public pageSize: number = Constants.DEFAULT_PAGE_SIZE;
  private paginatorInitialized = false;

  // table sort by
  tableSortBy: {
    field?: string,
    direction?: RequestSortDirection
  } = {};








  // refresh only after we finish changing data
  // by default each time we get back to a page we should display loading spinner
  private _triggeredByPageChange: boolean = false;
  private triggerListRefresh = new DebounceTimeCaller(new Subscriber<void>(() => {
    // disabled ?
    if (this.appliedListFilterLoading) {
      return;
    }

    // triggered by page change ?
    const triggeredByPageChange: boolean = this._triggeredByPageChange;
    this._triggeredByPageChange = false;

    // attach fields restrictions
    const fields: string[] = this.refreshListFields();
    if (fields.length > 0) {
      this.queryBuilder.clearFields();
      this.queryBuilder.fields(...fields);
    }

    // refresh list
    this.refreshList(triggeredByPageChange);
  }));

  // disable next load from cache input values ?
  private _disableNextLoadCachedInputValues: boolean = false;
  private _loadedCachedFilterPage: string;
  private _disableFilterCaching: boolean = false;
  get disableFilterCaching(): boolean {
    return this._disableFilterCaching;
  }

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
    protected listHelperService: ListHelperService,
    disableFilterCaching: boolean = false
  ) {
    // parent constructor
    super(
      listHelperService,
      () => {
        this.updateCachedFilters();
      },
      (
        instant?: boolean,
        resetPagination?: boolean,
        triggeredByPageChange?: boolean
      ) => {
        this.needsRefreshList(
          instant !== undefined ? instant : false,
          resetPagination !== undefined ? resetPagination : true,
          triggeredByPageChange !== undefined ? triggeredByPageChange : false
        );
      }
    );

    // get auth data
    this.authUser = this.listHelperService.authDataService.getAuthenticatedUser();


    // wait for binding so some things get processed
    setTimeout(() => {
      // initialize breadcrumbs
      this.initializeBreadcrumbs();

      // initialize side columns
      this.initializeTableColumns();

      // initialize advanced filters
      this.initializeTableAdvancedFilters();

      // load saved filters
      this.loadCachedFilters();
    });



    // listen for outbreak selection
    this.selectedOutbreakSubscription = this.listHelperService.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // select outbreak
        this.selectedOutbreak = selectedOutbreak;

        // trigger outbreak selection changed
        // - wait for binding
        setTimeout(() => {
          this.selectedOutbreakChanged();
        });
      });


    // disable filter caching ?
    this._disableFilterCaching = disableFilterCaching;

    // check filters
    this.checkListFilters();

    // remove old subscription since we shouldn't have more than one list component visible at the same time ( at least not now )
    if (ListComponent.locationSubscription) {
      ListComponent.locationSubscription.unsubscribe();
      ListComponent.locationSubscription = null;
    }

    // listen for back / forward buttons
    ListComponent.locationSubscription = this.listHelperService.location
      .subscribe(() => {
        setTimeout(() => {
          // check if subscription was closed
          if (
            !ListComponent.locationSubscription ||
            ListComponent.locationSubscription.closed
          ) {
            return;
          }

          // clear all filters
          this.queryBuilder = new RequestQueryBuilder(() => {
            this.updateCachedFilters();
          });

          // init paginator ?
          if (this.paginatorInitialized) {
            this.initPaginator();
          }

          // refresh filters
          this.checkListFilters();

          // re-init breadcrumbs
          this.initializeBreadcrumbs();

          // load cached filters if necessary
          this.loadCachedFiltersIfNecessary();

          // refresh page
          this.needsRefreshList(true);
        });
      });
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // release subscribers
    this.releaseSubscribers();

    // unsubscribe other requests
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.destroyed$ = undefined;
  }

  /**
   * Initialize side table columns
   */
  protected abstract initializeTableColumns(): void;

  /**
   * Initialize side table advanced filters
   */
  protected abstract initializeTableAdvancedFilters(): void;

  /**
   * Selected outbreak changed
   */
  protected selectedOutbreakChanged(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected abstract initializeBreadcrumbs(): void;

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected abstract refreshListFields(): string[];

  /**
     * Refresh list
     */
  public abstract refreshList(
    triggeredByPageChange?: boolean
  );

  /**
     * Refresh items count
     * Note: To be overridden on pages that implement pagination
     */
  public refreshListCount(_applyHasMoreLimit?: boolean) {
    console.error('Component must implement \'refreshListCount\' method');
  }

  /**
   * Release subscribers
   */
  private releaseSubscribers() {
    // selected outbreak
    if (this.selectedOutbreakSubscription) {
      this.selectedOutbreakSubscription.unsubscribe();
      this.selectedOutbreakSubscription = undefined;
    }

    // query builder
    this.queryBuilder.destroyListeners();

    // location subscriber
    if (ListComponent.locationSubscription) {
      ListComponent.locationSubscription.unsubscribe();
      ListComponent.locationSubscription = null;
    }

    // refresh data
    if (this.triggerListRefresh) {
      this.triggerListRefresh.unsubscribe();
      this.triggerListRefresh = null;
    }

    // refresh count
    if (this.triggerListCountRefresh) {
      this.triggerListCountRefresh.unsubscribe();
      this.triggerListCountRefresh = null;
    }
  }

  /**
     * Tell list that we need to refresh list
     */
  public needsRefreshList(
    instant: boolean = false,
    resetPagination: boolean = true,
    triggeredByPageChange: boolean = false
  ) {
    // triggered by page change ?
    if (triggeredByPageChange) {
      this._triggeredByPageChange = true;
    }

    // do we need to reset pagination (aka go to the first page) ?
    if (
      resetPagination &&
      this.paginatorInitialized
    ) {
      // re-calculate items count (filters have changed)
      if (this.triggerListCountRefresh) {
        this.triggerListCountRefresh.call(instant);
      }

      // reset paginator
      this.resetPaginator(true);
    }

    // refresh list
    if (this.triggerListRefresh) {
      this.triggerListRefresh.call(instant);
    }
  }

  /**
   * Sort asc / desc by specific fields
   */
  public sortBy(
    data: {
      field: string,
      direction: RequestSortDirection
    },
    objectDetailsSort?: {
      [property: string]: string[]
    }
  ) {
    // sort information
    this.tableSortBy.field = data?.field;
    this.tableSortBy.direction = data?.direction;

    // remove previous sort columns, we can sort only by one column at a time
    this.queryBuilder.sort.clear();

    // retrieve Side filters
    // let queryBuilder;
    // if (
    //   this.sideFilter &&
    //   (queryBuilder = this.sideFilter.getQueryBuilder())
    // ) {
    //   this.queryBuilder.sort.merge(queryBuilder.sort);
    // }

    // sort
    if (
      this.tableSortBy.field &&
      this.tableSortBy.direction
    ) {
      // add sorting criteria
      if (
        objectDetailsSort &&
        objectDetailsSort[this.tableSortBy.field]
      ) {
        _.each(objectDetailsSort[this.tableSortBy.field], (childProperty: string) => {
          this.queryBuilder.sort.by(
            `${this.tableSortBy.field}.${childProperty}`,
            this.tableSortBy.direction
          );
        });
      } else {
        this.queryBuilder.sort.by(
          this.tableSortBy.field,
          this.tableSortBy.direction
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
     * Reset paginator
     */
  protected resetPaginator(disableOnChange: boolean = false): void {
    // initialize query paginator
    this.queryBuilder.paginator.setPage({
      pageSize: this.pageSize,
      pageIndex: 0
    }, disableOnChange);

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
      false,
      true
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
    // // clear header filters
    // if (this.filterInputs) {
    //   this.filterInputs.forEach((input: ResetInputOnSideFilterDirective) => {
    //     input.reset();
    //   });
    // }
    //
    // // clear location header filters
    // if (this.filterLocationInputs) {
    //   this.filterLocationInputs.forEach((input: ResetLocationOnSideFilterDirective) => {
    //     input.reset();
    //   });
    // }

    // refresh of the list is done automatically after debounce time
    // #
  }

  /**
     * Reset table sort columns
     */
  clearHeaderSort() {
    // update table v2 and trigger sortBy to update this.tableSortBy and ..update cached filters
    // #TODO

    // if (this.matTableSort) {
    //   this.matTableSort.sort({
    //     id: null
    //   } as MatSortable);
    // }

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
    // let queryBuilder;
    // if (
    //   this.sideFilter &&
    //   (queryBuilder = this.sideFilter.getQueryBuilder())
    // ) {
    //   this.queryBuilder.merge(queryBuilder);
    // }

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
   */
  protected setListFilterBreadcrumbs(
    _listFilter: string,
    _listFilterData: any = {}
  ) {
    // [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWUP_LIST]: 'LNG_PAGE_LIST_FILTER_CONTACTS_ON_THE_FOLLOW_UP_LIST',
    //   [Constants.APPLY_LIST_FILTER.CASES_DECEASED]: 'LNG_PAGE_LIST_FILTER_CASES_DECEASED',
    //   [Constants.APPLY_LIST_FILTER.CASES_ISOLATED]: 'LNG_PAGE_LIST_FILTER_CASES_ISOLATED',
    //   [Constants.APPLY_LIST_FILTER.CASES_HOSPITALISED]: 'LNG_PAGE_LIST_FILTER_CASES_HOSPITALISED',
    //   [Constants.APPLY_LIST_FILTER.CASES_NOT_HOSPITALISED]: 'LNG_PAGE_LIST_FILTER_CASES_NOT_HOSPITALISED',
    //   [Constants.APPLY_LIST_FILTER.CASES_LESS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_LESS_CONTACTS',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_LOST_TO_FOLLOW_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_LOST_TO_FOLLOW_UP',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_NOT_SEEN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_NOT_SEEN',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_SEEN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_SEEN',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_FOLLOWED_UP]: 'LNG_PAGE_LIST_FILTER_CONTACTS_FOLLOWED_UP',
    //   [Constants.APPLY_LIST_FILTER.CASES_IN_THE_TRANSMISSION_CHAINS]: 'LNG_PAGE_LIST_FILTER_CASES_IN_THE_TRANSMISSION_CHAINS',
    //   [Constants.APPLY_LIST_FILTER.CASES_PREVIOUS_DAYS_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_AMONG_CONTACTS',
    //   [Constants.APPLY_LIST_FILTER.CASES_NOT_IDENTIFIED_THROUGH_CONTACTS]: 'LNG_PAGE_LIST_FILTER_CASES_NOT_IDENTIFIED_THROUGH_CONTACTS',
    //   [Constants.APPLY_LIST_FILTER.CASES_PENDING_LAB_RESULT]: 'LNG_PAGE_LIST_FILTER_CASES_PENDING_LAB_RESULT',
    //   [Constants.APPLY_LIST_FILTER.CASES_REFUSING_TREATMENT]: 'LNG_PAGE_LIST_FILTER_CASES_REFUSING_TREATMENT',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NUMBER_OF_CONTACTS_BECOMING_CASES_OVER_TIME_AND_PLACE',
    //   [Constants.APPLY_LIST_FILTER.NO_OF_ACTIVE_TRANSMISSION_CHAINS]: 'LNG_PAGE_DASHBOARD_KPI_CONTACTS_NUMBER_ACTIVE_CHAINS',
    //   [Constants.APPLY_LIST_FILTER.NO_OF_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES]: 'LNG_PAGE_DASHBOARD_NEW_CHAINS_OF_TRANSMISSION_FROM_CONTACTS_WHO_BECOME_CASES',
    //   [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_CASES_WITHOUT_RELATIONSHIPS',
    //   [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_RELATIONSHIPS]: 'LNG_PAGE_DASHBOARD_EVENTS_WITHOUT_RELATIONSHIPS',
    //   [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_ONSET_CHAIN]: 'LNG_PAGE_LIST_FILTER_CASES_WITHOUT_DATE_OF_ONSET_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN]: 'LNG_PAGE_LIST_FILTER_CASES_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.CASES_WITHOUT_DATE_OF_REPORTING_CHAIN]: 'LNG_PAGE_LIST_FILTER_CASES_WITHOUT_DATE_OF_REPORTING_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_WITHOUT_DATE_OF_LAST_CONTACT_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN]: 'LNG_PAGE_LIST_FILTER_CONTACTS_WITHOUT_DATE_OF_REPORTING_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_CHAIN]: 'LNG_PAGE_LIST_FILTER_EVENTS_WITHOUT_DATE_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN]: 'LNG_PAGE_LIST_FILTER_EVENTS_WITHOUT_DATE_OF_REPORTING_CHAIN',
    //   [Constants.APPLY_LIST_FILTER.CONTEXT_SENSITIVE_HELP_ITEMS]: 'LNG_PAGE_LIST_FILTER_HELP_CONTEXT_SENSITIVE',
    //   [Constants.APPLY_LIST_FILTER.CASE_SUMMARY]: 'LNG_PAGE_DASHBOARD_CASE_SUMMARY',
    //   [Constants.APPLY_LIST_FILTER.CASES_BY_LOCATION]: 'LNG_PAGE_DASHBOARD_CASE_BY_LOCATION',

    // const breadcrumbToken = Constants.LIST_FILTER_TITLE[listFilter];
    // if (breadcrumbToken) {
    //   // get the breadcrumb representing the list page
    //   const listPageBreadcrumb: BreadcrumbItemModel = _.find(this.breadcrumbs, {active: true});
    //   if (listPageBreadcrumb) {
    //     // update the breadcrumb
    //     const fallbackUrl: string[] | boolean = this.listHelperService.determineFallbackUrl();
    //     listPageBreadcrumb.active = false;
    //     listPageBreadcrumb.onClick = () => {
    //       // redirect to cases list pages ( hack since we can't use navigate for the same component )
    //       if (fallbackUrl) {
    //         this.listHelperService.redirectService.to(fallbackUrl as string[]);
    //       } else {
    //         // DON'T REDIRECT
    //       }
    //     };
    //   }
    //
    //   // add new breadcrumb
    //   this.breadcrumbs.push(
    //     new BreadcrumbItemModel(
    //       breadcrumbToken,
    //       '.',
    //       true,
    //       {},
    //       listFilterData
    //     )
    //   );
    // }
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
      filters = JSON.parse(LzString.decompress(cachedFilters));
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
              this.listHelperService.toastV2Service.error('LNG_COMMON_LABEL_INVALID_URL_FILTERS');
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

    // remove ids from link so we don't have filters for each item because this would mean that we will fill storage really fast
    filterKey = filterKey.replace(
      /[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}/ig,
      ''
    );

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
    (this.tableColumns || []).forEach((column) => {
      // has no filter ?
      if (!column.filter) {
        return;
      }

      // handle accordingly to filter type
      let value: any;
      switch (column.filter.type) {
        case V2FilterType.ADDRESS_PHONE_NUMBER:
          // get value
          value = column.filter.address.phoneNumber;

          // finished
          break;

        case V2FilterType.ADDRESS_MULTIPLE_LOCATION:
          // get value
          value = column.filter.address.filterLocationIds;

          // finished
          break;

        case V2FilterType.ADDRESS_FIELD:
          // get value
          value = column.filter.address[column.filter.addressField];

          // finished
          break;

        case V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION:
          // get value
          value = column.filter.address.geoLocationAccurate;

          // finished
          break;

        default:
          value = column.filter.value;
      }

      // nothing to do ?
      if (value === undefined) {
        return;
      }

      // update value
      inputValues[column.field] = value;
    });

    // finished
    return inputValues;
  }

  /**
   * Determine what columns are sorted by
   */
  private getTableSortForCache(): ICachedSortItem {
    // nothing sorted by ?
    if (!this.tableSortBy.direction) {
      return null;
    }

    // set sort values
    return {
      active: this.tableSortBy.field,
      direction: this.tableSortBy.direction
    };
  }

  /**
   * Merge query params to url
   */
  private mergeQueryParamsToUrl(queryParams: {
    [queryParamKey: string]: any
  }): void {
    // disable show page loading
    AuthenticatedComponent.DISABLE_PAGE_LOADING = true;

    // add params to page
    this.listHelperService.router
      .navigate(
        [],
        {
          relativeTo: this.listHelperService.route,
          replaceUrl: true,
          queryParamsHandling: 'merge',
          queryParams
        }
      )
      .then(() => {
        // enable page loading
        AuthenticatedComponent.DISABLE_PAGE_LOADING = false;
      });
  }

  /**
   * Save cache to url
   */
  private saveCacheToUrl(currentUserCache: ICachedFilterItems): void {
    this.mergeQueryParamsToUrl({
      cachedListFilters: JSON.stringify(currentUserCache)
    });
  }

  /**
   * Update cached query
   */
  private updateCachedFilters(): void {
    // disabled saved filters for current user ?
    const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
    if (
      authUser.dontCacheFilters ||
      this._disableFilterCaching
    ) {
      return;
    }

    // update filters
    const currentUserCache: ICachedFilter = this.getCachedFilters(false);
    currentUserCache[this.getCachedFilterPageKey()] = {
      queryBuilder: this.queryBuilder.serialize(),
      inputs: this.getInputsValuesForCache(),
      sort: this.getTableSortForCache(),
      sideFilters: null // this.sideFilter ?
      //   this.sideFilter.toSaveData() :
      //   null
    };

    // update the new filter
    // remove previous user data in case we have any...
    this.listHelperService.storageService.set(
      StorageKey.FILTERS, LzString.compress(JSON.stringify({
        [authUser.id]: currentUserCache
      }))
    );

    // save to url if possible
    this.saveCacheToUrl(currentUserCache[this.getCachedFilterPageKey()]);
  }

  // /**
  //  * Visible columns
  //  */
  // applySideColumnsChanged(visibleColumns: string[]) {
  //   // apply side columns
  //   this.visibleTableColumns = visibleColumns;
  //
  //   // disabled saved filters for current user ?
  //   const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
  //   if (
  //     authUser.dontCacheFilters ||
  //     this._disableFilterCaching
  //   ) {
  //     return;
  //   }
  //
  //   // reload data into columns from cached filters
  //   // load saved filters
  //   const currentUserCache: ICachedFilter = this.getCachedFilters(true);
  //   const currentUserCacheForCurrentPath: ICachedFilterItems = currentUserCache[this.getCachedFilterPageKey()];
  //   if (currentUserCacheForCurrentPath) {
  //     // load saved input values
  //     this.loadCachedInputValues(currentUserCacheForCurrentPath);
  //   }
  // }

  /**
   * Load cached input values
   */
  private loadCachedInputValues(currentUserCacheForCurrentPath: ICachedFilterItems): void {
    // allow next reset
    if (this._disableNextLoadCachedInputValues) {
      // allow next reset
      this._disableNextLoadCachedInputValues = false;

      // finished
      return;
    }

    // nothing to load ?
    if (_.isEmpty(currentUserCacheForCurrentPath.inputs)) {
      return;
    }

    // update filter input values
    (this.tableColumns || []).forEach((column) => {
      // has no filter ?
      if (!column.filter) {
        return;
      }

      // determine if we have cached value
      const value: any = currentUserCacheForCurrentPath.inputs[column.field];
      if (value === undefined) {
        return;
      }

      // handle accordingly to filter type
      switch (column.filter.type) {
        case V2FilterType.ADDRESS_PHONE_NUMBER:
          // get value
          column.filter.address.phoneNumber = value;

          // finished
          break;

        case V2FilterType.ADDRESS_MULTIPLE_LOCATION:
          // get value
          column.filter.address.filterLocationIds = value;

          // finished
          break;

        case V2FilterType.ADDRESS_FIELD:
          // get value
          column.filter.address[column.filter.addressField] = value;

          // finished
          break;

        case V2FilterType.ADDRESS_ACCURATE_GEO_LOCATION:
          // get value
          column.filter.address.geoLocationAccurate = value;

          // finished
          break;

        default:
          column.filter.value = value;
      }
    });
  }

  /**
     * Load cached sort column
     */
  private loadCachedSortColumn(currentUserCacheForCurrentPath: ICachedFilterItems): void {
    // no sort applied ?
    if (
      !currentUserCacheForCurrentPath.sort ||
      !currentUserCacheForCurrentPath.sort.active ||
      !currentUserCacheForCurrentPath.sort.direction
    ) {
      return;
    }

    // reset state so that start is the first sort direction that you will see
    this.tableSortBy = {
      field: currentUserCacheForCurrentPath.sort.active,
      direction: currentUserCacheForCurrentPath.sort.direction
    };
  }

  /**
     * Load side filters
     */
  private loadSideFilters(_currentUserCacheForCurrentPath: ICachedFilterItems): void {
    // // wait for inputs to be rendered
    // setTimeout(() => {
    //   // no side filters ?
    //   if (
    //     !currentUserCacheForCurrentPath.sideFilters ||
    //     !this.sideFilter
    //   ) {
    //     return;
    //   }
    //
    //   // load side filters
    //   this.sideFilter.generateFiltersFromFilterData(new SavedFilterData(currentUserCacheForCurrentPath.sideFilters));
    // });
  }

  /**
     * Loaded cached filters
     */
  beforeCacheLoadFilters(): void {
    // NOTHING
  }

  /**
     * Check if we need to load cached filters if necessary depending if we already loaded for this route or not
     */
  private loadCachedFiltersIfNecessary(): void {
    // if we loaded cached filters for this page then we don't need to load it again
    if (this._loadedCachedFilterPage === this.getCachedFilterPageKey()) {
      return;
    }

    // load saved filters
    this.loadCachedFilters();
  }

  /**
     * Load cached filters
     */
  private loadCachedFilters(): void {
    // disabled saved filters for current user ?
    const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
    if (
      authUser.dontCacheFilters ||
      this._disableFilterCaching
    ) {
      // trigger finish callback
      this.beforeCacheLoadFilters();

      // finished
      return;
    }

    // set loaded cached filters value
    // needs to be here, otherwise DONT_LOAD_STATIC_FILTERS_KEY won't work properly, since this method is called twice...
    this._loadedCachedFilterPage = this.getCachedFilterPageKey();

    // did we disabled loading cached filters for this page ?
    if (this.listHelperService.route.snapshot.queryParams[Constants.DONT_LOAD_STATIC_FILTERS_KEY]) {
      // next time load the saved filters
      this.mergeQueryParamsToUrl({
        [Constants.DONT_LOAD_STATIC_FILTERS_KEY]: undefined
      });

      // disable next load from cache input values ?
      this._disableNextLoadCachedInputValues = true;

      // don't load the saved filters
      return;
    }

    // allow next reset
    this._disableNextLoadCachedInputValues = false;

    // load saved filters
    const currentUserCache: ICachedFilter = this.getCachedFilters(true);
    const currentUserCacheForCurrentPath: ICachedFilterItems = currentUserCache[this._loadedCachedFilterPage];
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

    // trigger before actually refreshing page
    // NO setTimeout because it will break some things
    this.beforeCacheLoadFilters();
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
      } else {
        this.pageIndex = 0;
      }

      // set page size
      if (this.queryBuilder.paginator.limit) {
        this.pageSize = this.queryBuilder.paginator.limit;
      }
    }
  }
}
