import { RequestQueryBuilder, RequestSortDirection } from './request-query-builder';
import * as _ from 'lodash';
import { Observable, ReplaySubject, Subscription } from 'rxjs';
import { Constants } from '../models/constants';
import { PageEvent } from '@angular/material/paginator';
import { DebounceTimeCaller } from './debounce-time-caller';
import { ListHelperService } from '../services/helper/list-helper.service';
import { SubscriptionLike } from 'rxjs/internal/types';
import { StorageKey, StorageService } from '../services/helper/storage.service';
import { UserModel, UserSettings } from '../models/user.model';
import * as LzString from 'lz-string';
import { applyResetOnAllFilters, applySortBy, IV2Column } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2Breadcrumb } from '../../shared/components-v2/app-breadcrumb-v2/models/breadcrumb.model';
import {
  IV2ActionIconLabel,
  IV2ActionMenuLabel,
  IV2GroupActions
} from '../../shared/components-v2/app-list-table-v2/models/action.model';
import { OutbreakModel } from '../models/outbreak.model';
import { IV2GroupedData } from '../../shared/components-v2/app-list-table-v2/models/grouped-data.model';
import { IBasicCount } from '../models/basic-count.interface';
import { AuthenticatedComponent } from '../components/authenticated/authenticated.component';
import { ICachedFilter, ICachedFilterItems, ICachedInputsValues, ICachedSortItem } from './models/cache.model';
import { ListAppliedFiltersComponent } from './list-applied-filters-component';
import { V2FilterType } from '../../shared/components-v2/app-list-table-v2/models/filter.model';
import {
  V2AdvancedFilter,
  V2AdvancedFilterType
} from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { Directive, ViewChild } from '@angular/core';
import { AppListTableV2Component } from '../../shared/components-v2/app-list-table-v2/app-list-table-v2.component';
import { SavedFilterData } from '../models/saved-filters.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { IV2ProcessSelectedData } from '../../shared/components-v2/app-list-table-v2/models/process-data.model';
import { IV2ColumnToVisibleMandatoryConf } from '../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';

/**
 * List component
 */
@Directive()
export abstract class ListComponent<T, U extends (IV2Column | IV2ColumnToVisibleMandatoryConf)> extends ListAppliedFiltersComponent<U> {
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
  groupActions: IV2GroupActions;

  // add action
  addAction: IV2ActionIconLabel;

  // grouped data
  groupedData: IV2GroupedData;

  // advanced filters
  advancedFilters: V2AdvancedFilter[];

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
  Constants = Constants;

  // apply has more limit
  protected applyHasMoreLimit: boolean = true;

  // pagination
  public pageSize: number = Constants.DEFAULT_PAGE_SIZE;
  private paginatorInitialized = false;

  // records
  records$: Observable<T[]>;

  // table sort by
  tableSortBy: {
    field?: string,
    direction?: RequestSortDirection
  } = {};

  // info
  infos: string[];

  // suffix legends
  suffixLegends: ILabelValuePairModel[];

  // process data
  processSelectedData: IV2ProcessSelectedData[];

  // retrieve table handler
  @ViewChild(AppListTableV2Component, { static: true }) tableV2Component: AppListTableV2Component;

  // refresh only after we finish changing data
  // by default each time we get back to a page we should display loading spinner
  private _triggeredByPageChange: boolean = false;
  private triggerListRefresh = new DebounceTimeCaller(() => {
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
  });

  // disable next load from cache input values ?
  private _disableNextLoadCachedInputValues: boolean = false;
  private _loadedCachedFilterPage: string;
  private readonly _disableFilterCaching: boolean = false;
  private readonly _disableFilterCachingOnlyUrl: boolean = false;

  // timers
  private _initializeTimer: number;
  private _outbreakChangedTimer: number;
  private _browserLocationTimer: number;
  private _forLoadingFiltersTimer: number;
  private _refreshTableUITimer: number;

  // refresh only after we finish changing data
  private triggerListCountRefresh = new DebounceTimeCaller(() => {
    // disabled ?
    if (this.appliedListFilterLoading) {
      return;
    }

    // refresh list
    this.refreshListCount();
  });

  /**
   * Retrieve cached filters
   */
  static getCachedFiltersPageKey(
    filterKey: string,
    applySuffix: string
  ): string {
    // get path
    const pathParamsIndex: number = filterKey.indexOf('?');
    if (pathParamsIndex > -1) {
      filterKey = filterKey.substr(0, pathParamsIndex);
    }

    // if apply list filter then we need to make sure we add it to our key so we don't break other pages by adding filters that we shouldn't
    if (applySuffix) {
      filterKey += `_${applySuffix}`;
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
   * Retrieve cached filters
   */
  static getCachedFiltersFromStorage(
    authUser: UserModel,
    storageService: StorageService
  ): ICachedFilter {
    // retrieve filters if there are any initialized
    const cachedFilters: string = storageService.get(StorageKey.FILTERS);
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

    // finished
    return currentUserCache;
  }

  /**
   * Constructor
   */
  protected constructor(
    protected listHelperService: ListHelperService,
    config?: {
      // optional
      disableFilterCaching?: boolean,
      disableFilterCachingOnlyUrl?: boolean,
      disableWaitForSelectedOutbreakToRefreshList?: boolean,
      initializeTableColumnsAfterSelectedOutbreakChanged?: boolean,
      initializeTableAdvancedFiltersAfterSelectedOutbreakChanged?: boolean
    }
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
        // do we have outbreak - if not, it will be refreshed by that ?
        if (
          !config?.disableWaitForSelectedOutbreakToRefreshList &&
          !this.selectedOutbreak?.id
        ) {
          return;
        }

        // refresh
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
    this._initializeTimer = setTimeout(() => {
      // reset
      this._initializeTimer = undefined;

      // initialize breadcrumbs
      this.initializeBreadcrumbs();

      // initialize table column actions
      this.initializeTableColumnActions();

      // initialize table columns
      if (!config?.initializeTableColumnsAfterSelectedOutbreakChanged) {
        this.initializeTableColumns();
      }

      // initialize process data
      this.initializeProcessSelectedData();

      // initialize infos
      this.initializeTableInfos();

      // initialize advanced filters
      if (!config?.initializeTableAdvancedFiltersAfterSelectedOutbreakChanged) {
        this.initializeTableAdvancedFilters();
      }

      // initialize table quick actions
      this.initializeQuickActions();

      // initialize table group actions
      this.initializeGroupActions();

      // initialize table add actions
      this.initializeAddAction();

      // initialize table grouped data
      this.initializeGroupedData();

      // load saved filters
      if (
        !config?.initializeTableColumnsAfterSelectedOutbreakChanged &&
        !config?.initializeTableAdvancedFiltersAfterSelectedOutbreakChanged
      ) {
        this.loadCachedFilters();
      }

      // apply table column filters
      if (!config?.initializeTableColumnsAfterSelectedOutbreakChanged) {
        this.applyTableColumnFilters();
      }

      // component initialized
      this.initialized();
    });

    // listen for outbreak selection
    this.selectedOutbreakSubscription = this.listHelperService.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        // ignore empty selection for now, no need to take in account ...de-selection
        if (!selectedOutbreak) {
          return;
        }

        // if same outbreak then don't trigger change
        if (
          this.selectedOutbreak &&
          this.selectedOutbreak.id === selectedOutbreak.id
        ) {
          return;
        }

        // select outbreak
        this.selectedOutbreak = selectedOutbreak;

        // merge default fields
        this.listHelperService.outbreakAndOutbreakTemplateHelperService.mergeDefaultVisibleMandatoryFields(this.selectedOutbreak);

        // stop previous
        this.stopOutbreakChangedTimer();

        // trigger outbreak selection changed
        // - wait for binding
        this._outbreakChangedTimer = setTimeout(() => {
          // reset
          this._outbreakChangedTimer = undefined;

          // refresh table ui ?
          let refreshTableUI: boolean = false;

          // initialize table columns
          if (config?.initializeTableColumnsAfterSelectedOutbreakChanged) {
            // init
            this.initializeTableColumns();

            // we need to refresh table ui
            refreshTableUI = true;
          }

          // initialize advanced filters
          if (config?.initializeTableAdvancedFiltersAfterSelectedOutbreakChanged) {
            // init
            this.initializeTableAdvancedFilters();

            // we need to refresh table ui
            refreshTableUI = true;
          }

          // load saved filters
          if (
            config?.initializeTableColumnsAfterSelectedOutbreakChanged ||
            config?.initializeTableAdvancedFiltersAfterSelectedOutbreakChanged
          ) {
            this.loadCachedFilters();
          }

          // apply table column filters
          if (config?.initializeTableColumnsAfterSelectedOutbreakChanged) {
            this.applyTableColumnFilters();
          }

          // call
          this.selectedOutbreakChanged();

          // update table ui ?
          if (refreshTableUI) {
            // stop previous
            this.stopRefreshTableUITimer();

            // wait for column binding to take effect
            this._refreshTableUITimer = setTimeout(() => {
              // reset
              this._refreshTableUITimer = undefined;

              // resize
              this.tableV2Component.resizeTable();
            });
          }
        });
      });


    // disable filter caching ?
    this._disableFilterCaching = !!config?.disableFilterCaching;
    this._disableFilterCachingOnlyUrl = !!config?.disableFilterCachingOnlyUrl;

    // check filters
    this.checkListFilters();

    // always disable caching if applied filters used
    if (this.appliedListFilter) {
      this._disableFilterCaching = true;
    }

    // remove old subscription since we shouldn't have more than one list component visible at the same time ( at least not now )
    if (ListComponent.locationSubscription) {
      ListComponent.locationSubscription.unsubscribe();
      ListComponent.locationSubscription = null;
    }

    // listen for back / forward buttons
    ListComponent.locationSubscription = this.listHelperService.location
      .subscribe(() => {
        // stop previous
        this.stopBrowserLocationTimer();

        // location changed
        this._browserLocationTimer = setTimeout(() => {
          // reset
          this._browserLocationTimer = undefined;

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

          // initialize table columns
          this.initializeTableColumns();

          // initialize advanced filters
          this.initializeTableAdvancedFilters();

          // load cached filters if necessary
          this.loadCachedFiltersIfNecessary();

          // apply table column filters
          this.applyTableColumnFilters();

          // refresh page
          this.needsRefreshList(true);
        });
      });
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // call
    super.onDestroy();

    // release subscribers
    this.releaseSubscribers();

    // stop timers
    this.stopInitializeTimer();
    this.stopOutbreakChangedTimer();
    this.stopBrowserLocationTimer();
    this.stopForLoadingFiltersTimer();
    this.stopRefreshTableUITimer();

    // unsubscribe other requests
    this.destroyed$.next(true);
    this.destroyed$.complete();
    this.destroyed$ = undefined;
  }

  /**
   * Initialize table columns
   */
  protected abstract initializeTableColumns(): void;

  /**
   * Initialize table column - actions
   */
  protected abstract initializeTableColumnActions(): void;

  /**
   * Initialize process data
   */
  protected abstract initializeProcessSelectedData(): void;

  /**
   * Initialize table infos
   */
  protected abstract initializeTableInfos(): void;

  /**
   * Initialize table advanced filters
   */
  protected abstract initializeTableAdvancedFilters(): void;

  /**
   * Initialize table quick actions
   */
  protected abstract initializeQuickActions(): void;

  /**
   * Initialize table group actions
   */
  protected abstract initializeGroupActions(): void;

  /**
   * Initialize table add action
   */
  protected abstract initializeAddAction(): void;

  /**
   * Initialize table grouped data
   */
  protected abstract initializeGroupedData(): void;

  /**
   * Selected outbreak changed
   */
  protected selectedOutbreakChanged(): void {}

  /**
   * Component initialized
   */
  protected initialized(): void {}

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
    // eslint-disable-next-line no-console
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
   * Stop timer
   */
  private stopInitializeTimer(): void {
    if (this._initializeTimer) {
      clearTimeout(this._initializeTimer);
      this._initializeTimer = undefined;
    }
  }

  /**
   * Stop timer
   */
  private stopOutbreakChangedTimer(): void {
    if (this._outbreakChangedTimer) {
      clearTimeout(this._outbreakChangedTimer);
      this._outbreakChangedTimer = undefined;
    }
  }

  /**
   * Stop timer
   */
  private stopRefreshTableUITimer(): void {
    if (this._refreshTableUITimer) {
      clearTimeout(this._refreshTableUITimer);
      this._refreshTableUITimer = undefined;
    }
  }

  /**
   * Stop timer
   */
  private stopBrowserLocationTimer(): void {
    if (this._browserLocationTimer) {
      clearTimeout(this._browserLocationTimer);
      this._browserLocationTimer = undefined;
    }
  }

  /**
   * Stop timer
   */
  private stopForLoadingFiltersTimer(): void {
    if (this._forLoadingFiltersTimer) {
      clearTimeout(this._forLoadingFiltersTimer);
      this._forLoadingFiltersTimer = undefined;
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

    // apply sort
    applySortBy(
      this.tableSortBy,
      this.queryBuilder,
      this.tableV2Component?.advancedFiltersQueryBuilder,
      objectDetailsSort
    );

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
   * Clear query builder of conditions and sorting criterias
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
    applyResetOnAllFilters(this.tableColumns);

    // not rendered yet ?
    if (!this.tableV2Component) {
      return;
    }

    // force redraw
    this.tableV2Component.updateColumnDefinitions();
  }

  /**
   * Reset table sort columns
   */
  clearHeaderSort() {
    // not rendered yet ?
    if (!this.tableV2Component) {
      return;
    }

    // update
    this.tableV2Component.columnSortBy(
      null,
      null,
      null
    );

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

    // apply table column filters
    this.applyTableColumnFilters();

    // retrieve Side filters
    let queryBuilder: RequestQueryBuilder;
    if (
      this.tableV2Component &&
      (queryBuilder = this.tableV2Component.advancedFiltersQueryBuilder)
    ) {
      this.queryBuilder.merge(queryBuilder);
    }

    // if no side query builder then clear side filters too
    if (
      !queryBuilder &&
      this.tableV2Component
    ) {
      this.tableV2Component.generateFiltersFromFilterData(undefined);
    }

    // apply list filters which is mandatory
    this.mergeListFilterToMainFilter();

    // update cached filters
    this.updateCachedFilters();

    // refresh
    this.needsRefreshList(
      true,
      true
    );
  }

  /**
   * Apply the filters selected from the Side Filters section
   */
  applySideFilters(queryBuilder: RequestQueryBuilder) {
    // clear query builder of conditions and sorting criteria
    this.clearQueryBuilder();

    // clear table filters
    this.clearHeaderFilters();

    // reset table sort columns
    this.clearHeaderSort();

    // merge query builder with side filters
    if (queryBuilder) {
      this.queryBuilder.merge(queryBuilder);
    }

    // apply list filters which is mandatory
    this.mergeListFilterToMainFilter();

    // update cached filters
    this.updateCachedFilters();

    // refresh list
    this.needsRefreshList(true);
  }

  /**
   * Retrieve cached filters
   */
  private getCachedFilters(forLoadingFilters: boolean): ICachedFilter {
    // we need to have data for this user, otherwise remove what we have
    const currentUserCache: ICachedFilter = ListComponent.getCachedFiltersFromStorage(
      this.listHelperService.authDataService.getAuthenticatedUser(),
      this.listHelperService.storageService
    );

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
            // stop previous
            this.stopForLoadingFiltersTimer();

            // call
            this._forLoadingFiltersTimer = setTimeout(() => {
              // reset
              this._forLoadingFiltersTimer = undefined;

              // show error
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
    return ListComponent.getCachedFiltersPageKey(
      this.listHelperService.location.path(),
      this.appliedListFilter
    );
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
    // disabled ?
    if (this._disableFilterCachingOnlyUrl) {
      return;
    }

    // update
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
      sideFilters: this.tableV2Component ?
        this.tableV2Component.advancedFiltersToSaveData() :
        null
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

        case V2FilterType.MULTIPLE_SELECT:
          // map
          const selectMap: {
            [id: string]: true
          } = {};
          column.filter.options?.forEach((option) => {
            selectMap[option.value] = true;
          });

          // get value
          column.filter.value = Array.isArray(value) ?
            value.filter((item) =>
              typeof item !== 'string' ||
              !column.filter.options ||
              selectMap[item]
            ) :
            value;

          // finished
          break;

        // deleted is always a special case
        // - take in account the side filter cached value
        case V2FilterType.DELETED:

          // side filter takes precedence, deleted column shouldn't overwrite value
          // - LNG_COMMON_MODEL_FIELD_LABEL_DELETED is used by side filters
          const deletedKey: string = `${column.field}LNG_COMMON_MODEL_FIELD_LABEL_DELETED`;
          const sideFilterValue = currentUserCacheForCurrentPath.sideFilters?.appliedFilters.find((item) => item.filter?.uniqueKey === deletedKey);
          column.filter.value = sideFilterValue?.value !== undefined ?
            sideFilterValue.value :
            value;

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
  private loadSideFilters(currentUserCacheForCurrentPath: ICachedFilterItems): void {
    // no side filters ?
    if (
      !currentUserCacheForCurrentPath.sideFilters ||
      !this.tableV2Component
    ) {
      return;
    }

    // filter outbreak specific data
    currentUserCacheForCurrentPath.sideFilters?.appliedFilters?.forEach((applied) => {
      // nothing to look for ?
      if (!applied.filter?.uniqueKey) {
        return;
      }

      // find filter
      const filter = this.advancedFilters?.find((advancedFilter) => `${advancedFilter.field}${advancedFilter.label}` === applied.filter.uniqueKey);

      // only multi-selects are of interest
      // - IMPORTANT: for now we don't need to handle single selects since they are used only for yes/no dropdowns and follow-ups status
      if (filter?.type === V2AdvancedFilterType.MULTISELECT) {
        // filter out values
        if (Array.isArray(applied.value)) {
          // map
          const selectMap: {
            [id: string]: true
          } = {};
          filter.options?.forEach((option) => {
            selectMap[option.value] = true;
          });

          // get value
          applied.value = applied.value.filter((item) =>
            typeof item !== 'string' ||
            !filter.options ||
            selectMap[item]
          );
        }
      }
    });

    // load side filters
    this.tableV2Component.generateFiltersFromFilterData(new SavedFilterData(currentUserCacheForCurrentPath.sideFilters));
  }

  /**
   * Check if we need to load cached filters if necessary depending on if we already loaded for this route or not
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
  protected loadCachedFilters(): void {
    // disabled saved filters for current user ?
    const authUser: UserModel = this.listHelperService.authDataService.getAuthenticatedUser();
    if (
      authUser.dontCacheFilters ||
      this._disableFilterCaching
    ) {
      // finished
      return;
    }

    // set loaded cached filters value
    // needs to be here, otherwise DONT_LOAD_STATIC_FILTERS_KEY won't work properly, since this method is called twice...
    this._loadedCachedFilterPage = this.getCachedFilterPageKey();

    // did we disable loading cached filters for this page ?
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

  /**
   * Check if a column should be visible depending on outbreak visible/mandatory settings
   */
  protected shouldVisibleMandatoryTableColumnBeVisible(
    visibleMandatoryKey: string,
    prop: string
  ): boolean {
    return this.listHelperService.model.shouldVisibleMandatoryTableColumnBeVisible(
      this.selectedOutbreak,
      visibleMandatoryKey,
      prop
    );
  }
}
