import { OutbreakModel } from '../../../models/outbreak.model';
import { PersonAndRelatedHelperService } from '../person-and-related-helper.service';
import { LabResultModel } from '../../../models/lab-result.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { CreateViewModifyV2TabInputType, ICreateViewModifyV2Tab } from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { Constants } from '../../../models/constants';
import { IV2ColumnToVisibleMandatoryConf, V2AdvancedFilterToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { UserModel } from '../../../models/user.model';
import { IAnswerData, QuestionModel } from '../../../models/question.model';
import { IV2ColumnAction, IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { EntityType } from '../../../models/entity-type';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { EntityModel } from '../../../models/entity-and-relationship.model';
import { CaseModel } from '../../../models/case.model';
import { ContactModel } from '../../../models/contact.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { LabResultDataService } from '../../data/lab-result.data.service';
import { catchError, map } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { IResolverV2ResponseModel } from '../../resolvers/data/models/resolver-response.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { RequestQueryBuilder } from '../../../helperClasses/request-query-builder';
import { IBasicCount } from '../../../models/basic-count.interface';
import { ContactOfContactModel } from '../../../models/contact-of-contact.model';

export class LabResultHelperModel {
  // data
  public readonly visibleMandatoryKey: string = 'lab-results';

  /**
   * Constructor
   */
  constructor(
    private parent: PersonAndRelatedHelperService,
    public labResultDataService: LabResultDataService
  ) {}

  /**
   * Generate tab - Details
   */
  generateTabsDetails(
    useToFilterOutbreak: OutbreakModel,
    data: {
      isCreate: boolean,
      itemData: LabResultModel,
      options: {
        labName: ILabelValuePairModel[],
        labSampleType: ILabelValuePairModel[],
        labTestType: ILabelValuePairModel[],
        labTestResult: ILabelValuePairModel[],
        labResultProgress: ILabelValuePairModel[],
        labSequenceLaboratory: ILabelValuePairModel[],
        labSequenceResult: ILabelValuePairModel[]
      }
    }
  ): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = this.parent.createViewModify.tabFilter(
      {
        type: CreateViewModifyV2TabInputType.TAB,
        name: 'details',
        label: data.isCreate ? 'LNG_PAGE_CREATE_LAB_RESULT_TAB_DETAILS' : 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
        sections: [
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: data.isCreate ? 'LNG_PAGE_CREATE_LAB_RESULT_TAB_DETAILS' : 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_DETAILS_TITLE',
            inputs: [
              {
                type: CreateViewModifyV2TabInputType.TEXT,
                name: 'sampleIdentifier',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID_DESCRIPTION',
                value: {
                  get: () => data.itemData.sampleIdentifier,
                  set: (value) => {
                    // set data
                    data.itemData.sampleIdentifier = value;
                  }
                },
                visibleMandatoryConf: {
                  visible: true,
                  required: false
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'dateSampleTaken',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN_DESCRIPTION',
                value: {
                  get: () => data.itemData.dateSampleTaken,
                  set: (value) => {
                    data.itemData.dateSampleTaken = value;
                  }
                },
                validators: {
                  required: () => true,
                  dateSameOrBefore: () => [
                    'dateSampleDelivered',
                    'dateTesting',
                    'dateOfResult'
                  ]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'dateSampleDelivered',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED_DESCRIPTION',
                value: {
                  get: () => data.itemData.dateSampleDelivered,
                  set: (value) => {
                    data.itemData.dateSampleDelivered = value;
                  }
                },
                validators: {
                  dateSameOrBefore: () => [
                    'dateTesting',
                    'dateOfResult'
                  ],
                  dateSameOrAfter: () => [
                    'dateSampleTaken'
                  ]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'dateTesting',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING_DESCRIPTION',
                value: {
                  get: () => data.itemData.dateTesting,
                  set: (value) => {
                    data.itemData.dateTesting = value;
                  }
                },
                validators: {
                  dateSameOrBefore: () => [
                    'dateOfResult'
                  ],
                  dateSameOrAfter: () => [
                    'dateSampleDelivered',
                    'dateSampleTaken'
                  ]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'dateOfResult',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT_DESCRIPTION',
                value: {
                  get: () => data.itemData.dateOfResult,
                  set: (value) => {
                    data.itemData.dateOfResult = value;
                  }
                },
                validators: {
                  dateSameOrAfter: () => [
                    'dateTesting',
                    'dateSampleDelivered',
                    'dateSampleTaken'
                  ]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'labName',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME_DESCRIPTION',
                options: data.options.labName,
                value: {
                  get: () => data.itemData.labName,
                  set: (value) => {
                    data.itemData.labName = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'sampleType',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE_DESCRIPTION',
                options: data.options.labSampleType,
                value: {
                  get: () => data.itemData.sampleType,
                  set: (value) => {
                    data.itemData.sampleType = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'testType',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE_DESCRIPTION',
                options: data.options.labTestType,
                value: {
                  get: () => data.itemData.testType,
                  set: (value) => {
                    data.itemData.testType = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'result',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_RESULT_DESCRIPTION',
                options: data.options.labTestResult,
                value: {
                  get: () => data.itemData.result,
                  set: (value) => {
                    data.itemData.result = value;
                  }
                },
                validators: {
                  required: () => data.itemData.status === Constants.LAB_TEST_RESULT_STATUS.COMPLETED
                },
                visibleMandatoryConf: {
                  needs: [{ field: 'status' }]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.TEXT,
                name: 'testedFor',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR_DESCRIPTION',
                value: {
                  get: () => data.itemData.testedFor,
                  set: (value) => {
                    // set data
                    data.itemData.testedFor = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'status',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_STATUS_DESCRIPTION',
                options: data.options.labResultProgress,
                value: {
                  get: () => data.itemData.status,
                  set: (value) => {
                    data.itemData.status = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.TEXTAREA,
                name: 'quantitativeResult',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT_DESCRIPTION',
                value: {
                  get: () => data.itemData.quantitativeResult,
                  set: (value) => {
                    data.itemData.quantitativeResult = value;
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.TEXTAREA,
                name: 'notes',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_NOTES_DESCRIPTION',
                value: {
                  get: () => data.itemData.notes,
                  set: (value) => {
                    data.itemData.notes = value;
                  }
                }
              }
            ]
          },
          {
            type: CreateViewModifyV2TabInputType.SECTION,
            label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE',
            inputs: [
              {
                type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
                name: 'sequence[hasSequence]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE_DESCRIPTION',
                value: {
                  get: () => data.itemData.sequence.hasSequence,
                  set: (value) => {
                    // set value
                    data.itemData.sequence.hasSequence = value;

                    // reset data
                    if (data.itemData.sequence.hasSequence) {
                      data.itemData.sequence.noSequenceReason = undefined;
                    } else {
                      data.itemData.sequence.dateSampleSent = undefined;
                      data.itemData.sequence.labId = undefined;
                      data.itemData.sequence.dateResult = undefined;
                      data.itemData.sequence.resultId = undefined;
                    }
                  }
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'sequence[dateSampleSent]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT_DESCRIPTION',
                value: {
                  get: () => data.itemData.sequence.dateSampleSent,
                  set: (value) => {
                    data.itemData.sequence.dateSampleSent = value;
                  }
                },
                disabled: () => !data.itemData.sequence.hasSequence,
                visibleMandatoryConf: {
                  needs: [{ field: 'sequence[hasSequence]' }]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'sequence[labId]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB_DESCRIPTION',
                options: data.options.labSequenceLaboratory,
                value: {
                  get: () => data.itemData.sequence.labId,
                  set: (value) => {
                    data.itemData.sequence.labId = value;
                  }
                },
                disabled: () => !data.itemData.sequence.hasSequence,
                visibleMandatoryConf: {
                  needs: [{ field: 'sequence[hasSequence]' }]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.DATE,
                name: 'sequence[dateResult]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT_DESCRIPTION',
                value: {
                  get: () => data.itemData.sequence.dateResult,
                  set: (value) => {
                    data.itemData.sequence.dateResult = value;
                  }
                },
                disabled: () => !data.itemData.sequence.hasSequence,
                visibleMandatoryConf: {
                  needs: [{ field: 'sequence[hasSequence]' }]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
                name: 'sequence[resultId]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT_DESCRIPTION',
                options: data.options.labSequenceResult,
                value: {
                  get: () => data.itemData.sequence.resultId,
                  set: (value) => {
                    data.itemData.sequence.resultId = value;
                  }
                },
                disabled: () => !data.itemData.sequence.hasSequence,
                visibleMandatoryConf: {
                  needs: [{ field: 'sequence[hasSequence]' }]
                }
              },
              {
                type: CreateViewModifyV2TabInputType.TEXTAREA,
                name: 'sequence[noSequenceReason]',
                placeholder: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
                description: () => 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON_DESCRIPTION',
                value: {
                  get: () => data.itemData.sequence.noSequenceReason,
                  set: (value) => {
                    data.itemData.sequence.noSequenceReason = value;
                  }
                },
                disabled: () => data.itemData.sequence.hasSequence,
                visibleMandatoryConf: {
                  needs: [{ field: 'sequence[hasSequence]' }]
                }
              }
            ]
          }
        ]
      },
      this.visibleMandatoryKey,
      useToFilterOutbreak
    );

    // finished
    return tab;
  }

  /**
   * Advanced filters
   */
  generateAdvancedFiltersAggregate(
    selectedOutbreak: OutbreakModel,
    data: {
      options: {
        labName: ILabelValuePairModel[],
        labSampleType: ILabelValuePairModel[],
        labTestType: ILabelValuePairModel[],
        labTestResult: ILabelValuePairModel[],
        labResultProgress: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[],
        user: ILabelValuePairModel[],
        labSequenceLaboratory: ILabelValuePairModel[],
        labSequenceResult: ILabelValuePairModel[],
        classification: ILabelValuePairModel[]
      }
    }
  ) {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'visualId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.case.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'visualId'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'visualId'
        ),
        relationshipPath: ['person'],
        sortable: 'person.visualId'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'lastName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_LAST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.case.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'lastName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'lastName'
        ),
        relationshipPath: ['person'],
        sortable: 'person.lastName'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'firstName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_FIRST_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.case.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contact.visibleMandatoryKey,
          'firstName'
        ) || this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.contactOfContact.visibleMandatoryKey,
          'firstName'
        ),
        relationshipPath: ['person'],
        sortable: 'person.firstName'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'classification',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.parent.case.visibleMandatoryKey,
          'classification'
        ),
        options: data.options.classification,
        relationshipPath: ['person'],
        sortable: 'person.classification'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleIdentifier'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleTaken'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleDelivered',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleDelivered'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfResult'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'labName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'labName'
        ),
        options: data.options.labName,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleType'
        ),
        options: data.options.labSampleType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testType'
        ),
        options: data.options.labTestType,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'result'
        ),
        options: data.options.labTestResult,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testedFor'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => selectedOutbreak.labResultsTemplate?.length > 0,
        template: () => selectedOutbreak.labResultsTemplate,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateTesting',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateTesting'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'status'
        ),
        options: data.options.labResultProgress,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'quantitativeResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'quantitativeResult'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'notes',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'notes'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'sequence.hasSequence',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[hasSequence]'
        ),
        options: data.options.yesNo,
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateSampleSent',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateSampleSent]'
        ),
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.labId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[labId]'
        ),
        options: data.options.labSequenceLaboratory,
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateResult]'
        ),
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.resultId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[resultId]'
        ),
        options: data.options.labSequenceResult,
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sequence.noSequenceReason',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[noSequenceReason]'
        ),
        sortable: true,
        relationshipLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE'
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this.parent.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Determine alertness
   */
  determineAlertness(
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
  getStatusForms(
    info: {
      // required
      item: LabResultModel
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: this.parent.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    } else {
      forms.push({
        type: IV2ColumnStatusFormType.EMPTY
      });
    }

    // finished
    return forms;
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumnActions(definitions: {
    personType: EntityType,
    selectedOutbreak: () => OutbreakModel,
    selectedOutbreakIsActive: () => boolean,
    refreshList: () => void
  }): IV2ColumnAction {
    return {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Lab Results
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_VIEW_LAB_RESULT',
          action: {
            link: (item: LabResultModel): string[] => {
              return ['/lab-results', EntityModel.getLinkForEntityType(definitions.personType), item.personId, item.id, 'view'];
            }
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
              LabResultModel.canView(this.parent.authUser) &&
              (
                (
                  definitions.personType === EntityType.CASE &&
                  CaseModel.canViewLabResult(this.parent.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT &&
                  ContactModel.canViewLabResult(this.parent.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT_OF_CONTACT &&
                  ContactOfContactModel.canViewLabResult(this.parent.authUser)
                )
              );
          }
        },

        // Modify Case Lab Results
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_MODIFY_LAB_RESULT',
          action: {
            link: (item: LabResultModel): string[] => {
              return ['/lab-results', EntityModel.getLinkForEntityType(definitions.personType), item.personId, item.id, 'modify'];
            }
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
              definitions.selectedOutbreakIsActive() &&
              LabResultModel.canModify(this.parent.authUser) &&
              (
                (
                  definitions.personType === EntityType.CASE &&
                  CaseModel.canModifyLabResult(this.parent.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT &&
                  ContactModel.canModifyLabResult(this.parent.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT_OF_CONTACT &&
                  ContactOfContactModel.canModifyLabResult(this.parent.authUser)
                )
              );
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Lab Results
            {
              label: {
                get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_DELETE_LAB_RESULT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: LabResultModel): void => {
                  // confirm
                  this.parent.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.sampleIdentifier
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT'
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.parent.dialogV2Service.showLoadingDialog();

                    // delete lab result
                    this.labResultDataService
                      .deleteLabResult(definitions.selectedOutbreak().id, item.id)
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.parent.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.parent.toastV2Service.success('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: LabResultModel): boolean => {
                return !item.deleted &&
                  definitions.selectedOutbreakIsActive() &&
                  LabResultModel.canDelete(this.parent.authUser) &&
                  (
                    (
                      definitions.personType === EntityType.CASE &&
                      CaseModel.canDeleteLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                      ContactModel.canDeleteLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT_OF_CONTACT &&
                      ContactOfContactModel.canDeleteLabResult(this.parent.authUser)
                    )
                  );
              }
            },

            // Divider
            {
              visible: (item: LabResultModel): boolean => {
                // visible only if at least one of the first two items is visible
                return !item.deleted &&
                  definitions.selectedOutbreakIsActive() &&
                  LabResultModel.canDelete(this.parent.authUser) &&
                  (
                    (
                      definitions.personType === EntityType.CASE &&
                      CaseModel.canDeleteLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                      ContactModel.canDeleteLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT_OF_CONTACT &&
                      ContactOfContactModel.canDeleteLabResult(this.parent.authUser)
                    )
                  );
              }
            },

            // Restore
            {
              label: {
                get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: LabResultModel) => {
                  // show confirm dialog to confirm the action
                  this.parent.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: item.sampleIdentifier
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_RESTORE_LAB_RESULT'
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.parent.dialogV2Service.showLoadingDialog();

                    // restore lab result
                    this.labResultDataService
                      .restoreLabResult(
                        definitions.selectedOutbreak().id,
                        EntityModel.getLinkForEntityType(item.personType),
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.parent.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.parent.toastV2Service.success('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        definitions.refreshList();
                      });
                  });
                }
              },
              visible: (item: LabResultModel): boolean => {
                return item.deleted &&
                  definitions.selectedOutbreakIsActive() &&
                  LabResultModel.canRestore(this.parent.authUser) &&
                  (
                    (
                      definitions.personType === EntityType.CASE &&
                      CaseModel.canRestoreLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                      ContactModel.canRestoreLabResult(this.parent.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT_OF_CONTACT &&
                      ContactOfContactModel.canRestoreLabResult(this.parent.authUser)
                    )
                  );
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Retrieve table columns
   */
  retrieveTableColumns(
    selectedOutbreak: OutbreakModel,
    definitions: {
      user: IResolverV2ResponseModel<UserModel>,
      options: {
        labName: ILabelValuePairModel[],
        labSampleType: ILabelValuePairModel[],
        labTestType: ILabelValuePairModel[],
        labTestResult: ILabelValuePairModel[],
        labResultProgress: ILabelValuePairModel[],
        labSequenceLaboratory: ILabelValuePairModel[],
        labSequenceResult: ILabelValuePairModel[]
      }
    }
  ): IV2ColumnToVisibleMandatoryConf[] {
    // default table columns
    const tableColumns: IV2ColumnToVisibleMandatoryConf[] = [
      {
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleIdentifier'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
        visibleMandatoryIf: () => true,
        format: {
          type: V2ColumnFormat.STATUS
        },
        notResizable: true,
        pinned: true,
        legends: [
          // alerted
          {
            title: 'LNG_COMMON_LABEL_STATUSES_ALERTED',
            items: [{
              form: {
                type: IV2ColumnStatusFormType.STAR,
                color: 'var(--gd-danger)'
              },
              label: ' ',
              order: undefined
            }]
          }
        ],
        forms: (_column, data: LabResultModel): V2ColumnStatusForm[] => this.getStatusForms({
          item: data
        })
      },
      {
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleTaken'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'dateSampleDelivered',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleDelivered'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'dateOfResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfResult'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'notes',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'notes'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'dateTesting',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateTesting'
        ),
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'labName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'labName'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labName
        }
      },
      {
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleType'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labSampleType
        }
      },
      {
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testType'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labTestType
        }
      },
      {
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'result'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labTestResult
        }
      },
      {
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'status'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labResultProgress
        }
      },
      {
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testedFor'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'quantitativeResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'quantitativeResult'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'sequence.hasSequence',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[hasSequence]'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN,
          field: 'sequence.hasSequence'
        },
        filter: {
          type: V2FilterType.BOOLEAN,
          value: '',
          defaultValue: ''
        }
      },
      {
        field: 'sequence.dateSampleSent',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateSampleSent]'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE,
          field: 'sequence.dateSampleSent'
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'sequence.labId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[labId]'
        ),
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labSequenceLaboratory
        }
      },
      {
        field: 'sequence.dateResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateResult]'
        ),
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE,
          field: 'sequence.dateResult'
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'sequence.resultId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[resultId]'
        ),
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labSequenceResult
        }
      },
      {
        field: 'sequence.noSequenceReason',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[noSequenceReason]'
        ),
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          useLike: true
        }
      },
      {
        field: 'deleted',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.BOOLEAN
        },
        filter: {
          type: V2FilterType.DELETED,
          value: false,
          defaultValue: false
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.createdBy && definitions.user.map[item.createdBy] ?
            definitions.user.map[item.createdBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.updatedBy && definitions.user.map[item.updatedBy] ?
            definitions.user.map[item.updatedBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.parent.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'deletedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      }
    ];

    // finished
    return this.parent.list.filterVisibleMandatoryTableColumns(tableColumns);
  }

  /**
   * Advanced filters
   */
  generateAdvancedFiltersPerson(
    selectedOutbreak: OutbreakModel,
    data: {
      labResultsTemplate: () => QuestionModel[],
      options: {
        labName: ILabelValuePairModel[],
        labSampleType: ILabelValuePairModel[],
        labTestType: ILabelValuePairModel[],
        labTestResult: ILabelValuePairModel[],
        labResultProgress: ILabelValuePairModel[],
        labSequenceLaboratory: ILabelValuePairModel[],
        labSequenceResult: ILabelValuePairModel[],
        yesNoAll: ILabelValuePairModel[],
        yesNo: ILabelValuePairModel[],
        user: ILabelValuePairModel[]
      }
    }
  ): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilterToVisibleMandatoryConf[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleIdentifier'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleTaken'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateSampleDelivered',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateSampleDelivered'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateOfResult'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'labName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'labName'
        ),
        sortable: true,
        options: data.options.labName
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sampleType'
        ),
        sortable: true,
        options: data.options.labSampleType
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testType'
        ),
        sortable: true,
        options: data.options.labTestType
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'result'
        ),
        sortable: true,
        options: data.options.labTestResult
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'status'
        ),
        sortable: true,
        options: data.options.labResultProgress
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'testedFor'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'sequence.hasSequence',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[hasSequence]'
        ),
        sortable: true,
        options: data.options.yesNo
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateSampleSent',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateSampleSent]'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.labId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[labId]'
        ),
        sortable: true,
        options: data.options.labSequenceLaboratory
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[dateResult]'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.resultId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[resultId]'
        ),
        sortable: true,
        options: data.options.labSequenceResult
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sequence.noSequenceReason',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'sequence[noSequenceReason]'
        ),
        useLike: true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateTesting',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'dateTesting'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'notes',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'notes'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        visibleMandatoryIf: () => data.labResultsTemplate && data.labResultsTemplate()?.length > 0,
        template: data.labResultsTemplate,
        useLike: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'quantitativeResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
        visibleMandatoryIf: () => this.parent.list.shouldVisibleMandatoryTableColumnBeVisible(
          selectedOutbreak,
          this.visibleMandatoryKey,
          'quantitativeResult'
        ),
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED,
        field: 'deleted',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
        visibleMandatoryIf: () => true,
        yesNoAllOptions: data.options.yesNoAll,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'createdAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'updatedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      },
      {
        type: V2AdvancedFilterType.DELETED_AT,
        field: 'deletedAt',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED_AT',
        visibleMandatoryIf: () => true,
        sortable: true
      }
    ];

    // allowed to filter by user ?
    if (UserModel.canListForFilters(this.parent.authUser)) {
      advancedFilters.push({
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'createdBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      }, {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'updatedBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
        visibleMandatoryIf: () => true,
        options: data.options.user,
        sortable: true
      });
    }

    // finished
    return this.parent.list.filterVisibleMandatoryAdvancedFilters(advancedFilters);
  }

  /**
   * Retrieve data
   */
  retrieveRecords(
    selectedOutbreak: OutbreakModel,
    entityPath: string,
    entityId: string,
    queryBuilder: RequestQueryBuilder
  ): Observable<LabResultModel[]> {
    return this.labResultDataService
      .getEntityLabResults(
        selectedOutbreak.id,
        entityPath,
        entityId,
        queryBuilder
      )
      .pipe(
        // determine alertness
        map((data: LabResultModel[]) => {
          return this.determineAlertness(
            selectedOutbreak.labResultsTemplate,
            data
          );
        })
      );
  }

  /**
   * Retrieve data count
   */
  retrieveRecordsCount(
    outbreakId: string,
    personType: EntityType,
    entityId: string,
    queryBuilder: RequestQueryBuilder
  ): Observable<IBasicCount> {
    return this.labResultDataService
      .getEntityLabResultsCount(
        outbreakId,
        EntityModel.getLinkForEntityType(personType),
        entityId,
        queryBuilder
      )
      .pipe(
        catchError((err) => {
          this.parent.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [
      'id',
      'personId',
      'personType',
      'sampleIdentifier',
      'dateSampleTaken',
      'dateSampleDelivered',
      'dateOfResult',
      'labName',
      'sampleType',
      'testType',
      'result',
      'status',
      'testedFor',
      'sequence',
      'deleted',
      'deletedAt',
      'createdBy',
      'createdAt',
      'createdByUser',
      'updatedBy',
      'updatedAt',
      'updatedByUser',
      'questionnaireAnswers',
      'quantitativeResult',
      'notes',
      'dateTesting'
    ];
  }
}
