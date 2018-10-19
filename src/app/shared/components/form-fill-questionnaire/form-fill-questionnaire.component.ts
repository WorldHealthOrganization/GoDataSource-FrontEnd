import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import * as _ from 'lodash';
import { GroupBase } from '../../xt-forms/core';
import { AnswerModel, QuestionModel } from '../../../core/models/question.model';
import { Constants } from '../../../core/models/constants';
import { FileUploader } from 'ng2-file-upload';
import { environment } from '../../../../environments/environment';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'app-form-fill-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-fill-questionnaire.component.html',
    styleUrls: ['./form-fill-questionnaire.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormFillQuestionnaireComponent,
        multi: true
    }]
})
export class FormFillQuestionnaireComponent extends GroupBase<{}> implements OnInit {
    @Input() disabled: boolean = false;

    questionsGroupedByCategory: {
        category: string,
        questions: QuestionModel[]
    }[];

    additionalQuestions: {
        [ variable: string ]: {
            [ answer_value: string ]: QuestionModel[]
        }
    } = {};

    // import constants into template
    Constants = Constants;

    @Input() displayCopyField: boolean = false;
    @Input() displayCopyFieldDescription: string = '';
    @Output() copyValue = new EventEmitter<string>();

    @Input() hideCategories: boolean = false;

    /**
     * File uploader
     */
    uploaders: {
        [questionVariable: string]: FileUploader
    } = {};

    /**
     * Outbreak
     */
    selectedOutbreak: OutbreakModel;

    /**
     * Set question and group them by category
     * @param {QuestionModel[]} questions
     */
    @Input() set questions(questions: QuestionModel[]) {
        // reset additional questions
        this.additionalQuestions = {};

        // group them by category
        this.uploaders = {};
        this.questionsGroupedByCategory = _.chain(questions)
            .groupBy('category')
            .transform((result, questionsData: QuestionModel[], category: string) => {
                // map additional questions
                _.each(questionsData, (question: QuestionModel) => {
                    // add file upload handler if necessary
                    if (question.answerType === Constants.ANSWER_TYPES.FILE_UPLOAD.value) {
                        this.uploaders[question.variable] = new FileUploader({});
                    }

                    // map answers
                    _.each(question.answers, (answer: AnswerModel) => {
                        if (!_.isEmpty(answer.additionalQuestions)) {
                            // answer value should be unique
                            // can't use _.set since we can have dots & square brackets inside strings
                            if (!this.additionalQuestions[question.variable]) {
                                this.additionalQuestions[question.variable] = {};
                            }
                            this.additionalQuestions[question.variable][answer.value] = answer.additionalQuestions;
                        }
                    });
                });

                // sort & add root questions
                result.push({
                    category: category,
                    questions: _.sortBy(questionsData, 'order')
                });
            }, [])
            .value();

        // initialize uploader
        this.initializeUploader();
    }

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService
    ) {
        super(controlContainer, validators, asyncValidators);

        // initialize
        this.value = this.value ? this.value : {};
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
                this.initializeUploader();
            });
    }

    /**
     * Initialize Uploader
     */
    initializeUploader() {
        // do we have outbreak data ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // initialize uploader
        _.each(this.uploaders, (uploader: FileUploader) => {
            uploader.setOptions({
                authToken: this.authDataService.getAuthToken(),
                url: `${environment.apiUrl}/outbreaks/${this.selectedOutbreak.id}/attachments`
            });
            // uploader.options.additionalParameter = {
            //     name: this._model
            // }
        });
    }

    /**
     * Copy value
     * @param property
     */
    triggerCopyValue(property) {
        this.copyValue.emit(property);
    }

    /**
     * Check if we have sub-questions for the selected answers
     * @param question
     * @param selectedAnswers
     */
    hasSubQuestions(question: QuestionModel, selectedAnswers): boolean {
        // nothing was selected
        if (
            _.isEmpty(selectedAnswers) ||
            !this.additionalQuestions ||
            !this.additionalQuestions[question.variable]
        ) {
            return false;
        }

        // convert to array if necessary so we handle both single & multiple selects
        if (!_.isArray(selectedAnswers)) {
            selectedAnswers = [selectedAnswers];
        }

        // determine if we have at least one answer with additional questions
        let hasQuestions: boolean = false;
        _.each(selectedAnswers, (answerValue: string) => {
            if (this.additionalQuestions[question.variable][answerValue]) {
                hasQuestions = true;
                return false;
            }
        });

        // finished
        return hasQuestions;
    }

    /**
     * Child Questions Answers
     * @param question
     * @param selectedAnswers
     */
    subQuestionsAnswer(question: QuestionModel, selectedAnswers): string[] {
        // convert to array if necessary so we handle both single & multiple selects
        if (!_.isArray(selectedAnswers)) {
            selectedAnswers = [selectedAnswers];
        }

        // determine answers with additional questions
        const answers: string[] = [];
        _.each(selectedAnswers, (answerValue: string) => {
            if (this.additionalQuestions[question.variable][answerValue]) {
                answers.push(answerValue);
            }
        });

        // finished
        return answers;
    }

    /**
     * Trigger upload files...
     */
    startUploadFiles(): Observable<void> {
        // #TODO
    }
}
