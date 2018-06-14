import * as _ from 'lodash';
import { LocationModel } from './location.model';

export class QuestionModel {
    value: string;
    category: string;
    order: number;
    answers: any;

    constructor(data = null) {
        this.value = _.get(data, 'value');
        this.category = _.get(data, 'category');
        this.order = _.get(data, 'order');
        // this.answers = _.get(data, 'answers');
        // TODO only temporary initialize answers with an array of answers.
        this.answers = [{"value": "", "alert": true, "type": "Free Text", "code": "SYM"}];
    }
}
