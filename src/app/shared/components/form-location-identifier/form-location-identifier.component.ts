import { Component, Host, Inject, Input, Optional, SkipSelf } from '@angular/core';
import { LocationIdentifierModel } from '../../../core/models/location-identifier.model';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GroupBase } from '../../xt-forms/core/group-base';

@Component({
    selector: 'app-form-location-identifier',
    templateUrl: './form-location-identifier.component.html',
    styleUrls: ['./form-location-identifier.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormLocationIdentifierComponent,
        multi: true
    }]
})
export class FormLocationIdentifierComponent extends GroupBase<LocationIdentifierModel> {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() codePlaceholder: string;
    @Input() descriptionPlaceholder: string;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    get identifierModel(): LocationIdentifierModel {
        return this.value ? this.value : ({} as LocationIdentifierModel);
    }
}
