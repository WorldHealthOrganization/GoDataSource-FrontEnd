import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ExportFieldsGroupModelNameEnum } from '../../../../core/models/export-fields-group.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import { IV2ColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { PersonAndRelatedHelperService } from '../../../../core/services/helper/person-and-related-helper.service';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';
import { LocalizationHelper, Moment } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-lab-results',
  templateUrl: './lab-results-list.component.html'
})
export class LabResultsListComponent extends ListComponent<LabResultModel, IV2ColumnToVisibleMandatoryConf> implements OnDestroy {

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
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT', value:  'createdAt' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY', value:  'createdBy' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT', value:  'updatedAt' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY', value:  'updatedBy' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED', value:  'deleted' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED_AT', value:  'deletedAt' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_ON', value:  'createdOn' }
  ];

  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private activatedRoute: ActivatedRoute,
    private referenceDataHelperService: ReferenceDataHelperService,
    private personAndRelatedHelperService: PersonAndRelatedHelperService
  ) {
    super(
      listHelperService, {
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );
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
                ) || (
                  item.personType === EntityType.CONTACT_OF_CONTACT &&
                  ContactOfContactModel.canViewLabResult(this.authUser)
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
                ) || (
                  item.personType === EntityType.CONTACT_OF_CONTACT &&
                  ContactOfContactModel.canModifyLabResult(this.authUser)
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
                  this.personAndRelatedHelperService.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: `${item.sampleIdentifier}${item.sampleIdentifier && item.dateSampleTaken ? ' - ' : ''}${item.dateSampleTaken ? LocalizationHelper.displayDate(item.dateSampleTaken) : ''}`
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
                    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                    // delete lab result
                    this.personAndRelatedHelperService.labResult.labResultDataService
                      .deleteLabResult(this.selectedOutbreak.id, item.id)
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.personAndRelatedHelperService.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

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
                    ) || (
                      item.personType === EntityType.CONTACT_OF_CONTACT &&
                      ContactOfContactModel.canDeleteLabResult(this.authUser)
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
                  this.personAndRelatedHelperService.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_RESTORE',
                        data: () => ({
                          name: `${item.sampleIdentifier}${item.sampleIdentifier && item.dateSampleTaken ? ' - ' : ''}${item.dateSampleTaken ? LocalizationHelper.displayDate(item.dateSampleTaken) : ''}`
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
                    const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();

                    // restore lab result
                    this.personAndRelatedHelperService.labResult.labResultDataService
                      .restoreLabResult(
                        this.selectedOutbreak.id,
                        EntityModel.getLinkForEntityType(item.personType),
                        item.personId,
                        item.id
                      )
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.personAndRelatedHelperService.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT_SUCCESS_MESSAGE');

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
                    ) || (
                      item.personType === EntityType.CONTACT_OF_CONTACT &&
                      ContactOfContactModel.canRestoreLabResult(this.authUser)
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'visualId'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'visualId'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'visualId'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return (
            data.person && (
              (
                data.person.type === EntityType.CASE &&
                CaseModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT &&
                ContactModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT_OF_CONTACT &&
                ContactOfContactModel.canView(this.authUser)
              )
            ) &&
            !data.person.deleted
          ) ?
            EntityModel.getPersonLink(data.person) :
            undefined;
        }
      },
      {
        field: 'lastName',
        format: {
          type: 'person.lastName'
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_LAST_NAME',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'lastName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'lastName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'lastName'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return (
            data.person && (
              (
                data.person.type === EntityType.CASE &&
                CaseModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT &&
                ContactModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT_OF_CONTACT &&
                ContactOfContactModel.canView(this.authUser)
              )
            ) &&
            !data.person.deleted
          ) ?
            EntityModel.getPersonLink(data.person) :
            undefined;
        }
      },
      {
        field: 'firstName',
        format: {
          type: 'person.firstName'
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_FIRST_NAME',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'firstName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contact.visibleMandatoryKey,
          'firstName'
        ) || this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.contactOfContact.visibleMandatoryKey,
          'firstName'
        ),
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH,
          relationshipKey: 'person'
        },
        link: (data) => {
          return (
            data.person && (
              (
                data.person.type === EntityType.CASE &&
                CaseModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT &&
                ContactModel.canView(this.authUser)
              ) || (
                data.person.type === EntityType.CONTACT_OF_CONTACT &&
                ContactOfContactModel.canView(this.authUser)
              )
            ) &&
            !data.person.deleted
          ) ?
            EntityModel.getPersonLink(data.person) :
            undefined;
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
        forms: (_column, data: LabResultModel): V2ColumnStatusForm[] => this.personAndRelatedHelperService.labResult.getStatusForms({
          item: data
        })
      },
      {
        field: 'classification',
        format: {
          type: (item) => item.person && item.person.classification ?
            this.personAndRelatedHelperService.i18nService.instant(item.person.classification) :
            ''
        },
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.case.visibleMandatoryKey,
          'classification'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          ),
          relationshipKey: 'person'
        }
      },
      {
        field: 'sampleIdentifier',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'sampleIdentifier'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'dateSampleTaken',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        field: 'labName',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'labName'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'sampleType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'sampleType'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'testType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'testType'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'result',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'result'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'status',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'status'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
        }
      },
      {
        field: 'testedFor',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'testedFor'
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'sequence[labId]'
        ),
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'sequence.dateResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'sequence[resultId]'
        ),
        notVisible: true,
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: this.referenceDataHelperService.filterPerOutbreakOptions(
            this.selectedOutbreak,
            (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
            undefined
          )
        }
      },
      {
        field: 'sequence.noSequenceReason',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        field: 'dateTesting',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
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
        field: 'quantitativeResult',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'quantitativeResult'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'notes',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        visibleMandatoryIf: () => this.shouldVisibleMandatoryTableColumnBeVisible(
          this.personAndRelatedHelperService.labResult.visibleMandatoryKey,
          'notes'
        ),
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
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
      },
      {
        field: 'createdBy',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
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
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_ON',
        visibleMandatoryIf: () => true,
        notVisible: true,
        format: {
          type: (item) => item.createdOn ?
            this.personAndRelatedHelperService.i18nService.instant(`LNG_PLATFORM_LABEL_${item.createdOn}`) :
            item.createdOn
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          includeNoValue: true
        },
        sortable: true
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
          type: 'updatedByUser.nameAndEmail'
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
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
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
      }
    ];

    // add to list type only if we're allowed to
    if (this.selectedOutbreak?.isContactLabResultsActive) {
      this.tableColumns.push({
        field: 'personType',
        label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_TYPE',
        visibleMandatoryIf: () => true,
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
  protected initializeProcessSelectedData(): void {
    this.processSelectedData = [
      // all selected records were not deleted ?
      {
        key: 'allNotDeleted',
        shouldProcess: () => LabResultModel.canBulkDelete(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: LabResultModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allNotDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allNotDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allNotDeleted;
        }
      },

      // all selected records were deleted ?
      {
        key: 'allDeleted',
        shouldProcess: () => LabResultModel.canBulkRestore(this.authUser) &&
          this.selectedOutbreakIsActive,
        process: (
          dataMap: {
            [id: string]: LabResultModel
          },
          selected
        ) => {
          // determine if at least one record isn't deleted
          let allDeleted: boolean = selected.length > 0;
          for (let index = 0; index < selected.length; index++) {
            // found not deleted ?
            if (!dataMap[selected[index]]?.deleted) {
              // at least one not deleted
              allDeleted = false;

              // stop
              break;
            }
          }

          // finished
          return allDeleted;
        }
      }
    ];
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = this.personAndRelatedHelperService.labResult.generateAdvancedFiltersAggregate(this.selectedOutbreak, {
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        labName: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labSampleType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labTestType: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labTestResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
        labSequenceLaboratory: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labSequenceResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        classification: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        )
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
            ContactModel.canExportLabResult(this.authUser) ||
            ContactOfContactModel.canExportLabResult(this.authUser)
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
            return LabResultModel.canExport(this.authUser) && (
              CaseModel.canExportLabResult(this.authUser) ||
              ContactModel.canExportLabResult(this.authUser) ||
              ContactOfContactModel.canExportLabResult(this.authUser)
            );
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
      visible: () => (
        this.selectedOutbreakIsActive &&
        LabResultModel.canBulkModify(this.authUser)
      ) || (
        LabResultModel.canExport(this.authUser) && (
          CaseModel.canExportLabResult(this.authUser) ||
          ContactModel.canExportLabResult(this.authUser) ||
          ContactOfContactModel.canExportLabResult(this.authUser)
        )
      ) || (
        LabResultModel.canBulkDelete(this.authUser) &&
        this.selectedOutbreakIsActive
      ) ||
      (
        LabResultModel.canBulkRestore(this.authUser) &&
        this.selectedOutbreakIsActive
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
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_DELETE_SELECTED_LAB_RESULTS_DESCRIPTION') :
            undefined,
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              LabResultModel.canBulkModify(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeleted;
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
              ContactModel.canExportLabResult(this.authUser) ||
              ContactOfContactModel.canExportLabResult(this.authUser)
            );
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Divider
        {
          visible: () => (
            (
              this.selectedOutbreakIsActive &&
              LabResultModel.canBulkModify(this.authUser)
            ) || (
              LabResultModel.canExport(this.authUser) && (
                CaseModel.canExportLabResult(this.authUser) ||
                ContactModel.canExportLabResult(this.authUser) ||
                ContactOfContactModel.canExportLabResult(this.authUser)
              )
            )
          ) && (
            (
              LabResultModel.canBulkDelete(this.authUser) ||
              LabResultModel.canBulkRestore(this.authUser)
            ) &&
            this.selectedOutbreakIsActive
          )
        },

        // bulk delete
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_DELETE_SELECTED_LAB_RESULTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allNotDeleted ?
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_DELETE_SELECTED_LAB_RESULTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.personAndRelatedHelperService.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_DELETE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_LAB_RESULTS'
                    }
                  }
                })
                .subscribe((response) => {
                  // canceled ?
                  if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // show loading
                  const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
                  loading.message({
                    message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // delete - we can't use bulk here since deleting cases triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextDelete = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SELECTED_LAB_RESULTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // delete
                    this.personAndRelatedHelperService.labResult.labResultDataService
                      .deleteLabResult(
                        this.selectedOutbreak.id,
                        selectedShallowClone.shift()
                      )
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.personAndRelatedHelperService.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = LocalizationHelper.now();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = LocalizationHelper.now().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = LocalizationHelper.now().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? LocalizationHelper.displayDateTime(estimatedEndDate) : '—'
                          }
                        });

                        // next
                        nextDelete();
                      });
                  };

                  // start delete
                  nextDelete();
                });
            }
          },
          visible: (): boolean => {
            return LabResultModel.canBulkDelete(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allNotDeleted;
          }
        },

        // bulk restore
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_RESTORE_SELECTED_LAB_RESULTS'
          },
          cssClasses: () => 'gd-list-table-selection-header-button-warning',
          tooltip: (selected: string[]) => selected.length > 0 && !this.tableV2Component.processedSelectedResults.allDeleted ?
            this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_RESTORE_SELECTED_LAB_RESULTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.personAndRelatedHelperService.dialogV2Service
                .showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_PAGE_ACTION_RESTORE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_LAB_RESULTS'
                    }
                  }
                })
                .subscribe((response) => {
                  // canceled ?
                  if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // map lab results
                  const labResultsMap: {
                    [id: string]: LabResultModel
                  } = {};
                  this.tableV2Component.recordsData.forEach((record: LabResultModel) => {
                    labResultsMap[record.id] = record;
                  });

                  // show loading
                  const loading = this.personAndRelatedHelperService.dialogV2Service.showLoadingDialog();
                  loading.message({
                    message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                    messageData: {
                      no: '1',
                      total: selected.length.toLocaleString('en'),
                      date: '—'
                    }
                  });

                  // restore - we can't use bulk here since restoring cases triggers many hooks
                  let startTime: Moment;
                  const selectedShallowClone: string[] = [...selected];
                  const nextRestore = () => {
                    // finished ?
                    if (selectedShallowClone.length < 1) {
                      this.personAndRelatedHelperService.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_SELECTED_LAB_RESULTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // restore
                    const labResultId: string = selectedShallowClone.shift();
                    this.personAndRelatedHelperService.labResult.labResultDataService
                      .restoreLabResult(
                        this.selectedOutbreak.id,
                        EntityModel.getLinkForEntityType(labResultsMap[labResultId].personType),
                        labResultsMap[labResultId].personId,
                        labResultId
                      )
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.personAndRelatedHelperService.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = LocalizationHelper.now();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = LocalizationHelper.now().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = LocalizationHelper.now().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? LocalizationHelper.displayDateTime(estimatedEndDate) : '—'
                          }
                        });

                        // next
                        nextRestore();
                      });
                  };

                  // start restore
                  nextRestore();
                });
            }
          },
          visible: (): boolean => {
            return LabResultModel.canBulkRestore(this.authUser) &&
              this.selectedOutbreakIsActive;
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1 ||
              !this.tableV2Component.processedSelectedResults.allDeleted;
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
      'dateTesting',
      'testType',
      'result',
      'status',
      'testedFor',
      'sequence',
      'deleted',
      'deletedAt',
      'createdBy',
      'createdOn',
      'createdAt',
      'updatedBy',
      'updatedAt',
      'personType',
      'questionnaireAnswers',
      'quantitativeResult',
      'notes'
    ];
  }

  /**
   * Re(load) the Lab Results list
   */
  refreshList(): void {
    // add person type conditions
    const queryBuilder = _.cloneDeep(this.queryBuilder);
    this.addPersonTypeConditions(queryBuilder);

    // retrieve created user & modified user information
    queryBuilder.include('createdByUser', true);
    queryBuilder.include('updatedByUser', true);

    // retrieve the list of lab results
    this.records$ = this.personAndRelatedHelperService.labResult.labResultDataService
      .getOutbreakLabResults(
        this.selectedOutbreak.id,
        queryBuilder
      )
      .pipe(
        // determine alertness
        map((data: LabResultModel[]) => {
          return this.personAndRelatedHelperService.labResult.determineAlertness(
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
    countQueryBuilder.clearFields();

    // add person type conditions
    this.addPersonTypeConditions(countQueryBuilder);

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.personAndRelatedHelperService.labResult.labResultDataService
      .getOutbreakLabResultsCount(this.selectedOutbreak.id, countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.personAndRelatedHelperService.toastV2Service.error(err);
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
    this.personAndRelatedHelperService.dialogV2Service.showExportDataAfterLoadingData({
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
              this.personAndRelatedHelperService.toastV2Service.error(err);

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
                fileName: `${ this.personAndRelatedHelperService.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_TITLE') } - ${ LocalizationHelper.now().format('YYYY-MM-DD') }`,
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
                  fields: {
                    options: this.labFields
                  },
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

  /**
   * Person type conditions
   */
  private addPersonTypeConditions(qb: RequestQueryBuilder) {
    // check person types permissions
    const personTypes: string[] = [];
    if (CaseModel.canListLabResult(this.authUser)) {
      personTypes.push(EntityType.CASE);
    }
    if (
      ContactModel.canListLabResult(this.authUser) &&
      this.selectedOutbreak.isContactLabResultsActive
    ) {
      personTypes.push(EntityType.CONTACT);
    }
    if (ContactOfContactModel.canListLabResult(this.authUser)) {
      personTypes.push(EntityType.CONTACT_OF_CONTACT);
    }

    // force filtering ?
    if (personTypes.length < 1) {
      // can't see any labs :)
      qb.filter.byEquality(
        'personType',
        '-'
      );
    } else {
      // force filter by specific person types
      qb.filter.bySelect(
        'personType',
        personTypes,
        false,
        null
      );
    }
  }
}
