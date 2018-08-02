import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ListBase } from '../../../../shared/xt-forms/core/index';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { QuestionModel } from '../../../../core/models/question.model';
import { DialogAnswerButton } from '../../../../shared/components';
import { Subscriber } from 'rxjs/Subscriber';
import { DomService } from '../../../../core/services/helper/dom.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { Observable } from 'rxjs/Observable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-form-question-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-question-list.component.html',
    styleUrls: ['./form-question-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormQuestionListComponent,
        multi: true
    }]
})
export class FormQuestionListComponent extends ListBase<QuestionModel> implements OnInit {
    @Input() viewOnly: boolean = false;
    @Input() variableReadOnly: boolean = false;

    // list of form-answer types
    answerTypesList$: Observable<any[]>;

    // list of categories for a form-question
    questionCategoriesList$: Observable<any[]>;

    // list of answer types
    answerTypes: any = Constants.ANSWER_TYPES;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private genericDataService: GenericDataService,
        private dialogService: DialogService,
        private domService: DomService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        this.answerTypesList$ = this.genericDataService.getAnswerTypesList();
        this.questionCategoriesList$ = this.genericDataService.getQuestionCategoriesList();

        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        observer.next();
                    }
                });
        });
    }

    protected generateNewItem(): QuestionModel {
        return new QuestionModel();
    }

    /**
     * Adds a new form-question
     */
    addNewQuestion() {
        super.add(this.generateNewItem());
        this.domService.scrollItemIntoView('app-form-question-list');
    }

    /**
     * Duplicate form-question
     */
    duplicateQuestion(question: QuestionModel) {
        super.clone(question);
        this.domService.scrollItemIntoView('app-form-question-list');
    }

    /**
     * Handle two way binding setup for translate items - when changing the value
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
