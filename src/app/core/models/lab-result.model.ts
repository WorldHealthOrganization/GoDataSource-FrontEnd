import * as _ from 'lodash';
import { Constants } from './constants';
import { CaseModel } from './case.model';
import { IAnswerData } from './question.model';
import { ContactModel } from './contact.model';
import { EntityType } from './entity-type';
import { BaseModel } from './base.model';
import { IPermissionBasic, IPermissionExportable, IPermissionImportable, IPermissionRestorable } from './permission.interface';
import { UserModel } from './user.model';
import { OutbreakModel } from './outbreak.model';
import { PERMISSION } from './permission.model';

export class LabResultModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionRestorable,
        IPermissionImportable,
        IPermissionExportable {
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
    personType: EntityType;
    person: CaseModel | ContactModel;
    testedFor: string;

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_VIEW) : false); }
    static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_LIST) : false); }
    static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_CREATE) : false); }
    static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_VIEW, PERMISSION.LAB_RESULT_MODIFY) : false); }
    static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_DELETE) : false); }

    /**
     * Static Permissions - IPermissionRestorable
     */
    static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LAB_RESULT_RESTORE) : false; }

    /**
     * Static Permissions - IPermissionImportable
     */
    static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_IMPORT) : false); }

    /**
     * Static Permissions - IPermissionExportable
     */
    static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_EXPORT) : false); }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.person = _.get(data, 'person');
        if (!_.isEmpty(this.person)) {
            this.person = this.person.type === EntityType.CONTACT ?
                new ContactModel(this.person) :
                new CaseModel(this.person);
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
        this.personType = _.get(data, 'personType');
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

    /**
     * Permissions - IPermissionExportable
     */
    canExport(user: UserModel): boolean { return LabResultModel.canExport(user); }
}
