import { AppFormBaseV2 } from './app-form-base-v2';
import { Moment } from 'moment';
import { Observable } from 'rxjs/internal/Observable';
import { HierarchicalLocationModel } from '../../../core/models/hierarchical-location.model';
import { ChangeDetectorRef, Directive, Input, ViewChild } from '@angular/core';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { Subscription, throwError } from 'rxjs';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Subscriber } from 'rxjs/internal-compatibility';
import { catchError, share } from 'rxjs/operators';
import { of } from 'rxjs/internal/observable/of';
import { ControlContainer } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

/**
 * Location
 */
export interface ILocation {
  id: string;
  label: string;
  level: number;
  disabled: boolean;
  geoLocation: {
    lat: number,
    lng: number
  };
  parent: () => ILocation
}

/**
 * Location base
 */
@Directive()
export abstract class AppFormLocationBaseV2<T>
  extends AppFormBaseV2<T> {

  // handles request cache..so we don't do the same request 100 times...
  static readonly MIN_SEARCH_LENGTH = 3;
  static readonly INVALIDATE_CACHE_AFTER_N_MS = 120000; // 2 minutes
  static CACHE: {
    [methodKey: string]: {
      [cacheKey: string]: {
        createdAt: Moment,
        executeObserver$: Observable<HierarchicalLocationModel[]>,
        data: HierarchicalLocationModel[],
        observer$: Observable<HierarchicalLocationModel[]>
      }
    }
  } = {};

  // float label
  @Input() neverFloatLabel: boolean = false;

  // options
  locations: ILocation[];
  protected locationMap: {
    [idLocation: string]: ILocation;
  } = {};

  // selected outbreak
  outbreakId: string;
  @Input() useOutbreakLocations: boolean = false;

  // used to filter &
  // to reduce quantity of data retrieved from api since some requests might return a huge amount of data
  queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

  // used to exclude locations if necessary
  private _excludeLocationsIds: string[];
  private excludeLocationsIdsMap: {
    [locationId: string]: true
  } = {};
  @Input() set excludeLocationsIds(excludeLocationsIds: string[]) {
    // keep track of what was sent
    this._excludeLocationsIds = excludeLocationsIds;

    // map for easy access
    this.excludeLocationsIdsMap = {};
    (this.excludeLocationsIds || []).forEach((locationId) => {
      this.excludeLocationsIdsMap[locationId] = true;
    });
  }
  get excludeLocationsIds(): string[] {
    return this._excludeLocationsIds;
  }

  // subscription
  previousLocationSubscription: Subscription;
  outbreakSubscription: Subscription;

  // search by value
  searchValue: string;

  // retrieving locations ?
  locationLoading: boolean = false;

  // not found & minimum length
  private _minimumSearchLength: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_MINIMUM_SEARCH_LENGTH';
  private _notFoundText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_NO_ITEMS_FOUND_TEXT';
  currentNotFoundText: string = this._notFoundText;
  notFoundTextData = {
    minLength: AppFormLocationBaseV2.MIN_SEARCH_LENGTH
  };

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport', { static: true }) cdkVirtualScrollViewport: CdkVirtualScrollViewport;

  /**
   * Do a request or retrieve it from cache if it didn't expire
   */
  private static doRequestOrGetFromCache(
    methodKey: string,
    queryBuilder: RequestQueryBuilder,
    outbreakId: string,
    service: LocationDataService | OutbreakDataService,
    toastV2Service: ToastV2Service
  ): Observable<HierarchicalLocationModel[]> {
    // remove older cached items
    _.each(
      AppFormLocationBaseV2.CACHE,
      (items, localMethodKey) => {
        _.each(
          items,
          (cached, localCacheKey) => {
            if (moment().diff(cached.createdAt) >= AppFormLocationBaseV2.INVALIDATE_CACHE_AFTER_N_MS) {
              delete AppFormLocationBaseV2.CACHE[localMethodKey][localCacheKey];
            }
          }
        );
      }
    );

    // check if we have a request cached for this query
    const cacheKey: string = queryBuilder.buildQuery();
    if (
      !AppFormLocationBaseV2.CACHE[methodKey] ||
      !AppFormLocationBaseV2.CACHE[methodKey][cacheKey]
    ) {
      // init what needs to be initialized
      if (!AppFormLocationBaseV2.CACHE[methodKey]) {
        AppFormLocationBaseV2.CACHE[methodKey] = {};
      }

      // determine execute observer
      const executeObserver$ = outbreakId ?
        service[methodKey](outbreakId, queryBuilder) :
        service[methodKey](queryBuilder);

      // cache item
      AppFormLocationBaseV2.CACHE[methodKey][cacheKey] = {
        createdAt: moment(),
        executeObserver$: executeObserver$,
        data: null,
        observer$: new Observable<HierarchicalLocationModel[]>((function(
          localCache,
          localMethodKey: string,
          localCacheKey: string
        ) {
          return (observer: Subscriber<HierarchicalLocationModel[]>) => {
            if (
              localCache[localMethodKey] &&
              localCache[localMethodKey][localCacheKey]
            ) {
              // do we have data already ?
              if (localCache[localMethodKey][localCacheKey].data !== null) {
                observer.next(localCache[localMethodKey][localCacheKey].data);
                return;
              }

              // load data
              localCache[localMethodKey][localCacheKey].executeObserver$
                .pipe(
                  catchError((err) => {
                    observer.error(err);
                    observer.complete();
                    toastV2Service.error(err);
                    return throwError(err);
                  })
                )
                .subscribe((data) => {
                  localCache[localMethodKey][localCacheKey].data = data;
                  observer.next(localCache[localMethodKey][localCacheKey].data);
                });
            } else {
              // finished
              observer.next([]);
              observer.complete();
            }
          };
        })(AppFormLocationBaseV2.CACHE, methodKey, cacheKey)).pipe(share())
      };
    }

    // finished
    return AppFormLocationBaseV2.CACHE[methodKey][cacheKey].data !== null ?
      of(AppFormLocationBaseV2.CACHE[methodKey][cacheKey].data) :
      AppFormLocationBaseV2.CACHE[methodKey][cacheKey].observer$;
  }

  // update selected
  abstract updateSelected(emitEvent: boolean): void;

  /**
   * Constructor
   */
  constructor(
    protected multipleSelect: boolean,
    protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected locationDataService: LocationDataService,
    protected outbreakDataService: OutbreakDataService,
    protected toastV2Service: ToastV2Service
  ) {
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );
  }

  /**
   * Component initialized
   */
  onInit(): void {
    // outbreak specific ?
    if (this.useOutbreakLocations) {
      // get selected outbreak
      this.outbreakSubscription = this.outbreakDataService
        .getSelectedOutbreak()
        .subscribe((outbreak) => {
          if (outbreak && outbreak.id) {
            // select outbreak
            this.outbreakId = outbreak.id;

            // bring only top location when empty search
            this.addLocationCondition();

            // retrieve data
            this.refreshLocationList();
          }
        });
    }

    // configure location filter to reduce quantity of data retrieved from api since some requests might return a huge amount of data
    this.queryBuilder.fields(
      'id',
      'name',
      'synonyms',
      'parentLocationId',
      'active',
      'disabled',
      'geoLocation'
    );
  }

  /**
   * Component destroyed
   */
  onDestroy(): void {
    super.onDestroy();

    // stop previous subscription
    if (this.previousLocationSubscription) {
      this.previousLocationSubscription.unsubscribe();
      this.previousLocationSubscription = null;
    }

    // outbreak
    if (this.outbreakSubscription) {
      this.outbreakSubscription.unsubscribe();
      this.outbreakSubscription = null;
    }
  }

  /**
   * New location selected
   */
  writeValue(value: T) {
    // save value
    super.writeValue(value);

    // add location condition & refresh
    // only if we have data, if we don't then we need for user to input something so we don't retrieve the entire list of locations
    // ( not even the top level - top level items are retrieved when empty search string is sent)
    if (value) {
      this.addLocationConditionAndRefresh();
    }
  }

  /**
   * Call both add condition & refresh
   */
  addLocationConditionAndRefresh() {
    // bring location data
    this.addLocationCondition();

    // refresh locations
    this.locationLoading = true;
    this.refreshLocationList();
  }

  /**
   * Refresh Location List
   */
  private refreshLocationList() {
    // retrieve locations observer
    // use filter to reduce quantity of data retrieved from api to only what we need
    const locationsList$ = this.useOutbreakLocations && this.outbreakId ?
      AppFormLocationBaseV2.doRequestOrGetFromCache(
        'getOutbreakLocationsHierarchicalList',
        this.queryBuilder,
        this.outbreakId,
        this.outbreakDataService,
        this.toastV2Service
      ) :
      AppFormLocationBaseV2.doRequestOrGetFromCache(
        'getLocationsHierarchicalList',
        this.queryBuilder,
        undefined,
        this.locationDataService,
        this.toastV2Service
      );

    // stop previous subscription
    if (this.previousLocationSubscription) {
      this.previousLocationSubscription.unsubscribe();
      this.previousLocationSubscription = null;
    }

    // retrieve hierarchic location list
    this.previousLocationSubscription = locationsList$
      .subscribe((hierarchicalLocation: HierarchicalLocationModel[]) => {
        // list to check
        this.locationMap = {};
        const locationItems: ILocation[] = [];
        const listToCheck = _.clone(hierarchicalLocation);
        const levels: { [locationId: string]: number } = {};
        while (listToCheck.length > 0) {
          // get first item that we need to check and remove it from array
          const currentItem: HierarchicalLocationModel = listToCheck.shift();

          // if this item is excluded, the don't render it and don't render its children as well
          // children won't be rendered because they are added to render list after the parent
          if (this.excludeLocationsIdsMap[currentItem.location.id]) {
            continue;
          }

          // create auto complete item
          const locationAI: ILocation = {
            id: currentItem.location.id,
            label: currentItem.location.name + (
              !_.isEmpty(currentItem.location.synonyms) ?
                ` ( ${currentItem.location.synonymsAsString} )` :
                ''
            ),
            level: currentItem.location.parentLocationId && levels[currentItem.location.parentLocationId] !== undefined ?
              levels[currentItem.location.parentLocationId] + 1 :
              0,
            disabled: !currentItem.location.active || currentItem.location.disabled,
            geoLocation: currentItem.location.geoLocation,
            parent: () => {
              return currentItem.location.parentLocationId && this.locationMap[currentItem.location.parentLocationId] ?
                this.locationMap[currentItem.location.parentLocationId] :
                null;
            }
          };

          // add item to list
          locationItems.push(locationAI);
          this.locationMap[locationAI.id] = locationAI;

          // set level
          levels[locationAI.id] = locationAI.level;

          // add children to check list
          listToCheck.unshift(...(currentItem.children ? currentItem.children : []));
        }

        // finished loading
        this.locationLoading = false;

        // set locations
        this.locations = locationItems;

        // update selected location
        this.updateSelected(false);

        // re-render
        this.changeDetectorRef.detectChanges();
      });
  }

  /**
   * Search for location
   */
  search(): void {
    // display loading while getting data
    this.locationLoading = true;

    // clear input
    this.currentNotFoundText = this._notFoundText;
    this.locations = [];
    this.locationMap = {};

    // don't search if we entered at least on character but less than minimum search
    if (
      this.searchValue &&
      this.searchValue.length < AppFormLocationBaseV2.MIN_SEARCH_LENGTH
    ) {
      // finished loading - since we won't retrieve anything
      this.currentNotFoundText = this._minimumSearchLength;
      this.locationLoading = false;

      // re-render
      this.changeDetectorRef.detectChanges();

      // finished
      return;
    }

    // re-render
    this.changeDetectorRef.detectChanges();

    // filter list
    if (this.searchValue) {
      this.queryBuilder.filter
        .remove('parentLocationId')
        .remove('id')
        .byTextMultipleProperties(['name', 'synonyms'], this.searchValue)
        .flag(
          'includeChildren',
          true
        );
    } else {
      // bring only top location when empty search
      this.addLocationCondition();
    }

    // retrieve data
    this.refreshLocationList();
  }

  /**
   * Add location condition
   */
  private addLocationCondition() {
    // construct the value filter
    let whereFilter;
    if (_.isEmpty(this.value)) {
      // empty value => selecting only top-level locations
      whereFilter = (this.useOutbreakLocations && this.outbreakId) ?
        null : {
          parentLocationId: {
            eq: null
          }
        };
    } else if (this.multipleSelect) {
      // multi select
      whereFilter = {
        id: {
          inq: this.value
        }
      };
    } else {
      // single select
      whereFilter = {
        id: {
          eq: this.value
        }
      };
    }

    // attach condition
    this.queryBuilder.filter
      .remove('parentLocationId')
      .remove('id')
      .removeCondition({
        or: [{
          name: true
        }, {
          synonyms: true
        }]
      })
      .flag(
        'includeChildren',
        !_.isEmpty(this.value)
      );

    // add condition only if necessary
    if (!_.isEmpty(whereFilter)) {
      this.queryBuilder.filter.where(whereFilter);
    }
  }
}
