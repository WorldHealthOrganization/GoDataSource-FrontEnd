import * as _ from 'lodash';
import { Constants } from './constants';

export class LabResultModel {
    id: string;
    sampleIdentifier: string;
    dateSampleTaken: string;
    dateSampleDelivered: string;
    dateTesting: string;
    dateOfResult: string;
    labName: string;
    sampleType: string;
    testType: string;
    result: string;
    notes: string;
    status: string;
    quantitativeResult: string;
    questionnaireAnswers: {};

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.sampleIdentifier = _.get(data, 'sampleIdentifier', '');
        this.dateSampleTaken = _.get(data, 'dateSampleTaken');
        this.dateSampleDelivered = _.get(data, 'dateSampleDelivered');
        this.dateTesting = _.get(data, 'dateTesting');
        this.dateOfResult = _.get(data, 'dateOfResult');
        this.labName = _.get(data, 'labName');
        this.sampleType = _.get(data, 'sampleType');
        this.testType = _.get(data, 'testType');
        this.result = _.get(data, 'result');
        this.notes = _.get(data, 'notes');
        this.status = _.get(data, 'status', Constants.PROGRESS_OPTIONS.IN_PROGRESS.value);
        this.quantitativeResult = _.get(data, 'quantitativeResult');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    }
}
