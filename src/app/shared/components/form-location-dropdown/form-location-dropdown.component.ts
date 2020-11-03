import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Input, Output, EventEmitter, HostBinding, ViewChild, OnDestroy } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBaseFailure, GroupBase } from '../../xt-forms/core';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import { HierarchicalLocationModel } from '../../../core/models/hierarchical-location.model';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { Subject ,  Subscription } from 'rxjs';
import { ErrorMessage } from '../../xt-forms/core/error-message';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { NgOption, NgSelectComponent } from '@ng-select/ng-select';
import { catchError, debounceTime, share } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Moment } from 'moment';
import * as moment from 'moment';
import { Observable } from 'rxjs/internal/Observable';
import { of } from 'rxjs/internal/observable/of';
import { Subscriber } from 'rxjs/internal-compatibility';

export class LocationAutoItem {
    constructor(
        public id: string,
        public label: string,
        public level: number,
        public disabled: boolean = false,
        public geoLocation: {
            lat: number,
            lng: number
        } = null
    ) {}
}

@Component({
    selector: 'app-form-location-dropdown',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-location-dropdown.component.html',
    styleUrls: ['./form-location-dropdown.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormLocationDropdownComponent,
        multi: true
    }]
})
export class FormLocationDropdownComponent
    extends GroupBase<string | string[]>
    implements OnInit, OnDestroy {
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

    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() multiple: boolean = false;
    @Input() placeholder: string = '';
    @Input() loadingText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_LOADING_TEXT';
    @Input() typeToSearchText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_TYPE_TO_SEARCH_TEXT';
    @Input() minimumSearchLength: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_MINIMUM_SEARCH_LENGTH';
    @Input() appendTo: string = 'body';
    private _notFoundText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_NO_ITEMS_FOUND_TEXT';
    currentNotFoundText: string = this._notFoundText;
    notFoundTextData = {
        minLength: FormLocationDropdownComponent.MIN_SEARCH_LENGTH
    };
    @Input() set notFoundText(notFoundText: string) {
        this._notFoundText = notFoundText;
        this.currentNotFoundText = this._notFoundText;
    }
    get notFoundText(): string {
        return this._notFoundText;
    }
    @Input() useOutbreakLocations: boolean = false;

    @Output() itemChanged = new EventEmitter<LocationAutoItem | undefined | LocationAutoItem[]>();
    @Output() locationsLoaded = new EventEmitter<LocationAutoItem[]>();

    @HostBinding('class.form-element-host') isFormElement = true;

    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    @ViewChild('locationHandler') locationHandler: NgSelectComponent;

    locationItems: LocationAutoItem[];

    locationLoading: boolean = false;
    locationInput$: Subject<string> = new Subject<string>();

    // selected Outbreak id
    outbreakId: string;

    // used to filter &
    // to reduce quantity of data retrieved from api since some requests might return a huge amount of data
    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    previousSubscription: Subscription;

    needToRetrieveBackData: boolean = false;

    outbreakSubscriber: Subscription;

    // language subscription
    private languageSubscription: Subscription;

    /**
     * Do a request or retrieve it from cache if it didn't expire
     * @param methodKey
     * @param outbreakId [Optional]
     * @param method
     */
    static doRequestOrGetFromCache(
        methodKey: string,
        queryBuilder: RequestQueryBuilder,
        outbreakId: string,
        service: LocationDataService | OutbreakDataService,
        snackbarService: SnackbarService
    ): Observable<HierarchicalLocationModel[]> {
        // remove older cached items
        _.each(
            FormLocationDropdownComponent.CACHE,
            (items, localMethodKey) => {
                _.each(
                    items,
                    (cached, localCacheKey) => {
                        if (moment().diff(cached.createdAt) >= FormLocationDropdownComponent.INVALIDATE_CACHE_AFTER_N_MS) {
                            delete FormLocationDropdownComponent.CACHE[localMethodKey][localCacheKey];
                        }
                    }
                );
            }
        );

        // check if we have a request cached for this query
        const cacheKey: string = queryBuilder.buildQuery();
        if (
            !FormLocationDropdownComponent.CACHE[methodKey] ||
            !FormLocationDropdownComponent.CACHE[methodKey][cacheKey]
        ) {
            // init what needs to be initialized
            if (!FormLocationDropdownComponent.CACHE[methodKey]) {
                FormLocationDropdownComponent.CACHE[methodKey] = {};
            }

            // determine execute observer
            const executeObserver$ = outbreakId ?
                service[methodKey](outbreakId, queryBuilder) :
                service[methodKey](queryBuilder);

            // cache item
            FormLocationDropdownComponent.CACHE[methodKey][cacheKey] = {
                createdAt: moment(),
                executeObserver$: executeObserver$,
                data: null,
                observer$: new Observable<HierarchicalLocationModel[]>((function (
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
                                        snackbarService.showApiError(err);
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
                })(FormLocationDropdownComponent.CACHE, methodKey, cacheKey)).pipe(share())
            };
        }

        // finished
        return FormLocationDropdownComponent.CACHE[methodKey][cacheKey].data !== null ?
            of(FormLocationDropdownComponent.CACHE[methodKey][cacheKey].data) :
            FormLocationDropdownComponent.CACHE[methodKey][cacheKey].observer$;
    }

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService,
        private outbreakDataService: OutbreakDataService
    ) {
        super(controlContainer, validators, asyncValidators);

        // on language change..we need to translate again the token
        this.languageSubscription = this.i18nService.languageChangedEvent
            .subscribe(() => {
                this.tooltip = this._tooltipToken;
            });
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        if (this.useOutbreakLocations) {
            // get selected outbreak
            this.outbreakSubscriber = this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((outbreak) => {
                    if (outbreak && outbreak.id) {
                        this.outbreakId = outbreak.id;

                        // wait for all binding to take effect
                        setTimeout(() => {
                            // bring only top location when empty search
                            this.addLocationCondition();

                            // retrieve data
                            this.refreshLocationList();
                        });
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

        // handle server side search
        this.locationInput$
            .pipe(
                debounceTime(500)
            )
            .subscribe((searchTerm: string) => {
                // display loading while getting data
                this.locationLoading = true;

                // clear input
                this.currentNotFoundText = this.notFoundText;
                this.locationItems = [];

                // don't search if we entered at least on character but less than minimum search
                if (
                    searchTerm &&
                    searchTerm.length < FormLocationDropdownComponent.MIN_SEARCH_LENGTH
                ) {
                    // finished loading - since we wont retrieve anything
                    this.currentNotFoundText = this.minimumSearchLength;
                    this.locationLoading = false;

                    // finished
                    return;
                }

                // filter list
                this.needToRetrieveBackData = true;
                if (searchTerm) {
                    this.queryBuilder.filter
                        .remove('parentLocationId')
                        .remove('id')
                        .byTextMultipleProperties(['name', 'synonyms'], searchTerm)
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
            });
    }

    /**
     * Release resources
     */
    ngOnDestroy(): void {
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }

        // stop previous subscription
        if (this.previousSubscription) {
            this.previousSubscription.unsubscribe();
            this.previousSubscription = null;
        }

        if (this.languageSubscription) {
            this.languageSubscription.unsubscribe();
            this.languageSubscription = null;
        }
    }

    /**
     * Add location condition
     */
    addLocationCondition() {
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
        } else if (this.multiple) {
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

    /**
     * Refresh Location List
     */
    refreshLocationList() {
        // retrieve locations observer
        // use filter to reduce quantity of data retrieved from api to only what we need
        const locationsList$ = this.useOutbreakLocations && this.outbreakId ?
            FormLocationDropdownComponent.doRequestOrGetFromCache(
                'getOutbreakLocationsHierarchicalList',
                this.queryBuilder,
                this.outbreakId,
                this.outbreakDataService,
                this.snackbarService
            ) :
            FormLocationDropdownComponent.doRequestOrGetFromCache(
                'getLocationsHierarchicalList',
                this.queryBuilder,
                undefined,
                this.locationDataService,
                this.snackbarService
            );

        // retrieve hierarchic location list
        const request = locationsList$
            .subscribe((hierarchicalLocation: HierarchicalLocationModel[]) => {
                // list to check
                const locationItems = [];
                const listToCheck = _.clone(hierarchicalLocation);
                const levels: { [locationId: string]: number } = {};
                while (listToCheck.length > 0) {
                    // get first item that we need to check and remove it from array
                    const currentItem: HierarchicalLocationModel = listToCheck.shift();

                    // create auto complete item
                    const locationAI = new LocationAutoItem(
                        currentItem.location.id,
                        currentItem.location.name + (
                            !_.isEmpty(currentItem.location.synonyms) ?
                                ` ( ${currentItem.location.synonymsAsString} )` :
                                ''
                        ),
                        currentItem.location.parentLocationId ?
                            levels[currentItem.location.parentLocationId] + 1 :
                            0,
                        !currentItem.location.active || currentItem.location.disabled,
                        currentItem.location.geoLocation
                    );

                    // add item to list
                    locationItems.push(locationAI);

                    // set level
                    levels[locationAI.id] = locationAI.level;

                    // add children to check list
                    listToCheck.unshift(...(currentItem.children ? currentItem.children : []));
                }

                // finished loading
                this.locationLoading = false;

                // set locations
                this.locationItems = locationItems;
                this.locationsLoaded.emit(this.locationItems);
            });

        // stop previous subscription
        if (this.previousSubscription) {
            this.previousSubscription.unsubscribe();
            this.previousSubscription = null;
        }

        // set the new subscription
        this.previousSubscription = request;
    }

    /**
     * Call both add condition & refresh
     */
    addLocationConditionAndRefresh() {
        // bring location data
        this.addLocationCondition();

        // refresh locations
        this.locationLoading = true;
        this.needToRetrieveBackData = false;
        this.refreshLocationList();
    }

    /**
     * New location selected
     * @param value
     */
    writeValue(value: string) {
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
     * Touch location component
     */
    onBlur() {
        // touch group
        this.touch();

        // add location condition & refresh
        if (this.needToRetrieveBackData) {
            this.addLocationConditionAndRefresh();
        }
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange(validateGroup: boolean = true) {
        // parent
        super.onChange(validateGroup);

        // since we might want to select a child but we don't know its name we need to select parent first
        // displaying the list again is a bit ugly, so after selecting the country they need to press the down key which will display the list again with its children this time
        // tooltip included
        this.addLocationConditionAndRefresh();
    }

    /**
     * Failure messages
     */
    get ngFailureMessages(): ElementBaseFailure[] {
        const errors = this.groupForm && this.groupForm.controls[this.name] ?
            this.groupForm.controls[this.name].errors :
            null;
        return errors ?
            _.map(
                _.keys(errors),
                (errorKey) => new ErrorMessage(null, errorKey).getMessage()
            ) :
            [];
    }

    /**
     * Get invalid state of the ng component
     */
    get ngInvalid(): boolean {
        return this.groupForm && this.groupForm.controls[this.name] ?
            this.groupForm.controls[this.name].invalid :
            false;
    }

    /**
     * Item changed
     * @param item
     */
    triggerItemChanged(item: LocationAutoItem) {
        // on change handler
        this.onChange();

        // trigger event listeners
        setTimeout(() => {
            this.itemChanged.emit(item);
        });
    }

    /**
     * Unselect value
     */
    clear() {
        _.each(this.locationHandler.selectedItems, (opt: NgOption) => {
            this.locationHandler.unselect(opt);
        });
    }

    /**
     * Touch and trigger search
     */
    public touchAndTriggerSearch() {
        // touch
        this.touch();

        // trigger search if necessary
        if (_.isEmpty(this.locationItems)) {
            this.addLocationConditionAndRefresh();
        }
    }
}
