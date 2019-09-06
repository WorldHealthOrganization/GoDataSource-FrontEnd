import * as _ from 'lodash';
import { Constants } from './constants';
import { CaseModel } from './case.model';
import { IAnswerData } from './question.model';
import { ContactModel } from './contact.model';
import { EntityType } from './entity-type';
import { BaseModel } from './base.model';

export class LabResultModel extends BaseModel {
    entity: CaseModel | ContactModel;
    case: CaseModel;

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
    questionnaireAnswers: {
        [variable: string]: IAnswerData[];
    };
    personId: string;
    testedFor: string;

    constructor(data = null) {
        super(data);

        this.entity = _.get(data, 'case');
        this.entity = this.entity && this.entity.type === EntityType.CONTACT ?
            new ContactModel(this.entity) :
            new CaseModel(this.entity);

        this.case = _.get(data, 'case');
        if (!_.isEmpty(this.case)) {
            this.case = new CaseModel(this.case);
        }

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
        this.personId = _.get(data, 'personId');
        this.testedFor = _.get(data, 'testedFor');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
    }
}
