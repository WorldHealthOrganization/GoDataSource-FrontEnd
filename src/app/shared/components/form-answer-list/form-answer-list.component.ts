import { Component, Host, Inject, Input, OnInit, Optional, QueryList, SkipSelf, ViewChildren, ViewEncapsulation } from '@angular/core';
import { AbstractControl, ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ListBase } from '../../xt-forms/core/list-base';
import { AnswerModel } from '../../../core/models/question.model';
import { FormSubQuestionListComponent } from '../form-sub-question-list/form-sub-question-list.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import * as _ from 'lodash';

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

    @Input() variableReadOnly: boolean = false;
    @Input() disableAdditionalQuestions: boolean = false;
    @Input() parentControls: {
        [name: string]: AbstractControl
    }[];

    @Input() defaultQuestionCategory: string;

    @ViewChildren(FormSubQuestionListComponent) questionLists: QueryList<FormSubQuestionListComponent>;

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

    /**
     * List of sub questions list controls
     */
    public getQuestionsListControls(): { [ name: string ]: AbstractControl } {
        if (
            !this.questionLists ||
            this.questionLists.length < 1
        ) {
            return {};
        }

        // retrieve questions controls
        const controls: { [ name: string ]: AbstractControl } = {};
        let index: number = 0;
        this.questionLists.forEach((questionsList: FormSubQuestionListComponent) => {
            const localControls = questionsList.getQuestionsListControls();
            _.each(localControls, (ctrl: AbstractControl, name: string) => {
                if (/\]\[variable\]$/.test(name)) {
                    controls[`[${index++}][variable]`] = ctrl;
                }
            });
        });

        // finished
        return controls;
    }
}
