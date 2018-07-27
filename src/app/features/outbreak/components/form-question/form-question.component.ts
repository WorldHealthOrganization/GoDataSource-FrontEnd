import {
    Component,
    EventEmitter,
    Host,
    Inject,
    Input,
    OnInit,
    Optional,
    Output,
    SkipSelf, ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { Observable } from 'rxjs/Observable';
import { AnswerModel } from '../../../../core/models/answer.model';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { GroupBase } from '../../../../shared/xt-forms/core';
import { QuestionModel } from '../../../../core/models/question.model';
import * as _ from 'lodash';
import { FormAnswerListComponent } from '../form-answer-list/form-answer-list.component';

@Component({
    selector: 'app-form-question',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-question.component.html',
    styleUrls: ['./form-question.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormQuestionComponent,
        multi: true
    }]
})
export class FormQuestionComponent extends GroupBase<QuestionModel> implements OnInit {

    @ViewChild(FormAnswerListComponent) answersList: FormAnswerListComponent;

    @Input() disabled: boolean = false;
    @Input() required: boolean = false;

    @Input() displayRemove: boolean = true;
    @Input() viewOnly: string;
    @Input() title: string;
    @Input() name: string;
    @Output() deleteQuestion = new EventEmitter();
    @Output() duplicateQuestion = new EventEmitter();

    // list of form-answer types
    answerTypesList$: Observable<any[]>;
    // list of categories for a form-question
    questionCategoriesList$: Observable<any[]>;
    // list of answer types
    answerTypes: any = Constants.ANSWER_TYPES;
    // temporary list of answers
    private _tempAnswers: AnswerModel[] = [];


    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        this.answerTypesList$ = this.genericDataService.getAnswerTypesList();
        this.questionCategoriesList$ = this.genericDataService.getQuestionCategoriesList();

        // init value
        this.value = new QuestionModel(this.value);
    }

    /**
     * Question Model
     */
    get question(): QuestionModel {
        return this.value;
    }

    /**
     * Duplicates a form-question
     */
    duplicate() {
        this.duplicateQuestion.emit(this.question);
    }

    /**
     * Delete a form-question
     */
    delete() {
        this.deleteQuestion.emit(this.question);
    }

    /**
     * Handle changing the form-answer type
     * If Free Text than remove current answers.
     * If multiple options, then add an empty form-answer if there are no answers
     */
    answerTypeChanged() {
        // if the user change answer type to free text, then save in a temp variable the values.
        if (!_.isEmpty(this.question.answers) && (this.question.answerType === this.answerTypes.FREE_TEXT.value)) {
            this._tempAnswers = _.cloneDeep(this.question.answers);
            // call delete on the child components for validation
            const self = this;
            _.forEach(self.question.answers, function (answer, keyAnswer) {
                if (self.answersList) {
                    self.answersList.delete(keyAnswer, true);
                }
            });
            this.question.answers = [];
        }
        // if the user change answer type to multiple, then automatically push one empty answer or populate from temp.
        if (this.question.answerType === this.answerTypes.MULTIPLE_OPTIONS.value
            || this.question.answerType === this.answerTypes.SINGLE_SELECTION.value) {

            if (_.isEmpty(this.question.answers)) {
                if (_.isEmpty(this._tempAnswers)) {
                    this.question.answers.push(new AnswerModel());
                } else {
                    this.question.answers = this._tempAnswers;
                }
            }
        }

        // call onChange from GroupBase
        setTimeout(() => {
            this.onChange();
        });
    }

    /**
     * Handle two way binding setup for translate items - when changing the value
     * @param {string} key
     * @param {string} value
     */
    onChangeBind(key: string, value: any) {
        // "bind value"
        this.value[key] = value;

        // value changed
        this.onChange();
    }

    /**
     * Handle two way binding setup for translate items - at initialization - to not loose values in case they are not changed
     * @param {string} key
     * @param {string} value
     */
    onInitializeBind(key: string, value: any) {
        // "bind value"
        this.value[key] = value;
    }

}
