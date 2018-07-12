import * as _ from 'lodash';

export class AnswerModel {
    new: boolean | true;
    label: string;
    value: string;
    alert: boolean;

    constructor(data = null) {
        this.new = _.get(data, 'new', true);
        this.label = _.get(data, 'label');
        this.value = _.get(data, 'value');
        this.alert = _.get(data, 'alert');
    }
}
