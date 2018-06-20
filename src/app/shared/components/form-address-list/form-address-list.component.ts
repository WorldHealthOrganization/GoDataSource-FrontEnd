import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { AddressModel } from '../../../core/models/address.model';
import { ListBase } from '../../xt-forms/core';


@Component({
    selector: 'app-form-address-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-address-list.component.html',
    styleUrls: ['./form-address-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAddressListComponent,
        multi: true
    }]
})
export class FormAddressListComponent extends ListBase<AddressModel> implements OnInit {
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        this.removeConfirmMsg = 'Are you sure you want to delete this address?';
    }
}
