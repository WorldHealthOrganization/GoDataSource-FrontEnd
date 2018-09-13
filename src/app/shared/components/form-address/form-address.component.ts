import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { GroupBase } from '../../xt-forms/core';
import { AddressModel } from '../../../core/models/address.model';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { Observable } from '../../../../../node_modules/rxjs/Observable';
import { Constants } from '../../../core/models/constants';

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

    addressTypes$: Observable<any[]>;

    Constants = Constants;

    @Input() displayCopyField: boolean = false;
    @Input() displayCopyFieldDescription: string = '';
    @Output() copyValue = new EventEmitter<string>();

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private referenceDataDataService: ReferenceDataDataService
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
}
