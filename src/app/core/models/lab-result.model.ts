import * as _ from 'lodash';

export class LabResultModel {
    id: string;
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

    constructor(data = null) {
        this.id = _.get(data, 'id');
        this.dateSampleTaken = _.get(data, 'dateSampleTaken');
        this.dateSampleDelivered = _.get(data, 'dateSampleDelivered');
        this.dateTesting = _.get(data, 'dateTesting');
        this.dateOfResult = _.get(data, 'dateOfResult');
        this.labName = _.get(data, 'labName');
        this.sampleType = _.get(data, 'sampleType');
        this.testType = _.get(data, 'testType');
        this.result = _.get(data, 'result');
        this.notes = _.get(data, 'notes');
        this.status = _.get(data, 'status');
        this.quantitativeResult = _.get(data, 'quantitativeResult');
    }
}
