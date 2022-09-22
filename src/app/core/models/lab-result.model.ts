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
import { IAnswerData, QuestionModel } from './question.model';
import { UserModel } from './user.model';
import { Moment } from '../helperClasses/x-moment';
import { TranslateService } from '@ngx-translate/core';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../shared/components-v2/app-list-table-v2/models/column.model';

export class LabResultModel
  extends BaseModel
  implements
        IPermissionBasic,
        IPermissionRestorable,
        IPermissionImportable,
        IPermissionExportable {
  id: string;
  sampleIdentifier: string;
  dateSampleTaken: string | Moment;
  dateSampleDelivered: string | Moment;
  dateTesting: string | Moment;
  dateOfResult: string | Moment;
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

  // used by ui
  alerted: boolean = false;

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
   * Determine alertness
   */
  static determineAlertness(
    template: QuestionModel[],
    entities: LabResultModel[]
  ): LabResultModel[] {
    // map alert question answers to object for easy find
    const alertQuestionAnswers: {
      [question_variable: string]: {
        [answer_value: string]: true
      }
    } = QuestionModel.determineAlertAnswers(template);

    // map alert value to lab results
    entities.forEach((labResultData: LabResultModel) => {
      // check if we need to mark lab result as alerted because of questionnaire answers
      labResultData.alerted = false;
      if (labResultData.questionnaireAnswers) {
        const props: string[] = Object.keys(labResultData.questionnaireAnswers);
        for (let propIndex: number = 0; propIndex < props.length; propIndex++) {
          // get answer data
          const questionVariable: string = props[propIndex];
          const answers: IAnswerData[] = labResultData.questionnaireAnswers[questionVariable];

          // retrieve answer value
          // only the newest one is of interest, the old ones shouldn't trigger an alert
          // the first item should be the newest
          const answerKey = answers?.length > 0 ?
            answers[0].value :
            undefined;

          // there is no point in checking the value if there isn't one
          if (
            !answerKey &&
            typeof answerKey !== 'number'
          ) {
            continue;
          }

          // at least one alerted ?
          if (Array.isArray(answerKey)) {
            // go through all answers
            for (let answerKeyIndex: number = 0; answerKeyIndex < answerKey.length; answerKeyIndex++) {
              if (
                alertQuestionAnswers[questionVariable] &&
                alertQuestionAnswers[questionVariable][answerKey[answerKeyIndex]]
              ) {
                // alerted
                labResultData.alerted = true;

                // stop
                break;
              }
            }

            // stop ?
            if (labResultData.alerted) {
              // stop
              break;
            }
          } else if (
            alertQuestionAnswers[questionVariable] &&
            alertQuestionAnswers[questionVariable][answerKey]
          ) {
            // alerted
            labResultData.alerted = true;

            // stop
            break;
          }
        }
      }
    });

    // finished
    return entities;
  }

  /**
   * Retrieve statuses forms
   */
  static getStatusForms(
    info: {
      // required
      item: LabResultModel,
      translateService: TranslateService
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: info.translateService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    }

    // finished
    return forms;
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
