import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
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
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ReferenceDataCategory, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { EntityLabResultService } from '../../../../core/services/helper/entity-lab-result.service.ts.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataMethod, IV2ExportDataConfigGroupsRequired } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-entity-lab-results-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './entity-lab-results-list.component.html',
  styleUrls: ['./entity-lab-results-list.component.less']
})
export class EntityLabResultsListComponent extends ListComponent implements OnInit, OnDestroy {
  // entity
  personType: EntityType;
  entityData: CaseModel | ContactModel;
  // TODO: Left for inspiration
  get entityDataAsCaseModel(): CaseModel {
    return this.entityData as CaseModel;
  }

  initialCaseClassification: string;

  // list of existing case lab results
  labResultsList$: Observable<LabResultModel[]>;

  caseClassificationsList$: Observable<any[]>;

  // constants
  EntityType = EntityType;

  // available side filters
  availableSideFilters: FilterModel[];

  // export outbreak lab results
  exportLabResultsUrl: string;
  exportLabResultsFileName: string;
  anonymizeFields: ILabelValuePairModel[] = [
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
    private route: ActivatedRoute,
    private outbreakDataService: OutbreakDataService,
    private caseDataService: CaseDataService,
    private contactDataService: ContactDataService,
    private labResultDataService: LabResultDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private referenceDataDataService: ReferenceDataDataService,
    private i18nService: I18nService,
    private entityLabResultService: EntityLabResultService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // TODO: This logic should be mutated?
    // retrieve page information
    this.route.data.subscribe((data: { personType: EntityType }) => {
      // set page person type
      this.personType = data.personType;

      // retrieve entity information
      this.route.params.subscribe((params: { caseId?: string, contactId?: string }) => {
        // get selected outbreak
        this.outbreakDataService
          .getSelectedOutbreak()
          .subscribe((selectedOutbreak: OutbreakModel) => {
            // selected outbreak
            this.selectedOutbreak = selectedOutbreak;

            // export lab results url
            this.exportLabResultsUrl = null;
            if (
              this.selectedOutbreak &&
              this.selectedOutbreak.id
            ) {
              this.exportLabResultsUrl = `/outbreaks/${this.selectedOutbreak.id}/${EntityModel.getLinkForEntityType(this.personType)}/${this.personType === EntityType.CONTACT ? params.contactId : params.caseId}/lab-results/export`;
              this.exportLabResultsFileName = `${this.i18nService.instant(this.personType === EntityType.CONTACT ? 'LNG_PAGE_LIST_CONTACTS_TITLE' : 'LNG_PAGE_LIST_CASES_TITLE')} - ${moment().format('YYYY-MM-DD')}`;
            }

            // determine entity endpoint that we need to call
            const entitySubscriber: Observable<CaseModel | ContactModel> = this.personType === EntityType.CONTACT ?
              this.contactDataService.getContact(this.selectedOutbreak.id, params.contactId) :
              this.caseDataService.getCase(this.selectedOutbreak.id, params.caseId);

            // get entity ( case / contact ) data
            entitySubscriber
              .subscribe((entityData: CaseModel | ContactModel) => {
                this.entityData = entityData;

                // update initial classification
                if (this.personType === EntityType.CASE) {
                  this.initialCaseClassification = (entityData as CaseModel).classification;
                }

                // initialize breadcrumbs
                this.initializeBreadcrumbs();

                // initialize pagination
                this.initPaginator();
                // ...and load the list of items
                this.needsRefreshList(true);
              });
          });

      });

      // initialize breadcrumbs
      this.initializeBreadcrumbs();
    });

    this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
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
     * Initialize Side Table Columns
     */
  protected initializeTableColumns() {
    this.tableColumns = this.entityLabResultService.retrieveTableColumns({
      authUser: this.authUser,
      personType: this.personType,
      selectedOutbreak: this.selectedOutbreak,
      selectedOutbreakIsActive: this.selectedOutbreakIsActive,
      options: {
        labName: (this.activatedRoute.snapshot.data.labName as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSampleType: (this.activatedRoute.snapshot.data.labSampleType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestType: (this.activatedRoute.snapshot.data.labTestType as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labTestResult: (this.activatedRoute.snapshot.data.labTestResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labResultProgress: (this.activatedRoute.snapshot.data.labResultProgress as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        labSequenceLaboratory: (this.activatedRoute.snapshot.data.labSequenceLaboratory as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        labSequenceResult: (this.activatedRoute.snapshot.data.labSequenceResult as IResolverV2ResponseModel<ReferenceDataEntryModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      },
      refreshList: () => {
        // reload data
        this.needsRefreshList(true);
      }
    });
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    this.advancedFilters = this.entityLabResultService.generateAdvancedFilters({
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
          (this.personType === EntityType.CONTACT && ContactModel.canExportLabResult(this.authUser))
        );
      },
      menuOptions: [
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
  protected initializeAddAction(): void {}

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

  // TODO: Should be deleted after inner TODO is resolved
  /**
     * Initialize Side Filters
     */
  initializeSideFilters() {
    // if there is no outbreak, we can't fully initialize side filters
    if (
      !this.selectedOutbreak ||
            !this.selectedOutbreak.id
    ) {
      return;
    }

    // init side filters
    this.availableSideFilters = [
      // TODO: Should those be added?
      new FilterModel({
        fieldName: 'dateTesting',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'notes',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'questionnaireAnswers',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
        type: FilterType.QUESTIONNAIRE_ANSWERS,
        questionnaireTemplate: this.selectedOutbreak.labResultsTemplate
      })
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
            ['/version']
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

    //   // person breadcrumbs
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
    return [
      'id',
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
      'createdByUser',
      'updatedBy',
      'updatedAt',
      'updatedByUser'
    ];
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
      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

      // refresh badges list with applied filter
      if (!triggeredByPageChange) {
        this.initializeGroupedData();
      }

      // retrieve the list of lab results
      this.labResultsList$ = this.entityLabResultService.retrieveRecords(this.selectedOutbreak.id, EntityModel.getLinkForEntityType(this.personType), this.entityData.id, this.queryBuilder)
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
      this.labResultDataService
        .getEntityLabResultsCount(this.selectedOutbreak.id, EntityModel.getLinkForEntityType(this.personType), this.entityData.id, countQueryBuilder)
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
  }

  // TODO: Left for inspiration
  /**
     * Change case classification
     * @param {LabelValuePair} classificationOption
     */
  changeCaseClassification(classificationOption: LabelValuePair) {
    if (_.isEmpty(this.entityData)) {
      return;
    }

    // show confirm dialog
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_CHANGE_CASE_EPI_CLASSIFICATION', {
        caseName: this.i18nService.instant(this.entityData.name),
        classification: this.i18nService.instant(classificationOption.value)
      })
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.caseDataService
            .modifyCase(this.selectedOutbreak.id, this.entityData.id, { classification: classificationOption.value })
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe((caseData: CaseModel) => {
              // update the initial case classification
              this.initialCaseClassification = caseData.classification;
              this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_CHANGE_CASE_EPI_CLASSIFICATION_SUCCESS_MESSAGE');
            });
        } else {
          if (answer.button === DialogAnswerButton.Cancel) {
            // update the ngModel for select
            (this.entityData as CaseModel).classification = this.initialCaseClassification;
          }
        }
      });
  }

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
                url: this.exportLabResultsUrl,
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
                    fields: this.anonymizeFields
                  },
                  groups: {
                    fields: labResultsFieldGroups,
                    required: labResultsFieldGroupsRequires
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
