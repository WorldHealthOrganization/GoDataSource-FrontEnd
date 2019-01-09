import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { GroupFilteredValue, ListBase } from '../../xt-forms/core';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { Moment } from 'moment';
import { CaseCenterDateRangeModel } from '../../../core/models/case-center-date-range.model';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-case-center-daterange-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-case-center-daterange-list.component.html',
    styleUrls: ['./form-case-center-daterange-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormCaseCenterDaterangeListComponent,
        multi: true
    }]
})
export class FormCaseCenterDaterangeListComponent extends ListBase<CaseCenterDateRangeModel> implements OnInit, GroupFilteredValue<any[]> {
    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() fromTooltip: string;
    @Input() toTooltip: string;
    @Input() centerNameLabel: string;
    @Input() centerNameTooltip: string;

    @Input() componentTitle: string;

    @Input() minDate: Moment;

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
    protected generateNewItem(): CaseCenterDateRangeModel {
        return new CaseCenterDateRangeModel();
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

    /**
     * Get Filtered Value
     */
    getFilteredValue(): any[] {
        return this.value ?
            _.map(
                this.value,
                (item: CaseCenterDateRangeModel) => {
                    return new CaseCenterDateRangeModel(item).sanitize();
                }
            ) :
            this.value;
    }
}
