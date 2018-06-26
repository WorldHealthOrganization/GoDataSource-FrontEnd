import * as _ from 'lodash';

export class SecurityQuestionModel {
    question: string;

    constructor(data = null) {
        this.question = _.get(data, 'question');
    }
}
