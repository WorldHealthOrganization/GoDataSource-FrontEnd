import { Component, OnDestroy, OnInit } from '@angular/core';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable, throwError } from 'rxjs';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import {
  IExportFieldsGroupRequired,
  ExportFieldsGroupModelNameEnum
} from '../../../../core/models/export-fields-group.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-lab-results',
  templateUrl: './lab-results-list.component.html'
})
export class LabResultsListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_LAB_RESULTS_TITLE', '.', true),
  // ];

  // lab results list
  labResultsList$: Observable<any>;
  // lab results count
  labResultsListCount$: Observable<IBasicCount>;

  labNamesList$: Observable<any[]>;
  sampleTypesList$: Observable<any[]>;
  testTypesList$: Observable<any[]>;
  labTestResultsList$: Observable<any[]>;
  yesNoOptionsList$: Observable<any>;
  caseClassificationsList$: Observable<any[]>;
  progressOptionsList$: Observable<any[]>;
  sequenceLabOptionsList$: Observable<any[]>;
  sequenceResultOptionsList$: Observable<any[]>;

  // user list
  userList$: Observable<UserModel[]>;

  // list of export fields groups
  fieldsGroupList: LabelValuePair[];
  fieldsGroupListRequired: IExportFieldsGroupRequired;

  outbreakSubscriber: Subscription;

  // available side filters
  availableSideFilters: FilterModel[];

  // values for side filter
  savedFiltersType = Constants.APP_PAGE.LAB_RESULTS.value;

  // person type list used by filters
  personTypeSelected: EntityType[] = [];
  personTypeList: LabelValuePair[] = [];

  // provide constants to template
  Constants = Constants;
  EntityType = EntityType;
  UserSettings = UserSettings;
  ReferenceDataCategory = ReferenceDataCategory;
  LabResultModel = LabResultModel;
  CaseModel = CaseModel;
  ContactModel = ContactModel;

  // export outbreak lab results
  exportLabResultsUrl: string;
  exportLabResultsFileName: string;
  allowedExportTypes: ExportDataExtension[] = [
    ExportDataExtension.CSV,
    ExportDataExtension.XLS,
    ExportDataExtension.XLSX,
    ExportDataExtension.JSON,
    ExportDataExtension.ODS,
    ExportDataExtension.PDF
  ];
  anonymizeFields: LabelValuePair[] = [
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_ID', 'id'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID', 'personId'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN', 'dateSampleTaken'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED', 'dateSampleDelivered'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING', 'dateTesting'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT', 'dateOfResult'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME', 'labName'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID', 'sampleIdentifier'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE', 'sampleType'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE', 'testType'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR', 'testedFor'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_RESULT', 'result'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT', 'quantitativeResult'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_NOTES', 'notes'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_STATUS', 'status'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE', 'sequence'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers'),
    new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_PERSON', 'person'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_AT', 'createdAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_BY', 'createdBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_AT', 'updatedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_UPDATED_BY', 'updatedBy'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED', 'deleted'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_DELETED_AT', 'deletedAt'),
    new LabelValuePair('LNG_COMMON_MODEL_FIELD_LABEL_CREATED_ON', 'createdOn')
  ];

  // actions
  recordActions: HoverRowAction[] = [
    // View Lab Results
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_VIEW_LAB_RESULT',
      linkGenerator: (item: LabResultModel): string[] => {
        return ['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'view'];
      },
      queryParamsGenerator: (): {
        [k: string]: any;
      } => {
        return {
          fromLabResultsList: true
        };
      },
      visible: (item: LabResultModel): boolean => {
        return !item.deleted &&
                    LabResultModel.canView(this.authUser) && (
          (
            item.personType === EntityType.CASE &&
                            CaseModel.canViewLabResult(this.authUser)
          ) || (
            item.personType === EntityType.CONTACT &&
                            ContactModel.canViewLabResult(this.authUser)
          )
        );
      }
    }),

    // Modify Lab Results
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_MODIFY_LAB_RESULT',
      linkGenerator: (item: LabResultModel): string[] => {
        return ['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'modify'];
      },
      queryParamsGenerator: (): {
        [k: string]: any;
      } => {
        return {
          fromLabResultsList: true
        };
      },
      visible: (item: LabResultModel): boolean => {
        return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    LabResultModel.canModify(this.authUser) && (
          (
            item.personType === EntityType.CASE &&
                            CaseModel.canModifyLabResult(this.authUser)
          ) || (
            item.personType === EntityType.CONTACT &&
                            ContactModel.canModifyLabResult(this.authUser)
          )
        );
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Lab Results
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_DELETE_LAB_RESULT',
          click: (item: LabResultModel) => {
            this.deleteLabResult(item);
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            LabResultModel.canDelete(this.authUser) && (
              (
                item.personType === EntityType.CASE &&
                                    CaseModel.canDeleteLabResult(this.authUser)
              ) || (
                item.personType === EntityType.CONTACT &&
                                    ContactModel.canDeleteLabResult(this.authUser)
              )
            );
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (item: LabResultModel): boolean => {
            // visible only if at least one of the first two items is visible
            return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            LabResultModel.canDelete(this.authUser) && (
              (
                item.personType === EntityType.CASE &&
                                    CaseModel.canDeleteLabResult(this.authUser)
              ) || (
                item.personType === EntityType.CONTACT &&
                                    ContactModel.canDeleteLabResult(this.authUser)
              )
            );
          }
        }),

        // See questionnaire
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_MODIFY_LAB_RESULT_TAB_QUESTIONNAIRE_TITLE',
          click: (item: LabResultModel) => {
            this.router.navigate(['/lab-results', item.id , 'view-questionnaire']);
          },
          visible: (item: LabResultModel): boolean => {
            return !item.deleted &&
                            LabResultModel.canView(this.authUser);
          }
        }),

        // Restore a deleted Lab Results
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT',
          click: (item: LabResultModel) => {
            this.restoreLabResult(item);
          },
          visible: (item: LabResultModel): boolean => {
            return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            LabResultModel.canRestore(this.authUser) && (
              (
                item.personType === EntityType.CASE &&
                                    CaseModel.canRestoreLabResult(this.authUser)
              ) || (
                item.personType === EntityType.CONTACT &&
                                    ContactModel.canRestoreLabResult(this.authUser)
              )
            );
          },
          class: 'mat-menu-item-restore'
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private labResultDataService: LabResultDataService,
    private dialogService: DialogService,
    private referenceDataDataService: ReferenceDataDataService,
    private genericDataService: GenericDataService,
    private userDataService: UserDataService,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.labNamesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME).pipe(share());
    this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE).pipe(share());
    this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST).pipe(share());
    this.labTestResultsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT).pipe(share());
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions().pipe(share());
    this.progressOptionsList$ = this.genericDataService.getProgressOptionsList();
    this.sequenceLabOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_SEQUENCE_LABORATORY);
    this.sequenceResultOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_SEQUENCE_RESULT);

    // determine person type list accordingly to user permissions
    this.personTypeList = [];
    if (CaseModel.canListLabResult(this.authUser)) {
      this.personTypeList.push(
        new LabelValuePair(
          EntityType.CASE,
          EntityType.CASE
        )
      );
    }
    if (ContactModel.canListLabResult(this.authUser)) {
      this.personTypeList.push(
        new LabelValuePair(
          EntityType.CONTACT,
          EntityType.CONTACT
        )
      );
    }

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());
    // case classification
    this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

    // subscribe to the Selected Outbreak
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // export lab results url
        this.exportLabResultsUrl = null;
        if (
          this.selectedOutbreak &&
                    this.selectedOutbreak.id
        ) {
          this.exportLabResultsUrl = `/outbreaks/${this.selectedOutbreak.id}/lab-results/export`;
          this.exportLabResultsFileName = `${this.i18nService.instant('LNG_PAGE_LIST_LAB_RESULTS_TITLE')} - ${moment().format('YYYY-MM-DD')}`;
        }

        // initialize side filters
        this.initializeSideFilters();

        // initialize Side Table Columns
        this.initializeTableColumns();

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });

    // retrieve the list of export fields groups
    this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.LAB_RESULT)
      .subscribe((fieldsGroupList) => {
        this.fieldsGroupList = fieldsGroupList.toLabelValuePair(this.i18nService);
        this.fieldsGroupListRequired = fieldsGroupList.toRequiredList();
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'checkbox',
    //     required: true,
    //     excludeFromSave: true
    //   }),
    //   new VisibleColumnModel({
    //     field: 'person.visualId',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_PERSON_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'person.lastName',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_LAST_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'person.firstName',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_FIRST_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'person.classification',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sampleIdentifier',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'dateSampleTaken',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'dateSampleDelivered',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'dateOfResult',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'labName',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sampleType',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'testType',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'result',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'status',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'testedFor',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.hasSequence',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_HAS_SEQUENCE',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.dateSampleSent',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_SAMPLE_SENT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.labId',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_LAB',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.dateResult',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_DATE_RESULT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.resultId',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_RESULT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'sequence.noSequenceReason',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_SEQUENCE_NO_SEQUENCE_REASON',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'deleted',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdBy',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedBy',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedAt',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
    //     visible: false
    //   })
    // ];
    //
    // // add to list type only if we're allowed to
    // if (
    //   this.selectedOutbreak &&
    //         this.selectedOutbreak.isContactLabResultsActive
    // ) {
    //   this.tableColumns.push(new VisibleColumnModel({
    //     field: 'personType',
    //     label: 'LNG_LAB_RESULT_FIELD_LABEL_ENTITY_TYPE',
    //     visible: false
    //   }));
    // }
  }
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
      new FilterModel({
        fieldName: 'sampleIdentifier',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
        type: FilterType.TEXT,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateSampleTaken',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateSampleDelivered',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'dateOfResult',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
        type: FilterType.RANGE_DATE,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'labName',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME',
        type: FilterType.SELECT,
        options$: this.labNamesList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'sampleType',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
        type: FilterType.SELECT,
        options$: this.sampleTypesList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'testType',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
        type: FilterType.SELECT,
        options$: this.testTypesList$,
        sortable: true
      }),
      new FilterModel({
        fieldName: 'result',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT',
        type: FilterType.SELECT,
        options$: this.labTestResultsList$,
      }),
      new FilterModel({
        fieldName: 'testedFor',
        fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
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
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Lab Results list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (this.selectedOutbreak) {
      // retrieve created user & modified user information
      this.queryBuilder.include('createdByUser', true);
      this.queryBuilder.include('updatedByUser', true);

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

        // reset filter
        this.personTypeSelected = [EntityType.CASE];
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

          // reset filter
          this.personTypeSelected = [EntityType.CONTACT];
        } else {
          // can't see any labs :)
          // force filter by cases
          this.queryBuilder.filter.byEquality(
            'personType',
            '-'
          );

          // reset filter
          this.personTypeSelected = [];
        }
      } else {
        // NOT POSSIBLE TO ACCESS THIS PAGE WITHOUT HAVING AT LEAST ONE OF THE TWO PERMISSIONS ( case / contact list lab results )
      }

      // retrieve the list of lab results
      this.labResultsList$ = this.labResultDataService
        .getOutbreakLabResults(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }

  /**
     * Reset filters
     */
  resetFiltersAddDefault() {
    super.resetFiltersAddDefault();

    // reset filter
    this.personTypeSelected = [];
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (this.selectedOutbreak) {
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
      this.labResultsListCount$ = this.labResultDataService
        .getOutbreakLabResultsCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  /**
     * Delete specific lab result
     * @param {LabResultModel} labResult
     */
  deleteLabResult(labResult: LabResultModel) {
    // show confirm dialog
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT', labResult)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete lab result
          this.labResultDataService
            .deleteLabResult(this.selectedOutbreak.id, labResult.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Restore a deleted lab result
     * @param labResult
     */
  restoreLabResult(labResult: LabResultModel) {
    // show confirm dialog to confirm de action
    this.dialogService
      .showConfirm('LNG_DIALOG_CONFIRM_RESTORE_LAB_RESULT', new LabResultModel(labResult))
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // restore lab result
          this.labResultDataService
            .restoreLabResult(
              this.selectedOutbreak.id,
              EntityModel.getLinkForEntityType(labResult.personType),
              labResult.personId,
              labResult.id
            )
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Export selected records
     */
  exportSelectedLabResults() {
    // get list of selected ids
    const selectedRecords: false | string[] = this.validateCheckedRecords();
    if (!selectedRecords) {
      return;
    }

    // construct query builder
    const qb = new RequestQueryBuilder();
    qb.filter.bySelect(
      'id',
      selectedRecords,
      true,
      null
    );

    // display export dialog
    this.dialogService.showExportDialog({
      // required
      message: 'LNG_PAGE_LIST_LAB_RESULTS_EXPORT_TITLE',
      url: this.exportLabResultsUrl,
      fileName: this.exportLabResultsFileName,

      // configure
      isAsyncExport: true,
      displayUseDbColumns: true,
      displayJsonReplaceUndefinedWithNull: true,
      // exportProgress: (data) => { this.showExportProgress(data); },

      // optional
      allowedExportTypes: this.allowedExportTypes,
      queryBuilder: qb,
      displayEncrypt: true,
      displayAnonymize: true,
      displayFieldsGroupList: true,
      displayUseQuestionVariable: true,
      anonymizeFields: this.anonymizeFields,
      fieldsGroupList: this.fieldsGroupList,
      fieldsGroupListRequired: this.fieldsGroupListRequired,
      exportStart: () => { this.showLoadingDialog(); },
      exportFinished: () => { this.closeLoadingDialog(); }
    });
  }
}
