import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { IV2BottomDialogConfigButtonType } from '../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../shared/components-v2/app-list-table-v2/models/action.model';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../shared/forms-v2/core/label-value-pair.model';
import { RequestQueryBuilder } from '../../helperClasses/request-query-builder';
import { CaseModel } from '../../models/case.model';
import { ContactModel } from '../../models/contact.model';
import { EntityModel } from '../../models/entity-and-relationship.model';
import { EntityType } from '../../models/entity-type';
import { LabResultModel } from '../../models/lab-result.model';
import { OutbreakModel } from '../../models/outbreak.model';
import { QuestionModel } from '../../models/question.model';
import { UserModel } from '../../models/user.model';
import { LabResultDataService } from '../data/lab-result.data.service';
import { DialogV2Service } from './dialog-v2.service';
import { ToastV2Service } from './toast-v2.service';
import { IBasicCount } from '../../models/basic-count.interface';
import { IResolverV2ResponseModel } from '../resolvers/data/models/resolver-response.model';

@Injectable({
  providedIn: 'root'
})
export class EntityLabResultService {
  /**
   * Constructor
   */
  constructor(
    private dialogV2Service: DialogV2Service,
    private labResultDataService: LabResultDataService,
    private toastV2Service: ToastV2Service
  ) {}

  /**
   * Retrieve table columns
   */
  retrieveTableColumns(definitions: {
    authUser: UserModel,
    personType: EntityType,
    selectedOutbreak: () => OutbreakModel,
    selectedOutbreakIsActive: () => boolean,
    user: IResolverV2ResponseModel<UserModel>,
    options: {
      labName: ILabelValuePairModel[],
      labSampleType: ILabelValuePairModel[],
      labTestType: ILabelValuePairModel[],
      labTestResult: ILabelValuePairModel[],
      labResultProgress: ILabelValuePairModel[],
      labSequenceLaboratory: ILabelValuePairModel[],
      labSequenceResult: ILabelValuePairModel[]
    },
    refreshList: () => void
  }): IV2Column[] {
    // default table columns
    const tableColumns: IV2Column[] = [
      {
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
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
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labName
        }
      },
      {
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labSampleType
        }
      },
      {
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labTestType
        }
      },
      {
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labTestResult
        }
      },
      {
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: definitions.options.labResultProgress
        }
      },
      {
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'sequence.hasSequence',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
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
          return !UserModel.canView(definitions.authUser);
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
          return !UserModel.canView(definitions.authUser);
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
        notVisible: true,
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
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
                LabResultModel.canView(definitions.authUser) && (
                (
                  definitions.personType === EntityType.CASE &&
                    CaseModel.canViewLabResult(definitions.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT &&
                    ContactModel.canViewLabResult(definitions.authUser)
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
                LabResultModel.canModify(definitions.authUser) && (
                (
                  definitions.personType === EntityType.CASE &&
                    CaseModel.canModifyLabResult(definitions.authUser)
                ) || (
                  definitions.personType === EntityType.CONTACT &&
                    ContactModel.canModifyLabResult(definitions.authUser)
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
                    this.dialogV2Service.showConfirmDialog({
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
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // delete lab result
                      this.labResultDataService
                        .deleteLabResult(definitions.selectedOutbreak().id, item.id)
                        .pipe(
                          catchError((err) => {
                            // show error
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

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
                    LabResultModel.canDelete(definitions.authUser) && (
                    (
                      definitions.personType === EntityType.CASE &&
                        CaseModel.canDeleteLabResult(definitions.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                        ContactModel.canDeleteLabResult(definitions.authUser)
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
                    LabResultModel.canDelete(definitions.authUser) && (
                    (
                      definitions.personType === EntityType.CASE &&
                        CaseModel.canDeleteLabResult(definitions.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                        ContactModel.canDeleteLabResult(definitions.authUser)
                    )
                  );
                }
              },

              // See questionnaire
              {
                label: {
                  get: () => 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_QUESTIONNAIRE_TITLE'
                },
                action: {
                  link: (item: LabResultModel): string[] => {
                    return ['/lab-results', item.id, 'view-questionnaire'];
                  }
                },
                visible: (item: LabResultModel): boolean => {
                  return !item.deleted &&
                    LabResultModel.canView(definitions.authUser);
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
                    this.dialogV2Service.showConfirmDialog({
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
                      const loading = this.dialogV2Service.showLoadingDialog();

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
                            this.toastV2Service.error(err);

                            // hide loading
                            loading.close();

                            // send error down the road
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // success
                          this.toastV2Service.success('LNG_PAGE_LIST_CASES_ACTION_RESTORE_SUCCESS_MESSAGE');

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
                    LabResultModel.canRestore(definitions.authUser) && (
                    (
                      definitions.personType === EntityType.CASE &&
                        CaseModel.canRestoreLabResult(definitions.authUser)
                    ) || (
                      definitions.personType === EntityType.CONTACT &&
                        ContactModel.canRestoreLabResult(definitions.authUser)
                    )
                  );
                }
              }
            ]
          }
        ]
      }
    ];

    return tableColumns;
  }

  /**
   * Advanced filters
   */
  generateAdvancedFilters(data: {
    caseInvestigationTemplate: () => QuestionModel[],
    options: {
      labName: ILabelValuePairModel[],
      labSampleType: ILabelValuePairModel[],
      labTestType: ILabelValuePairModel[],
      labTestResult: ILabelValuePairModel[],
      labResultProgress: ILabelValuePairModel[],
      labSequenceLaboratory: ILabelValuePairModel[],
      labSequenceResult: ILabelValuePairModel[],
      yesNo: ILabelValuePairModel[],
    }
  }): V2AdvancedFilter[] {
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
        sortable: true,
        options: data.options.labName
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        sortable: true,
        options: data.options.labSampleType
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        sortable: true,
        options: data.options.labTestType
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        sortable: true,
        options: data.options.labTestResult
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        sortable: true,
        options: data.options.labResultProgress
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'sequence.hasSequence',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
        sortable: true,
        options: data.options.yesNo
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateSampleSent',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.labId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
        sortable: true,
        options: data.options.labSequenceLaboratory
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'sequence.dateResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'sequence.resultId',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
        sortable: true,
        options: data.options.labSequenceResult
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'sequence.noSequenceReason',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON'
      },
      {
        type: V2AdvancedFilterType.SELECT,
        field: 'deleted',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
        sortable: true,
        options: data.options.yesNo
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateTesting',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'notes',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS,
        field: 'questionnaireAnswers',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        template: data.caseInvestigationTemplate
      }
    ];

    // finished
    return advancedFilters;
  }

  /**
   * Retrieve data
   */
  retrieveRecords(
    outbreakId: string,
    entityPath: string,
    entityId: string,
    queryBuilder: RequestQueryBuilder
  ): Observable<LabResultModel[]> {
    return this.labResultDataService
      .getEntityLabResults(
        outbreakId,
        entityPath,
        entityId,
        queryBuilder
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
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }
}
