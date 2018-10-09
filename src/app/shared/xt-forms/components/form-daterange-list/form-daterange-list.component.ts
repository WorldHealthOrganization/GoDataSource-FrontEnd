import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { DateRangeModel } from '../../../../core/models/date-range.model';
import { ListBase } from '../../core';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer, DialogAnswerButton } from '../../../components/dialog/dialog.component';

@Component({
    selector: 'app-form-daterange-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-daterange-list.component.html',
    styleUrls: ['./form-daterange-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormDaterangeListComponent,
        multi: true
    }]
})
export class FormDaterangeListComponent extends ListBase<DateRangeModel> implements OnInit {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() fromTooltip: string;
    @Input() toTooltip: string;

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
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_DATE_RANGE')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }
}
