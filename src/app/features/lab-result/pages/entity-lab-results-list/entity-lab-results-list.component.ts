import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { moment } from '../../../../core/helperClasses/x-moment';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import {
  ExportFieldsGroupModelNameEnum
} from '../../../../core/models/export-fields-group.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';
import { ReferenceDataHelperService } from '../../../../core/services/helper/reference-data-helper.service';
import {
  IV2BottomDialogConfigButtonType
} from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { Moment } from 'moment/moment';
import * as momentOriginal from 'moment/moment';
import { Constants } from '../../../../core/models/constants';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { EntityLabResultHelperService } from '../../../../core/services/helper/entity-lab-result-helper.service';
import { IV2ColumnToVisibleMandatoryConf } from '../../../../shared/forms-v2/components/app-form-visible-mandatory-v2/models/visible-mandatory.model';
import { ContactOfContactModel } from '../../../../core/models/contact-of-contact.model';

@Component({
  selector: 'app-entity-lab-results-list',
  templateUrl: './entity-lab-results-list.component.html'
})
export class EntityLabResultsListComponent extends ListComponent<LabResultModel, IV2ColumnToVisibleMandatoryConf> implements OnDestroy {
  // entity
  personType: EntityType;
  entityData: CaseModel | ContactModel | ContactOfContactModel;

  // constants
  EntityType = EntityType;

  // lab results fields
  labFields: ILabelValuePairModel[] = [
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_ID', value: 'id' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID', value: 'personId' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN', value: 'dateSampleTaken' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED', value: 'dateSampleDelivered' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING', value: 'dateTesting' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT', value: 'dateOfResult' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME', value: 'labName' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID', value: 'sampleIdentifier' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE', value: 'sampleType' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE', value: 'testType' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR', value: 'testedFor' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT', value: 'result' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT', value: 'quantitativeResult' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES', value: 'notes' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS', value: 'status' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE', value: 'sequence' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', value: 'questionnaireAnswers' },
    { label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON', value: 'person' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', value: 'createdAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', value: 'createdBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', value: 'updatedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', value: 'updatedBy' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED', value: 'deleted' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', value: 'deletedAt' },
    { label: 'LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', value: 'createdOn' }
  ];

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private outbreakDataService: OutbreakDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private entityLabResultHelperService: EntityLabResultHelperService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private caseDataService: CaseDataService,
    private referenceDataHelperService: ReferenceDataHelperService,
    private labResultDataService: LabResultDataService
  ) {
    // parent
    super(
      listHelperService, {
        disableFilterCaching: true,
        initializeTableColumnsAfterSelectedOutbreakChanged: true,
        initializeTableAdvancedFiltersAfterSelectedOutbreakChanged: true
      }
    );

    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;

    // retrieve data
    this.personType = this.activatedRoute.snapshot.data.personType;
    this.entityData = this.activatedRoute.snapshot.data.entityData;
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();

    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
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
    this.tableColumnActions = this.entityLabResultHelperService.retrieveTableColumnActions({
      personType: this.personType,
      selectedOutbreak: () => this.selectedOutbreak,
      selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
      refreshList: () => {
        // reload data
        this.needsRefreshList(true);
      }
    });
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    this.tableColumns = this.entityLabResultHelperService.retrieveTableColumns(this.selectedOutbreak, {
      user: this.activatedRoute.snapshot.data.user,
      options: {
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
        labSequenceLaboratory: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        ),
        labSequenceResult: this.referenceDataHelperService.filterPerOutbreakOptions(
          this.selectedOutbreak,
          (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
          undefined
        )
      }
    });
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
    this.advancedFilters = this.entityLabResultHelperService.generateAdvancedFiltersPerson(this.selectedOutbreak, {
      labResultsTemplate: () => this.selectedOutbreak.labResultsTemplate,
      options: {
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
        yesNoAll: (this.activatedRoute.snapshot.data.yesNoAll as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
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
        return LabResultModel.canExport(this.authUser) && (
          (this.personType === EntityType.CASE && CaseModel.canExportLabResult(this.authUser)) ||
          (this.personType === EntityType.CONTACT && ContactModel.canExportLabResult(this.authUser)) ||
          (this.personType === EntityType.CONTACT_OF_CONTACT && ContactOfContactModel.canExportLabResult(this.authUser)) ||
          (
            this.personType === EntityType.CASE &&
            CaseModel.canModify(this.authUser) &&
            this.selectedOutbreakIsActive
          )
        );
      },
      menuOptions: [
        {
          label: {
            get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_CHANGE_CASE_CLASSIFICATION'
          },
          action: {
            click: () => {
              this.changeCaseClassification();
            }
          },
          visible: (): boolean => {
            return this.personType === EntityType.CASE &&
              CaseModel.canModify(this.authUser) &&
              this.selectedOutbreakIsActive;
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return this.personType === EntityType.CASE && CaseModel.canModify(this.authUser);
          }
        },

        // Export lab result data
        {
          label: {
            get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_EXPORT_TITLE'
          },
          action: {
            click: () => {
              // export lab results data
              this.exportLabResultsData(this.queryBuilder);
            }
          },
          visible: (): boolean => {
            return LabResultModel.canExport(this.authUser) && (
              (this.personType === EntityType.CASE && CaseModel.canExportLabResult(this.authUser)) ||
              (this.personType === EntityType.CONTACT && ContactModel.canExportLabResult(this.authUser)) ||
              (this.personType === EntityType.CONTACT_OF_CONTACT && ContactOfContactModel.canExportLabResult(this.authUser))
            );
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
                labResultsIds: JSON.stringify(selected),
                entityType: this.entityData.type,
                entityId: this.entityData.id
              };
            }
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              LabResultModel.canBulkModify(this.authUser);
          },
          disable: (selected: string[]): boolean => {
            return selected.length < 1;
          }
        },

        // Export selected lab results
        {
          label: {
            get: () => 'LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_EXPORT_SELECTED_LAB_RESULTS'
          },
          action: {
            click: (selected: string[]) => {
              // create query
              const qb = new RequestQueryBuilder();
              qb.filter.bySelect(
                'id',
                selected,
                true,
                null
              );

              this.exportLabResultsData(qb);
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
            this.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_DELETE_SELECTED_LAB_RESULTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.dialogV2Service
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
                  const loading = this.dialogV2Service.showLoadingDialog();
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
                      this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SELECTED_LAB_RESULTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // delete
                    this.labResultDataService
                      .deleteLabResult(
                        this.selectedOutbreak.id,
                        selectedShallowClone.shift()
                      )
                      .pipe(
                        catchError((err) => {
                          // hide loading
                          loading.close();

                          // error
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = momentOriginal();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = momentOriginal().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = momentOriginal().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '—'
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
            this.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_GROUP_ACTION_RESTORE_SELECTED_LAB_RESULTS_DESCRIPTION') :
            undefined,
          action: {
            click: (selected: string[]) => {
              // ask for confirmation
              this.dialogV2Service
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
                  const loading = this.dialogV2Service.showLoadingDialog();
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
                      this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_SELECTED_LAB_RESULTS_SUCCESS_MESSAGE');
                      loading.close();
                      this.needsRefreshList(true);
                      return;
                    }

                    // restore
                    const labResultId: string = selectedShallowClone.shift();
                    this.labResultDataService
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
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // determine estimated end time
                        let estimatedEndDate: Moment;

                        // initialize start time if necessary
                        if (!startTime) {
                          startTime = momentOriginal();
                        }

                        // determine estimated time
                        const processed: number = selected.length - selectedShallowClone.length;
                        const total: number = selected.length;
                        if (processed > 0) {
                          const processedSoFarTimeMs: number = momentOriginal().diff(startTime);
                          const requiredTimeForAllMs: number = processedSoFarTimeMs * total / processed;
                          const remainingTimeMs = requiredTimeForAllMs - processedSoFarTimeMs;
                          estimatedEndDate = momentOriginal().add(remainingTimeMs, 'ms');
                        }

                        // update progress
                        loading.message({
                          message: 'LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_SELECTED_LAB_RESULTS_WAIT_MESSAGE',
                          messageData: {
                            no: processed.toLocaleString('en'),
                            total: total.toLocaleString('en'),
                            date: estimatedEndDate ? estimatedEndDate.format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) : '—'
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
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/lab-results', EntityModel.getLinkForEntityType(this.entityData.type), this.entityData.id, 'create']
      },
      visible: (): boolean => {
        return (
          (
            this.entityData.type === EntityType.CASE &&
            CaseModel.canCreateLabResult(this.authUser)
          ) || (
            this.entityData.type === EntityType.CONTACT &&
            ContactModel.canCreateLabResult(this.authUser)
          )
        ) && this.selectedOutbreakIsActive;
      }
    };
  }

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
      }
    ];

    // entity list
    if (
      this.personType === EntityType.CONTACT_OF_CONTACT &&
      ContactOfContactModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
          action: {
            link: ['/contacts-of-contacts']
          }
        }
      );
    } else if (
      this.personType === EntityType.CONTACT &&
      ContactModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
          action: {
            link: ['/contacts']
          }
        }
      );
    } else if (
      this.personType === EntityType.CASE &&
      CaseModel.canList(this.authUser)
    ) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_CASES_TITLE',
          action: {
            link: ['/cases']
          }
        }
      );
    }

    // person breadcrumbs
    if (this.entityData) {
      // entity view
      if (
        this.personType === EntityType.CONTACT_OF_CONTACT &&
        ContactOfContactModel.canView(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: this.entityData.name,
            action: {
              link: [`/contacts-of-contacts/${ this.entityData.id }/view`]
            }
          }
        );
      } else if (
        this.personType === EntityType.CONTACT &&
        ContactModel.canView(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: this.entityData.name,
            action: {
              link: [`/contacts/${ this.entityData.id }/view`]
            }
          }
        );
      } else if (
        this.personType === EntityType.CASE &&
        CaseModel.canView(this.authUser)
      ) {
        this.breadcrumbs.push(
          {
            label: this.entityData.name,
            action: {
              link: [`/cases/${ this.entityData.id }/view`]
            }
          }
        );
      }
    }

    // current page
    this.breadcrumbs.push(
      {
        label: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE',
        action: null
      }
    );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return this.entityLabResultHelperService.refreshListFields();
  }

  /**
   * Re(load) the Case lab results list, based on the applied filter, sort criterias
   */
  refreshList(triggeredByPageChange: boolean) {
    if (
      this.selectedOutbreak &&
      this.personType &&
      this.entityData
    ) {
      // refresh badges list with applied filter
      if (!triggeredByPageChange) {
        this.initializeGroupedData();
      }

      // retrieve the list of lab results
      this.records$ = this.entityLabResultHelperService
        .retrieveRecords(
          this.selectedOutbreak,
          EntityModel.getLinkForEntityType(this.personType),
          this.entityData.id,
          this.queryBuilder
        )
        .pipe(
          // should be the last pipe
          takeUntil(this.destroyed$)
        );
    }
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (
      this.selectedOutbreak &&
      this.personType &&
      this.entityData
    ) {
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

      // apply has more limit
      if (this.applyHasMoreLimit) {
        countQueryBuilder.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.entityLabResultHelperService
        .retrieveRecordsCount(
          this.selectedOutbreak.id,
          this.personType,
          this.entityData.id,
          countQueryBuilder
        )
        .pipe(
          // should be the last pipe
          takeUntil(this.destroyed$)
        )
        .subscribe((response) => {
          this.pageCount = response;
        });
    }
  }

  /**
   * Change case classification
   */
  private changeCaseClassification() {
    this.dialogV2Service
      .showSideDialog({
        // title
        title: {
          get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_CHANGE_CASE_CLASSIFICATION'
        },

        // inputs
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION',
            options: this.referenceDataHelperService.filterPerOutbreakOptions(
              this.selectedOutbreak,
              (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
              (this.entityData as CaseModel).classification
            ),
            value: (this.entityData as CaseModel).classification,
            name: 'classification',
            validators: {
              required: () => true
            }
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
              return !handler.form || handler.form.invalid;
            }
          }, {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ]
      }).subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          return;
        }

        // change case classification
        this.caseDataService
          .modifyCase(
            this.selectedOutbreak.id,
            this.entityData.id,
            {
              classification: (response.handler.data.map.classification as IV2SideDialogConfigInputSingleDropdown).value
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
            (this.entityData as CaseModel).classification = (response.handler.data.map.classification as IV2SideDialogConfigInputSingleDropdown).value;

            // success message
            this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_CHANGE_CASE_EPI_CLASSIFICATION_SUCCESS_MESSAGE');

            // close popup
            response.handler.hide();

            // refresh list
            this.needsRefreshList(true);
          });
      });
  }

  /**
   * Export lab results
   */
  private exportLabResultsData(qb: RequestQueryBuilder) {
    this.dialogV2Service.showExportDataAfterLoadingData({
      title: {
        get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_EXPORT_TITLE'
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
            let personId = '';
            let pageTitle = '';
            if (this.personType === EntityType.CONTACT_OF_CONTACT) {
              personId = this.activatedRoute.snapshot.params.contactOfContactId;
              pageTitle = 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE';
            } else if (this.personType === EntityType.CONTACT) {
              personId = this.activatedRoute.snapshot.params.contactId;
              pageTitle = 'LNG_PAGE_LIST_CONTACTS_TITLE';
            } else {
              // EntityType.CASE
              personId = this.activatedRoute.snapshot.params.caseId;
              pageTitle = 'LNG_PAGE_LIST_CASES_TITLE';
            }
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${ this.selectedOutbreak.id }/${ EntityModel.getLinkForEntityType(this.personType) }/${ personId }/lab-results/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${ this.i18nService.instant(pageTitle) } - ${ moment().format('YYYY-MM-DD') }`,
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
}
