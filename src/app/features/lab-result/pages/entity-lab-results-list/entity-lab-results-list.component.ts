import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { Observable, throwError } from 'rxjs';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';
import { HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ContactModel } from '../../../../core/models/contact.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { moment } from '../../../../core/helperClasses/x-moment';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-entity-lab-results-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-lab-results-list.component.html',
    styleUrls: ['./entity-lab-results-list.component.less']
})
export class EntityLabResultsListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // entity
    personType: EntityType;
    entityData: CaseModel | ContactModel;

    initialCaseClassification: string;

    // user list
    userList$: Observable<UserModel[]>;

    // loading dialog handler
    loadingDialog: LoadingDialogModel;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of existing case lab results
    labResultsList$: Observable<LabResultModel[]>;
    labResultsListCount$: Observable<IBasicCount>;

    labTestResultsList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    sampleTypesList$: Observable<any[]>;
    labNamesList$: Observable<any[]>;
    yesNoOptionsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;
    progressOptionsList$: Observable<any[]>;

    // constants
    ReferenceDataCategory = ReferenceDataCategory;
    CaseModel = CaseModel;
    ContactModel = ContactModel;
    EntityType = EntityType;
    EntityModel = EntityModel;
    LabResultModel = LabResultModel;

    // available side filters
    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType;

    // side filter
    tableColumnsUserSettingsKey: UserSettings;

    // authenticated user
    authUser: UserModel;

    // export outbreak lab results
    exportLabResultsUrl: string;
    exportLabResultsFileName: string;
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS,
        ExportDataExtension.PDF
    ];
    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID', 'sampleIdentifier'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN', 'dateSampleTaken'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED', 'dateSampleDelivered'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING', 'dateTesting'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT', 'dateOfResult'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME', 'labName'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE', 'sampleType'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE', 'testType'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_RESULT', 'result'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_NOTES', 'notes'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_STATUS', 'status'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_QUANTITATIVE_RESULT', 'quantitativeResult'),
        new LabelValuePair('LNG_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers')
    ];

    // actions
    recordActions: HoverRowAction[] = [
        // View Lab Results
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_VIEW_LAB_RESULT',
            click: (item: LabResultModel) => {
                // case / contact lab result ?
                this.router.navigate(['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'view']);
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

        // Modify Case Lab Results
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_MODIFY_LAB_RESULT',
            click: (item: LabResultModel) => {
                // case / contact lab result ?
                this.router.navigate(['/lab-results', EntityModel.getLinkForEntityType(item.personType), item.personId, item.id, 'modify']);
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
        private authDataService: AuthDataService,
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
        private labResultDataService: LabResultDataService,
        private snackbarService: SnackbarService,
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
        // progress options
        this.progressOptionsList$ = this.genericDataService.getProgressOptionsList();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // retrieve page information
        this.route.data.subscribe((data: { personType: EntityType }) => {
            // set page person type
            this.personType = data.personType;

            // determine saved filter key from person type ( case / contact lab results )
            this.savedFiltersType = this.personType === EntityType.CONTACT ?
                Constants.APP_PAGE.CONTACT_LAB_RESULTS.value :
                Constants.APP_PAGE.CASE_LAB_RESULTS.value;

            // determine side filter key
            this.tableColumnsUserSettingsKey = this.personType === EntityType.CONTACT ?
                UserSettings.CONTACT_LAB_FIELDS :
                UserSettings.CASE_LAB_FIELDS;

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

                        // initialize side filters
                        this.initializeSideFilters();

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

        // get the option list for side filters
        this.labTestResultsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT).pipe(share());
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST).pipe(share());
        this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE).pipe(share());
        this.labNamesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME).pipe(share());
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // entity list
        if (
            this.personType === EntityType.CONTACT &&
            ContactModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        } else if (
            this.personType === EntityType.CASE &&
            CaseModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
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
                    new BreadcrumbItemModel(this.entityData.name, `/contacts/${this.entityData.id}/view`)
                );
            } else if (
                this.personType === EntityType.CASE &&
                CaseModel.canView(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.entityData.name, `/cases/${this.entityData.id}/view`)
                );
            }
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', '.', true)
        );
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'sampleIdentifier',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID'
            }),
            new VisibleColumnModel({
                field: 'dateSampleTaken',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN'
            }),
            new VisibleColumnModel({
                field: 'dateSampleDelivered',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED'
            }),
            new VisibleColumnModel({
                field: 'dateOfResult',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT'
            }),
            new VisibleColumnModel({
                field: 'labName',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_LAB_NAME'
            }),
            new VisibleColumnModel({
                field: 'sampleType',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE'
            }),
            new VisibleColumnModel({
                field: 'testType',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_TEST_TYPE'
            }),
            new VisibleColumnModel({
                field: 'result',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_RESULT'
            }),
            new VisibleColumnModel({
                field: 'status',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS'
            }),
            new VisibleColumnModel({
                field: 'testedFor',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR'
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        ];
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
                fieldName: 'dateTesting',
                fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'testedFor',
                fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'notes',
                fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_NOTES',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'status',
                fieldLabel: 'LNG_LAB_RESULT_FIELD_LABEL_STATUS',
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
     * Re(load) the Case lab results list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (
            this.selectedOutbreak &&
            this.personType &&
            this.entityData
        ) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService
                .getEntityLabResults(this.selectedOutbreak.id, EntityModel.getLinkForEntityType(this.personType), this.entityData.id, this.queryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap((data: any[]) => {
                        finishCallback(data);
                    })
                );
        } else {
            finishCallback([]);
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (
            this.selectedOutbreak &&
            this.personType &&
            this.entityData
        ) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.labResultsListCount$ = this.labResultDataService
                .getEntityLabResultsCount(this.selectedOutbreak.id, EntityModel.getLinkForEntityType(this.personType), this.entityData.id, countQueryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    }),
                    share()
                );
        }
    }

    /**
     * Delete lab results
     */
    deleteLabResult(labResult: LabResultModel) {
        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete lab result
                    this.labResultDataService
                        .deleteLabResult(this.selectedOutbreak.id, labResult.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

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
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

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
                        .modifyCase(this.selectedOutbreak.id, this.entityData.id, {classification: classificationOption.value})
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe((caseData: CaseModel) => {
                            // update the initial case classification
                            this.initialCaseClassification = caseData.classification;
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LAB_RESULTS_ACTION_CHANGE_CASE_EPI_CLASSIFICATION_SUCCESS_MESSAGE');
                        });
                } else {
                    if (answer.button === DialogAnswerButton.Cancel) {
                        // update the ngModel for select
                        (this.entityData as CaseModel).classification = this.initialCaseClassification;
                    }
                }
            });
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
