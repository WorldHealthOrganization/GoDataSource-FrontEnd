import * as _ from 'lodash';
import { Constants } from './constants';
import { CaseModel } from './case.model';
import { IAnswerData } from './question.model';
import { ContactModel } from './contact.model';
import { EntityType } from './entity-type';
import { BaseModel } from './base.model';
import { IPermissionBasic, IPermissionImportable, IPermissionRestorable } from './permission.interface';
import { UserModel } from './user.model';
import { OutbreakModel } from './outbreak.model';
import { PERMISSION } from './permission.model';

export class LabResultModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionRestorable,
        IPermissionImportable {
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

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_VIEW) : false); }
    static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_LIST) : false); }
    static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_CREATE) : false); }
    static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_VIEW, PERMISSION.CASE_LAB_RESULT_MODIFY) : false); }
    static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_DELETE) : false); }

    /**
     * Static Permissions - IPermissionRestorable
     */
    static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_RESTORE) : false; }

    /**
     * Static Permissions - IPermissionImportable
     */
    static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.CASE_LAB_RESULT_IMPORT) : false); }

    /**
     * Constructor
     */
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

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return LabResultModel.canView(user); }
    canList(user: UserModel): boolean { return LabResultModel.canList(user); }
    canCreate(user: UserModel): boolean { return LabResultModel.canCreate(user); }
    canModify(user: UserModel): boolean { return LabResultModel.canModify(user); }
    canDelete(user: UserModel): boolean { return LabResultModel.canDelete(user); }

    /**
     * Permissions - IPermissionRestorable
     */
    canRestore(user: UserModel): boolean { return LabResultModel.canRestore(user); }

    /**
     * Permissions - IPermissionImportable
     */
    canImport(user: UserModel): boolean { return LabResultModel.canImport(user); }
}
