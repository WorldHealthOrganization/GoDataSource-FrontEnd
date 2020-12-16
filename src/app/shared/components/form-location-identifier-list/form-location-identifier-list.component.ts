import { Component, Host, Inject, Input, Optional, SkipSelf } from '@angular/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListBase } from '../../xt-forms/core/list-base';
import { LocationIdentifierModel } from '../../../core/models/location-identifier.model';

@Component({
    selector: 'app-form-location-identifier-list',
    templateUrl: './form-location-identifier-list.component.html',
    styleUrls: ['./form-location-identifier-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormLocationIdentifierListComponent,
        multi: true
    }]
})
export class FormLocationIdentifierListComponent extends ListBase<LocationIdentifierModel> {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Create new item
     */
    protected generateNewItem(): LocationIdentifierModel {
        return new LocationIdentifierModel();
    }
}
