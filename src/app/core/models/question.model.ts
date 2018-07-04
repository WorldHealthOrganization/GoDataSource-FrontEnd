import * as _ from 'lodash';
import { LocationModel } from './location.model';

export class QuestionModel {
    new: boolean;
    text: string;
    variable: string;
    answerType: string;
    category: string;
    order: number;
    answers: any;

    constructor(data = null) {
        this.text = _.get(data, 'text');
        if ( !_.isNull(data) ) {
            this.new = true;
        }
        this.variable = _.get(data, 'variable');
        this.answerType = _.get(data, 'answerType');
        this.category = _.get(data, 'category');
        this.order = _.get(data, 'order');
        // this.answers = _.get(data, 'answers');
        // TODO only temporary initialize answers with an array of answers.
        this.answers = [];
    }
}
