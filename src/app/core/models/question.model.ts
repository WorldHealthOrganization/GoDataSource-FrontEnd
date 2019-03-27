// tslint:disable:no-use-before-declare
import * as _ from 'lodash';
import { Constants } from './constants';

export interface IAnswerData {
    date?: string;
    value: any;
}

export class AnswerModel {
    label: string;
    value: string;
    alert: boolean;
    order: number = 1;
    additionalQuestions: QuestionModel[];

    // new flag - DON'T save this field
    new: boolean;
    clone: boolean;

    constructor(
        data = null,
        keepFlags: boolean = false
    ) {
        this.label = _.get(data, 'label');
        this.value = _.get(data, 'value');
        this.alert = _.get(data, 'alert');
        this.order = _.get(data, 'order');

        if (keepFlags) {
            this.new = _.get(data, 'new');
            this.clone = _.get(data, 'clone');
        }

        this.additionalQuestions = _.map(
            _.get(data, 'additionalQuestions', null),
            (lData: any) => {
                return new QuestionModel(lData, keepFlags);
            });
        if (_.isEmpty(this.additionalQuestions)) {
            this.additionalQuestions = null;
        }
    }

    get additionalQuestionsShow(): boolean {
        return this.additionalQuestions !== null;
    }
    set additionalQuestionsShow(value: boolean) {
        if (value) {
            if (_.isEmpty(this.additionalQuestions)) {
                this.additionalQuestions = [];
            }
        } else {
            this.additionalQuestions = null;
        }
    }
}

export class QuestionModel {
    text: string;
    variable: string;
    category: string;
    required: boolean;
    inactive: boolean;
    multiAnswer: boolean;
    order: number = 1;
    answerType: string;
    answers: AnswerModel[];

    // new flag - DON'T save this field
    new: boolean;
    clone: boolean;
    uuid: string;

    constructor(
        data = null,
        keepFlags: boolean = false
    ) {
        this.text = _.get(data, 'text');
        this.variable = _.get(data, 'variable');
        this.category = _.get(data, 'category');
        this.required = _.get(data, 'required');
        this.inactive = _.get(data, 'inactive');
        this.multiAnswer = _.get(data, 'multiAnswer');
        this.order = _.get(data, 'order');
        this.answerType = _.get(data, 'answerType');

        if (keepFlags) {
            this.new = _.get(data, 'new');
            this.clone = _.get(data, 'clone');
            this.uuid = _.get(data, 'uuid');
        }

        this.answers = _.map(
            _.get(data, 'answers', []),
            (lData: any) => {
                return new AnswerModel(lData, keepFlags);
            });
    }

    /**
     * Determine questionnaire alerted answers from a template
     * @param template
     */
    static determineAlertAnswers(
        template: QuestionModel[]
    ): {
        [question_variable: string]: {
            [answer_value: string]: boolean
        }
    } {
        // map alert question answers to object for easy find
        const alertQuestionAnswers: {
            [question_variable: string]: {
                [answer_value: string]: boolean
            }
        } = {};
        const mapQuestions = (questions: QuestionModel[]) => {
            // get alerted answers
            _.each(questions, (question: QuestionModel) => {
                // alert applies only to those questions that have option values
                if (
                    question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
                    question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value
                ) {
                    _.each(question.answers, (answer: AnswerModel) => {
                        // answer alert ?
                        if (answer.alert) {
                            _.set(
                                alertQuestionAnswers,
                                `[${question.variable}][${answer.value}]`,
                                true
                            );
                        }

                        // go through all sub questions
                        if (!_.isEmpty(answer.additionalQuestions)) {
                            mapQuestions(answer.additionalQuestions);
                        }
                    });
                }
            });
        };

        // get alerted answers
        mapQuestions(template);

        // finished
        return alertQuestionAnswers;
    }

    /**
     * Mark question as being new
     */
    markAsNew() {
        // mark question as being new
        this.new = true;

        // mark sub questions as being new
        _.each(this.answers, (answer) => {
            _.each(answer.additionalQuestions, (question) => {
                question.markAsNew();
            });
        });
    }
}
