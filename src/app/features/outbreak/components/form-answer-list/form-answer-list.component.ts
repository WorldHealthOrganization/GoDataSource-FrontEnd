import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ListBase } from '../../../../shared/xt-forms/core/index';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { AnswerModel } from '../../../../core/models/answer.model';
import { DialogAnswerButton } from '../../../../shared/components';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';

@Component({
    selector: 'app-form-answer-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-answer-list.component.html',
    styleUrls: ['./form-answer-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAnswerListComponent,
        multi: true
    }]
})
export class FormAnswerListComponent extends ListBase<AnswerModel> implements OnInit {
    @Input() viewOnly: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    protected generateNewItem(): AnswerModel {
        return new AnswerModel();
    }

    /**
     * Adds a new form-answer
     */
    addAnswer() {
        // push a new empty form-answer to the array of answers for that form-question
        super.add(this.generateNewItem());
    }

    ngOnInit() {
        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION_ANSWER')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }

    /**
     * Handle two way binding setup for translate items
     * @param {string} key
     * @param {string} value
     */
    onChangeBind(index: number, key: string, value: any) {
        // "bind value"
        this.values[index][key] = value;

        // value changed
        this.onChange();
    }

    /**
     * Handle two way binding setup for translate items - at initialization - to not loose values in case they are not changed
     * @param {string} key
     * @param {string} value
     */
    onInitializeBind(index: number, key: string, value: any) {
        // "bind value"
        this.values[index][key] = value;
    }
}
