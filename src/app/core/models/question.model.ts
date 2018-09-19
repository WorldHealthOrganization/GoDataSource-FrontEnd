// tslint:disable:no-use-before-declare
import * as _ from 'lodash';

export class AnswerModel {
    new: boolean | true;
    label: string;
    value: string;
    alert: boolean;
    additionalQuestions: QuestionModel[];

    constructor(data = null) {
        this.new = _.get(data, 'new', true);
        this.label = _.get(data, 'label');
        this.value = _.get(data, 'value');
        this.alert = _.get(data, 'alert');

        this.additionalQuestions = _.map(
            _.get(data, 'additionalQuestions', null),
            (lData: any) => {
                return new QuestionModel(lData);
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
    new: boolean;
    text: string;
    variable: string;
    category: string;
    required: boolean;
    order: number;
    answerType: string;
    answers: AnswerModel[];

    constructor(data = null) {
        this.new = _.get(data, 'new', true);
        this.text = _.get(data, 'text');
        this.variable = _.get(data, 'variable');
        this.category = _.get(data, 'category');
        this.required = _.get(data, 'required');
        this.order = _.get(data, 'order');
        this.answerType = _.get(data, 'answerType');

        this.answers = _.map(
            _.get(data, 'answers', []),
            (lData: any) => {
                return new AnswerModel(lData);
            });
    }
}
