import * as _ from 'lodash';
import {
    Component, Host, Inject, Input, OnInit, Optional, SkipSelf, ViewChild,
    ViewEncapsulation
} from '@angular/core';
import {
    AbstractControl, ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR,
    NgForm
} from '@angular/forms';
import { ListBase } from '../../xt-forms/core/list-base';
import { QuestionModel } from '../../../core/models/question.model';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../../core/models/constants';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { DomService } from '../../../core/services/helper/dom.service';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { Subscriber } from 'rxjs/Subscriber';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';

@Component({
    selector: 'app-form-sub-question-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-sub-question-list.component.html',
    styleUrls: ['./form-sub-question-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSubQuestionListComponent,
        multi: true
    }]
})
export class FormSubQuestionListComponent extends ListBase<QuestionModel> implements OnInit {
    @Input() viewOnly: boolean = false;
    @Input() variableReadOnly: boolean = false;

    @Input() scrollToQuestion: boolean = true;
    @Input() scrollToQuestionSelector: string = 'app-form-question-list';
    @Input() scrollToQuestionBlock: string = 'end';

    @ViewChild('groupForm') groupForm: NgForm;
    @Input() parentControls: {
        [name: string]: AbstractControl
    }[];

    private _defaultQuestionCategory: string;
    @Input() set defaultQuestionCategory(value: string) {
        this._defaultQuestionCategory = value;
        _.each(this.values, (question: QuestionModel) => {
            question.category = this._defaultQuestionCategory;
        });
    }
    get defaultQuestionCategory(): string {
        return this._defaultQuestionCategory;
    }

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
        private domService: DomService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        this.answerTypesList$ = this.genericDataService.getAnswerTypesList();
        this.questionCategoriesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.QUESTION_CATEGORY);

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
        const q = new QuestionModel();
        if (this.defaultQuestionCategory) {
            q.category = this.defaultQuestionCategory;
        }
        return q;
    }

    /**
     * Adds a new form-question
     */
    addNewQuestion() {
        super.add(this.generateNewItem());

        if (this.scrollToQuestion) {
            this.domService.scrollItemIntoView(
                this.scrollToQuestionSelector,
                this.scrollToQuestionBlock
            );
        }
    }

    /**
     * Duplicate form-question
     */
    duplicateQuestion(question: QuestionModel) {
        super.clone(question);

        if (this.scrollToQuestion) {
            this.domService.scrollItemIntoView(
                this.scrollToQuestionSelector,
                this.scrollToQuestionBlock
            );
        }
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

    /**
     * Clear Answers if free text is selected
     */
    onChangeAnswerType(index: number) {
        // check if free text is selected
        if (
            this.values[index] &&
            (this.values[index] as QuestionModel).answerType !== Constants.ANSWER_TYPES.SINGLE_SELECTION.value &&
            (this.values[index] as QuestionModel).answerType !== Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value
        ) {
            // clear answers
            (this.values[index] as QuestionModel).answers = [];
        }

        // call parent
        setTimeout(() => {
            super.onChange();
        });
    }

    /**
     * List of sub questions list controls
     */
    public getQuestionsListControls(): { [ name: string ]: AbstractControl } {
        if (!this.groupForm) {
            return {};
        }

        // retrieve questions controls
        return this.groupForm.controls;
    }
}
