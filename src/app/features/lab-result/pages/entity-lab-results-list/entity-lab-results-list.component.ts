import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { EntityLabResultService } from '../../../../core/services/helper/entity-lab-result-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { TopnavComponent } from '../../../../core/components/topnav/topnav.component';

@Component({
  selector: 'app-entity-lab-results-list',
  templateUrl: './entity-lab-results-list.component.html'
})
export class EntityLabResultsListComponent extends ListComponent<LabResultModel> implements OnDestroy {
  // entity
  personType: EntityType;
  entityData: CaseModel | ContactModel;

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
    private entityLabResultService: EntityLabResultService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private caseDataService: CaseDataService
  ) {
    // parent
    super(
      listHelperService,
      true
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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    this.tableColumns = this.entityLabResultService.retrieveTableColumns({
      authUser: this.authUser,
      personType: this.personType,
      selectedOutbreak: () => this.selectedOutbreak,
      selectedOutbreakIsActive: () => this.selectedOutbreakIsActive,
      user: this.activatedRoute.snapshot.data.user,
      options: {
        labName: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSampleType: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestType: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestResult: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        labSequenceLaboratory: (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSequenceResult: (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
      },
      refreshList: () => {
        // reload data
        this.needsRefreshList(true);
      }
    });
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
    this.advancedFilters = this.entityLabResultService.generateAdvancedFilters({
      labResultsTemplate: () => this.selectedOutbreak.labResultsTemplate,
      options: {
        labName: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSampleType: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestType: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestResult: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        labSequenceLaboratory: (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSequenceResult: (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        yesNo: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options
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
              (this.personType === EntityType.CONTACT && ContactModel.canExportLabResult(this.authUser))
            );
          }
        }
      ]
    };
  }

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

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
  protected initializeGroupedData(): void {
    this.groupActions = [
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
          return LabResultModel.canExport(this.authUser);
        },
        disable: (selected: string[]): boolean => {
          return selected.length < 1;
        }
      }
    ];
  }

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
    return this.entityLabResultService.refreshListFields();
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
      this.records$ = this.entityLabResultService
        .retrieveRecords(
          this.selectedOutbreak.id,
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

      // apply has more limit
      if (this.applyHasMoreLimit) {
        countQueryBuilder.flag(
          'applyHasMoreLimit',
          true
        );
      }

      // count
      this.entityLabResultService
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
            options: (this.activatedRoute.snapshot.data.classification as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
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
            finished({
              title: {
                get: () => 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_EXPORT_TITLE'
              },
              export: {
                url: `/outbreaks/${ this.selectedOutbreak.id }/${ EntityModel.getLinkForEntityType(this.personType) }/${ this.personType === EntityType.CONTACT ? this.activatedRoute.snapshot.params.contactId : this.activatedRoute.snapshot.params.caseId }/lab-results/export`,
                async: true,
                method: ExportDataMethod.POST,
                fileName: `${ this.i18nService.instant(this.personType === EntityType.CONTACT ? 'LNG_PAGE_LIST_CONTACTS_TITLE' : 'LNG_PAGE_LIST_CASES_TITLE') } - ${ moment().format('YYYY-MM-DD') }`,
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
