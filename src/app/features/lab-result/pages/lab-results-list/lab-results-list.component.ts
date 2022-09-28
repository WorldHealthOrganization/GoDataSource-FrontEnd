import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { Constants } from '../../../../core/models/constants';
import { TranslateService } from '@ngx-translate/core';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-lab-results',
  templateUrl: './lab-results-list.component.html'
})
export class LabResultsListComponent extends ListComponent<LabResultModel> implements OnDestroy {

  // lab fields
  private labFields: ILabelValuePairModel[] = [
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_ID', value:  'id' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID', value:  'personId' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN', value:  'dateSampleTaken' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED', value:  'dateSampleDelivered' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING', value:  'dateTesting' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT', value:  'dateOfResult' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME', value:  'labName' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID', value:  'sampleIdentifier' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE', value:  'sampleType' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE', value:  'testType' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR', value:  'testedFor' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT', value:  'result' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT', value:  'quantitativeResult' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES', value:  'notes' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS', value:  'status' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE', value:  'sequence' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value:  'questionnaireAnswers' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON', value:  'person' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value:  'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value:  'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value:  'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value:  'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value:  'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value:  'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value:  'createdOn' }
  ];

  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private labResultDataService: LabResultDataService,
    private translateService: TranslateService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
  * Component destroyed
  */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
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
              return ['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'view'];
            },
            linkQueryParams: (): { [k: string]: any } => {
              return {
                fromLabResultsList: true
              };
            }
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
              LabResultModel.canView(this.authUser) &&
              (
                (
                  item.personType === EntityType.CASE &&
                  CaseModel.canViewLabResult(this.authUser)
                ) || (
                  item.personType === EntityType.CONTACT &&
                  ContactModel.canViewLabResult(this.authUser)
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
              return ['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'modify'];
            },
            linkQueryParams: (): { [k: string]: any } => {
              return {
                fromLabResultsList: true
              };
            }
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
              this.selectedOutbreakIsActive &&
              LabResultModel.canModify(this.authUser) &&
              (
                (
                  item.personType === EntityType.CASE &&
                  CaseModel.canModifyLabResult(this.authUser)
                ) || (
                  item.personType === EntityType.CONTACT &&
                  ContactModel.canModifyLabResult(this.authUser)
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
                          name: `${item.sampleIdentifier}${item.sampleIdentifier && item.dateSampleTaken ? ' - ' : ''}${item.dateSampleTaken ? moment(item.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : ''}`
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
                      .deleteLabResult(this.selectedOutbreak.id, item.id)
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
                        this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: LabResultModel): boolean => {
                return !item.deleted &&
                  this.selectedOutbreakIsActive &&
                  LabResultModel.canDelete(this.authUser) &&
                  (
                    (
                      item.personType === EntityType.CASE &&
                      CaseModel.canDeleteLabResult(this.authUser)
                    ) || (
                      item.personType === EntityType.CONTACT &&
                      ContactModel.canDeleteLabResult(this.authUser)
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
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: `${item.sampleIdentifier}${item.sampleIdentifier && item.dateSampleTaken ? ' - ' : ''}${item.dateSampleTaken ? moment(item.dateSampleTaken).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : ''}`
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
                        this.selectedOutbreak.id,
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
                        this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: LabResultModel): boolean => {
                return item.deleted &&
                  this.selectedOutbreakIsActive &&
                  LabResultModel.canRestore(this.authUser) &&
                  (
                    (
                      item.personType === EntityType.CASE &&
                      CaseModel.canRestoreLabResult(this.authUser)
                    ) || (
                      item.personType === EntityType.CONTACT &&
                      ContactModel.canRestoreLabResult(this.authUser)
                    )
                  );
              }
            },

            // Divider
            {
              visible: (): boolean => {
                // visible only if at least one of the previous...
                return this.selectedOutbreakIsActive &&
                  (
                    LabResultModel.canDelete(this.authUser) &&
                    LabResultModel.canRestore(this.authUser)
                  );
              }
            },

            // Change result
            {
              label: {
                get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_CHANGE_RESULT'
              },
              action: {
                click: (item: LabResultModel) => {
                  this.dialogV2Service
                    .showSideDialog({
                      // title
                      title: {
                        get: () => 'LNG_PAGE_LIST_LAB_RESULTS_CHANGE_RESULT_DIALOG_TITLE'
                      },

                      // hide search bar
                      hideInputFilter: true,

                      // inputs
                      inputs: [
                        {
                          type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
                          value: item.result,
                          name: 'result',
                          placeholder: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
                          options: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
                        }
                      ],

                      // buttons
                      bottomButtons: [
                        {
                          label: 'LNG_COMMON_BUTTON_UPDATE',
                          type: IV2SideDialogConfigButtonType.OTHER,
                          color: 'primary',
                          key: 'save',
                          disabled: (_data, handler): boolean => {
                            return !handler.form ||
                              handler.form.invalid ||
                              item.result === ((handler.data.map.result as IV2SideDialogConfigInputSingleDropdown).value) as string;
                          }
                        }, {
                          type: IV2SideDialogConfigButtonType.CANCEL,
                          label: 'LNG_COMMON_BUTTON_CANCEL',
                          color: 'text'
                        }
                      ]
                    })
                    .subscribe((response) => {
                      // cancelled ?
                      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                        return;
                      }

                      // change entity targeted
                      this.labResultDataService
                        .modifyLabResult(
                          this.selectedOutbreak.id,
                          item.id,
                          {
                            result: (response.handler.data.map.result as IV2SideDialogConfigInputSingleDropdown).value
                          }
                        )
                        .pipe(
                          catchError((err) => {
                            this.toastV2Service.error(err);
                            return throwError(err);
                          })
                        )
                        .subscribe(() => {
                          // update our record too
                          item.result = ((response.handler.data.map.result as IV2SideDialogConfigInputSingleDropdown).value) as string;

                          // success message
                          this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_CHANGE_RESULT_SUCCESS_MESSAGE');

                          // close popup
                          response.handler.hide();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                }
              },
              visible: (): boolean => {
                return this.selectedOutbreakIsActive &&
                  LabResultModel.canModify(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
  * Initialize Side Table Columns
  */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'visualId',
        format: {
          type: 'person.visualId'
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return data.person.type === EntityType.CASE ?
            (
              CaseModel.canView(this.authUser) && !data.person.deleted ?
                `/cases/${data.person.id}/view` :
                undefined
            ) : (
              data.person.type === EntityType.CONTACT && ContactModel.canView(this.authUser) && !data.person.deleted ?
                `/contacts/${data.person.id}/view` :
                undefined
            );
        }
      },
      {
        field: 'lastName',
        format: {
          type: 'person.lastName'
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_LAST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return data.person.type === EntityType.CASE ?
            (
              CaseModel.canView(this.authUser) && !data.person.deleted ?
                `/cases/${data.person.id}/view` :
                undefined
            ) : (
              data.person.type === EntityType.CONTACT && ContactModel.canView(this.authUser) && !data.person.deleted ?
                `/contacts/${data.person.id}/view` :
                undefined
            );
        }
      },
      {
        field: 'firstName',
        format: {
          type: 'person.firstName'
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_FIRST_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return data.person.type === EntityType.CASE ?
            (
              CaseModel.canView(this.authUser) && !data.person.deleted ?
                `/cases/${data.person.id}/view` :
                undefined
            ) : (
              data.person.type === EntityType.CONTACT && ContactModel.canView(this.authUser) && !data.person.deleted ?
                `/contacts/${data.person.id}/view` :
                undefined
            );
        }
      },
      {
        field: 'statuses',
        label: 'LNG_COMMON_LABEL_STATUSES',
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
              label: ' '
            }]
          }
        ],
        forms: (_column, data: LabResultModel): V2ColumnStatusForm[] => LabResultModel.getStatusForms({
          item: data,
          translateService: this.translateService
        })
      },
      {
        field: 'classification',
        format: {
          type: (item) => item.person && item.person.classification ?
            this.translateService.instant(item.person.classification) :
            ''
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          relationshipKey: 'person'
        }
      },
      {
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
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
          options: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ILabelValuePairModel>).options
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
          options: (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
          options: (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
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
          type: (item) => item.createdBy && this.activatedRoute.snapshot.data.user.map[item.createdBy] ?
            this.activatedRoute.snapshot.data.user.map[item.createdBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.activatedRoute.snapshot.data.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) ?
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
          type: (item) => item.updatedBy && this.activatedRoute.snapshot.data.user.map[item.updatedBy] ?
            this.activatedRoute.snapshot.data.user.map[item.updatedBy].name :
            ''
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.activatedRoute.snapshot.data.user.options,
          includeNoValue: true
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) ?
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
      }
    ];

    // add to list type only if we're allowed to
    if (this.selectedOutbreak?.isContactLabResultsActive) {
      this.tableColumns.push({
        field: 'personType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_TYPE',
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labPersonType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      });
    }
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = LabResultModel.generateAdvancedFilters({
      selectedOutbreak: () => this.selectedOutbreak,
      options: {
        labName: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSampleType: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestType: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestResult: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      }
    });
  }

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return (
          CaseModel.canImportLabResult(this.authUser) &&
          this.selectedOutbreakIsActive
        ) || (
          this.selectedOutbreak &&
          this.selectedOutbreak.isContactLabResultsActive &&
          ContactModel.canImportLabResult(this.authUser) &&
          this.selectedOutbreakIsActive
        ) || (
          LabResultModel.canExport(this.authUser) && (
            CaseModel.canExportLabResult(this.authUser) ||
            ContactModel.canExportLabResult(this.authUser)
          )
        );
      },
      menuOptions: [
        // Export lab result data
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              // export lab results data
              this.exportLabResults(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return LabResultModel.canExport(this.authUser) && (CaseModel.canExportLabResult(this.authUser) || ContactModel.canExportLabResult(this.authUser));
          }
        },

        // Import case lab data
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_IMPORT_CASE_LAB_RESULTS_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'case-lab-data', 'import']
          },
          visible: (): boolean => {
            return CaseModel.canImportLabResult(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        },

        // Import contact lab data
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_IMPORT_CONTACT_LAB_RESULTS_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'contact-lab-data', 'import']
          },
          visible: (): boolean => {
            return this.selectedOutbreak &&
              this.selectedOutbreak.isContactLabResultsActive &&
              ContactModel.canImportLabResult(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {
    this.groupActions = {
      type: V2ActionType.GROUP_ACTIONS,
      visible: () => LabResultModel.canExport(this.authUser) && (
        CaseModel.canExportLabResult(this.authUser) ||
        ContactModel.canExportLabResult(this.authUser)
      ),
      actions: [
        // bulk modify
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_MODIFY_SELECTED_LAB_RESULTS'
          },
          action: {
            link: () => {
              return ['/lab-results/modify-list'];
            },
            linkQueryParams: (selected: string[]): Params => {
              return {
                labResultsIds: JSON.stringify(selected)
              };
            }
          },
          visible: (): boolean => {
            // #TODO: Remove "true ||" used to test the functionality
            return true || this.selectedOutbreakIsActive &&
              LabResultModel.canBulkModify(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },
        // bulk export
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_EXPORT_SELECTED_LAB_RESULTS'
          },
          action: {
            click: (selected: string[]) => {
              // construct query builder
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect('id', selected, true, null);

              // allow deleted records
              qb.includeDeleted();

              // keep sort order
              if (!this.queryBuilder.sort.isEmpty()) {
                qb.sort.criterias = {
                  ...this.queryBuilder.sort.criterias
                };
              }

              // export
              this.exportLabResults(qb);
            }
          },
          visible: (): boolean => {
            return LabResultModel.canExport(this.authUser) && (
              CaseModel.canExportLabResult(this.authUser) ||
              ContactModel.canExportLabResult(this.authUser)
            );
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        }
      ]
    };
  }

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs(): void {
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      },
      {
        label: 'LNG_PAGE_LIST_LAB_RESULTS_TITLE',
        action: null
      }
    ];
  }

  /**
  * Fields retrieved from api to reduce payload size
  */
  protected refreshListFields(): string[] {
    return [
      'id',
      'personId',
      'person',
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
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt',
      'personType',
      'questionnaireAnswers'
    ];
  }

  /**
   * Re(load) the Lab Results list
   */
  refreshList(): void {
    // retrieve only case lab results ?
    if (
      CaseModel.canListLabResult(this.authUser) && (
        !this.selectedOutbreak.isContactLabResultsActive ||
        !ContactModel.canListLabResult(this.authUser)
      )
    ) {
      // force filter by cases
      this.queryBuilder.filter.byEquality(
        'personType',
        EntityType.CASE
      );
    } else if (
      ContactModel.canListLabResult(this.authUser) &&
      !CaseModel.canListLabResult(this.authUser)
    ) {
      // outbreak allows this case ?
      if (this.selectedOutbreak.isContactLabResultsActive) {
        // force filter by cases
        this.queryBuilder.filter.byEquality(
          'personType',
          EntityType.CONTACT
        );
      } else {
        // can't see any labs :)
        // force filter by cases
        this.queryBuilder.filter.byEquality(
          'personType',
          '—'
        );
      }
    } else {
      // NOT POSSIBLE TO ACCESS THIS PAGE WITHOUT HAVING AT LEAST ONE OF THE TWO PERMISSIONS ( case / contact list lab results )
    }

    // retrieve the list of lab results
    this.records$ = this.labResultDataService
      .getOutbreakLabResults(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        // determine alertness
        map((data: LabResultModel[]) => {
          return LabResultModel.determineAlertness(
            this.selectedOutbreak.labResultsTemplate,
            data
          );
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.labResultDataService
      .getOutbreakLabResultsCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
   * Export lab results
   */
  private exportLabResults(qb: RequestQueryBuilder) {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_LAB_RESULTS_EXPORT_TITLE'
      },
      load: (finished) => {
        // retrieve the list of export fields groups for model
        this.outbreakDataService
          .getExportFieldsGroups(ExportFieldsGroupModelNameEnum.LAB_RESULT)
          .pipe(
            // handle errors
            catchError((err) => {
              // show error
              this.toastV2Service.error(err);

              // send error further
              return throwError(err);
            }),

            // should be the last pipe
            takeUntil(this.destroyed$)
          )
          .subscribe((fieldsGroupList) => {
            // set groups
            const labResultsFieldGroups: ILabelValuePairModel[] = fieldsGroupList.options.map((item) => ({
              label: item.name,
              value: item.name
            }));

            // group restrictions
            const labResultsFieldGroupsRequires: IV2ExportDataConfigGroupsRequired = fieldsGroupList.toRequiredList();

            // show export
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_LAB_RESULTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${ this.selectedOutbreak.id }/lab-results/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${ this.translateService.instant('LNG_PAGE_LIST_LAB_RESULTS_TITLE') } - ${ moment().format('YYYY-MM-DD') }`,
                queryBuilder: qb,
                allow: {
                  types: [
                    ExportDataExtension.CSV,
                    ExportDataExtension.XLS,
                    ExportDataExtension.XLSX,
                    ExportDataExtension.JSON,
                    ExportDataExtension.ODS,
                    ExportDataExtension.PDF
                  ],
                  encrypt: true,
                  anonymize: {
                    fields: this.labFields
                  },
                  groups: {
                    fields: labResultsFieldGroups,
                    required: labResultsFieldGroupsRequires
                  },
                  fields: this.labFields,
                  dbColumns: true,
                  dbValues: true,
                  questionnaireVariables: true,
                  jsonReplaceUndefinedWithNull: true
                }
              }
            });
          });
      }
    });
  }
}
