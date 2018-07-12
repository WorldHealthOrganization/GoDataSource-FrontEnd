import * as _ from 'lodash';
import { AnswerModel } from './answer.model';

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
        this.answers = _.get(data, 'answers', []);
    }
}
