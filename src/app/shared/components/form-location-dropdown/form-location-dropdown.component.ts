import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import { HierarchicalLocationModel } from '../../../core/models/hierarchical-location.model';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import 'rxjs/add/operator/debounceTime';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/debounceTime';
import { Subscription } from 'rxjs/Subscription';
import { ErrorMessage } from '../../xt-forms/core/error-message';
import { I18nService } from '../../../core/services/helper/i18n.service';

class LocationAutoItem {
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
export class FormLocationDropdownComponent extends GroupBase<string | string[]> implements OnInit {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;
    @Input() multiple: boolean = false;
    @Input() placeholder: string = '';
    @Input() loadingText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_LOADING_TEXT';
    @Input() typeToSearchText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_TYPE_TO_SEARCH_TEXT';
    @Input() notFoundText: string = 'LNG_SEARCH_LOCATIONS_AUTO_COMPLETE_NO_ITEMS_FOUND_TEXT';

    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltip = tooltip ? this.i18nService.instant(tooltip) : tooltip;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    locationItems: LocationAutoItem[];

    locationLoading: boolean = false;
    locationInput$: Subject<string> = new Subject<string>();

    queryBuilder: RequestQueryBuilder = new RequestQueryBuilder();

    previousSubscription: Subscription;

    needToRetrieveBackData: boolean = false;

    @Output() itemChanged = new EventEmitter<LocationAutoItem | undefined | LocationAutoItem[]>();
    @Output() locationsLoaded = new EventEmitter<LocationAutoItem[]>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // handle server side search
        this.locationInput$
            .debounceTime(500)
            .subscribe((searchTerm: string) => {
                // display loading while getting data
                this.locationLoading = true;
                this.needToRetrieveBackData = true;

                // filter list
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
     * Add location condition
     */
    addLocationCondition() {
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
            .where({
                [this.value ? 'id' : 'parentLocationId']: {
                    eq: this.value ? this.value : null
                }}
            ).flag(
                'includeChildren',
            this.value ? true : false
            );
    }

    /**
     * Refresh Location List
     */
    refreshLocationList() {
        // retrieve hierarchic location list
        const request = this.locationDataService
            .getLocationsHierarchicalList(this.queryBuilder)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
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
                        !currentItem.location.active,
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
        super.touch();

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
    get ngFailureMessages(): string[] {
        const errors = this.groupForm && this.groupForm.controls[this.name] ?
            this.groupForm.controls[this.name].errors :
            null;
        return errors ?
            _.map(_.keys(errors), (errorKey) => new ErrorMessage(null, errorKey).getMessage()) :
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
        this.itemChanged.emit(item);
    }
}
