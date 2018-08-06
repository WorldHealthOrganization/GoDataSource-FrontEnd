import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { Observable } from 'rxjs/Observable';
import { GroupBase } from '../../xt-forms/core';
import { AddressModel } from '../../../core/models/address.model';
import { LocationModel } from '../../../core/models/location.model';
import { LocationDataService } from '../../../core/services/data/location.data.service';

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
export class FormAddressComponent extends GroupBase<AddressModel> implements OnInit {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    locationsList$: Observable<LocationModel[]>;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private locationDataService: LocationDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Initialize component elements
     */
    ngOnInit() {
        this.locationsList$ = this.locationDataService.getLocationsList();

        // init value
        this.value = new AddressModel(this.value);
    }

    /**
     * Address Model
     */
    get address(): AddressModel {
        return this.value ? this.value : {} as AddressModel;
    }
}
