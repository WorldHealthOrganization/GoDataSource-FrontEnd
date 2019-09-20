import { Component, Host, Inject, Input, OnInit, Optional, SkipSelf, ViewEncapsulation } from '@angular/core';
import { ListBase } from '../../xt-forms/core/list-base';
import { VaccineModel } from '../../../core/models/vaccine.model';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { Observable, Subscriber } from 'rxjs/index';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { Moment, moment } from '../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-form-vaccines-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-vaccines-list.component.html',
    styleUrls: ['./form-vaccines-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormVaccinesListComponent,
        multi: true
    }]
})
export class FormVaccinesListComponent extends ListBase<VaccineModel> implements OnInit {

    @Input() required: boolean = false;
    @Input() disabled: boolean = false;

    serverToday: Moment = moment();

    vaccinesList$: Observable<any[]>;
    vaccinesStatusList$: Observable<any[]>;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Create new item
     */
    protected generateNewItem(): VaccineModel {
        return new VaccineModel();
    }

    ngOnInit() {
        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_VACCINE')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });

        this.vaccinesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES);
        this.vaccinesStatusList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.VACCINES_STATUS);

    }

}
