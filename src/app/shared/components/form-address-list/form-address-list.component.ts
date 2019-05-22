import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { AddressModel } from '../../../core/models/address.model';
import { GroupFilteredValue, ListBase } from '../../xt-forms/core';
import { Subscriber } from 'rxjs';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import * as _ from 'lodash';

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
export class FormAddressListComponent extends ListBase<AddressModel> implements OnInit, GroupFilteredValue<any[]> {
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() sourceAddress: AddressModel;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Create new item
     */
    protected generateNewItem(): AddressModel {
        return new AddressModel();
    }

    ngOnInit() {
        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ADDRESS')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }

    /**
     * Get Filtered Value
     */
    getFilteredValue(): any[] {
        return this.value ?
            _.map(
                this.value,
                (address: AddressModel) => {
                    return new AddressModel(address).sanitize();
                }
            ) :
            this.value;
    }

    /**
     * Copy parent address
     */
    copyParentAddress(index, addressToCopy: AddressModel) {
        // handle copy item confirmation
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_COPY_PARENT_ENTITY_ADDRESS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.values[index] = new AddressModel(addressToCopy);
                }
        });
    }
}
