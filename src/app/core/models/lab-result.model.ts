import * as _ from 'lodash';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';
import { BaseModel } from './base.model';
import { CaseModel } from './case.model';
import { Constants } from './constants';
import { ContactModel } from './contact.model';
import { EntityType } from './entity-type';
import { LabResultSequenceModel } from './lab-result-sequence.model';
import { OutbreakModel } from './outbreak.model';
import { IPermissionBasic, IPermissionExportable, IPermissionImportable, IPermissionRestorable } from './permission.interface';
import { PERMISSION } from './permission.model';
import { IAnswerData } from './question.model';
import { UserModel } from './user.model';

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
  sequence: LabResultSequenceModel;

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    selectedOutbreak: () => OutbreakModel,
    options: {
      labName: ILabelValuePairModel[],
      labSampleType: ILabelValuePairModel[],
      labTestType: ILabelValuePairModel[],
      labTestResult: ILabelValuePairModel[],
    }
  }) {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleDelivered',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'labName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        options: data.options.labName,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        options: data.options.labSampleType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        options: data.options.labTestType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        options: data.options.labTestResult
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: () => data.selectedOutbreak().labResultsTemplate
      }
    ];

    // finished
    return advancedFilters;
  }

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

    // sequence
    this.sequence = new LabResultSequenceModel(_.get(data, 'sequence'));

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
