import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Input, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import * as _ from 'lodash';
import { GroupBase } from '../../xt-forms/core';
import { AnswerModel, QuestionModel } from '../../../core/models/question.model';
import { Constants } from '../../../core/models/constants';

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
export class FormFillQuestionnaireComponent extends GroupBase<{}> {
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

    /**
     * Set question and group them by category
     * @param {QuestionModel[]} questions
     */
    @Input() set questions(questions: QuestionModel[]) {
        // reset additional questions
        this.additionalQuestions = {};

        // group them by category
        this.questionsGroupedByCategory = _.chain(questions)
            .groupBy('category')
            .transform((result, questionsData: QuestionModel[], category: string) => {
                // map additional questions
                _.each(questionsData, (question: QuestionModel) => {
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
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);

        // initialize
        this.value = this.value ? this.value : {};
    }

    /**
     * Copy value
     * @param property
     */
    triggerCopyValue(property) {
        this.copyValue.emit(property);
    }

    /**
     * Check if we have sub-questions for teh selected answers
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

        // map answers for each access
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
}
