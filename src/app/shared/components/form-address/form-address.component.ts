import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupBase, GroupFilteredValue } from '../../xt-forms/core';
import { AddressModel } from '../../../core/models/address.model';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Moment } from 'moment';
import { LocationAutoItem } from '../form-location-dropdown/form-location-dropdown.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import * as moment from 'moment';

@Component({
    selector: 'app-form-address',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-address.component.html',
    styleUrls: ['./form-address.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAddressComponent,
        multi: true
    }]
})
export class FormAddressComponent extends GroupBase<AddressModel> implements OnInit, GroupFilteredValue<any> {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() componentTitle: string;

    addressTypes$: Observable<any[]>;

    @Input() displayCopyField: boolean = false;
    @Input() displayCopyFieldDescription: string;
    @Output() copyValue = new EventEmitter<string>();

    serverToday: Moment = moment();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        // init value
        this.value = new AddressModel(this.value);

        this.addressTypes$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.ADDRESS_TYPE);
    }

    /**
     * Address Model
     */
    get address(): AddressModel {
        return this.value ? this.value : {} as AddressModel;
    }

    /**
     * Copy value
     * @param property
     */
    triggerCopyValue(property) {
        this.copyValue.emit(property);
    }

    /**
     * Get Filtered Value
     */
    getFilteredValue(): any {
        // strip unnecessary data
        return this.value ?
            new AddressModel(this.address).sanitize() :
            this.value;
    }

    /**
     * Location Changed
     * @param data
     */
    locationChanged(data: LocationAutoItem) {
        if (
            data &&
            data.geoLocation &&
            data.geoLocation.lat &&
            data.geoLocation.lng
        ) {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REPLACE_GEOLOCATION')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.address.geoLocation.lat = data.geoLocation.lat;
                        this.address.geoLocation.lng = data.geoLocation.lng;
                    }
                });
        }
    }

    /**
     * Update Lat Lng
     * @param property
     * @param data
     */
    onChangeLatLng(
        property: string,
        value
    ) {
        _.set(
            this.address,
            `geoLocation.${property}`,
            value ? parseFloat(value) : undefined
        );

        // on change trigger
        setTimeout(() => {
            super.onChange();
        });
    }

    /**
     * Check if lat & lng are required
     */
    isLatLngRequired(value: any) {
        return _.isString(value) ?
            value.length > 0 : (
                value || value === 0
            );
    }
}
