import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { AddressModel } from '../../../core/models/address.model';
import { ListBase } from '../../xt-forms/core';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';

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
    @Input() disabled: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
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
}
