import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute, Router } from '@angular/router';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { Observable } from 'rxjs';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
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
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-case-lab-results-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './case-lab-results-list.component.html',
    styleUrls: ['./case-lab-results-list.component.less']
})
export class CaseLabResultsListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    // case
    caseId: string;
    caseData: CaseModel = new CaseModel();
    initialCaseClassification: string;

    // user list
    userList$: Observable<UserModel[]>;

    // selected Outbreak
    selectedOutbreak: OutbreakModel;

    // list of existing case lab results
    labResultsList$: Observable<LabResultModel[]>;
    labResultsListCount$: Observable<any>;

    labTestResultsList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    sampleTypesList$: Observable<any[]>;
    labNamesList$: Observable<any[]>;
    yesNoOptionsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;

    // constants
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    // available side filters
    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType = Constants.APP_PAGE.CASE_LAB_RESULTS.value;

    // authenticated user
    authUser: UserModel;

    recordActions: HoverRowAction[] = [
        // View Case Lab Results
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_VIEW_LAB_RESULT',
            click: (item: LabResultModel) => {
                this.router.navigate(['/cases', item.personId, 'lab-results', item.id, 'view']);
            },
            visible: (item: LabResultModel): boolean => {
                return !item.deleted;
            }
        }),

        // Modify Case Lab Results
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_MODIFY_LAB_RESULT',
            click: (item: LabResultModel) => {
                this.router.navigate(['/cases', item.personId, 'lab-results', item.id, 'modify']);
            },
            visible: (item: LabResultModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    this.hasLabResultWriteAccess();
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Case Lab Results
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_DELETE_LAB_RESULT',
                    click: (item: LabResultModel) => {
                        this.deleteLabResult(item);
                    },
                    visible: (item: LabResultModel): boolean => {
                        return !item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasLabResultWriteAccess();
                    },
                    class: 'mat-menu-item-delete'
                }),

                // Restore a deleted Case Lab Results
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT',
                    click: (item: LabResultModel) => {
                        this.restoreLabResult(item);
                    },
                    visible: (item: LabResultModel): boolean => {
                        return item.deleted &&
                            this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            this.hasLabResultWriteAccess();
                    },
                    class: 'mat-menu-item-restore'
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private labResultDataService: LabResultDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private userDataService: UserDataService,
        private i18nService: I18nService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        // retrieve case information
        this.route.params.subscribe((params: { caseId }) => {
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // selected outbreak
                    this.selectedOutbreak = selectedOutbreak;

                    // initialize side filters
                    this.initializeSideFilters();

                    // get case data
                    this.caseDataService
                        .getCase(this.selectedOutbreak.id, params.caseId)
                        .subscribe((caseData: CaseModel) => {
                            this.caseId = caseData.id;
                            this.caseData = new CaseModel(caseData);
                            this.initialCaseClassification = caseData.classification;

                            // setup breadcrumbs
                            this.breadcrumbs.push(new BreadcrumbItemModel(caseData.name, `/cases/${this.caseId}/view`));
                            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE', '.', true));

                            // initialize pagination
                            this.initPaginator();
                            // ...and load the list of items
                            this.needsRefreshList(true);
                    });
                });
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
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'sampleIdentifier',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID'
            }),
            new VisibleColumnModel({
                field: 'dateSampleTaken',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN'
            }),
            new VisibleColumnModel({
                field: 'dateSampleDelivered',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED'
            }),
            new VisibleColumnModel({
                field: 'dateOfResult',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT'
            }),
            new VisibleColumnModel({
                field: 'labName',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_LAB_NAME'
            }),
            new VisibleColumnModel({
                field: 'sampleType',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE'
            }),
            new VisibleColumnModel({
                field: 'testType',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_TEST_TYPE'
            }),
            new VisibleColumnModel({
                field: 'result',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_RESULT'
            }),
            new VisibleColumnModel({
                field: 'testedFor',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_TESTED_FOR'
            }),
            new VisibleColumnModel({
                field: 'deleted',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_UPDATED_AT',
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
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dateSampleTaken',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_TAKEN',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dateSampleDelivered',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_SAMPLE_DELIVERED',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'dateOfResult',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_OF_RESULT',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'labName',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_LAB_NAME',
                type: FilterType.SELECT,
                options$: this.labNamesList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'sampleType',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_SAMPLE_TYPE',
                type: FilterType.SELECT,
                options$: this.sampleTypesList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'testType',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_TEST_TYPE',
                type: FilterType.SELECT,
                options$: this.testTypesList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'result',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_RESULT',
                type: FilterType.SELECT,
                options$: this.labTestResultsList$,
            }),
            new FilterModel({
                fieldName: 'dateTesting',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DATE_TESTING',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'testedFor',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'notes',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_NOTES',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'status',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_STATUS',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'questionnaireAnswers',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_QUESTIONNAIRE_ANSWERS',
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
            this.caseId
        ) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService.getCaseLabResults(this.selectedOutbreak.id, this.caseId, this.queryBuilder)
                .pipe(
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
            this.caseId
        ) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.labResultsListCount$ = this.labResultDataService.getCaseLabResultsCount(this.selectedOutbreak.id, this.caseId, countQueryBuilder).pipe(share());
        }
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    deleteLabResult(labResult: LabResultModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete lab result
                    this.labResultDataService
                        .deleteLabResult(this.selectedOutbreak.id, labResult.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

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
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_LAB_RESULT', new LabResultModel(labResult))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // restore lab result
                    this.labResultDataService
                        .restoreLabResult(this.selectedOutbreak.id, labResult.personId, labResult.id)
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
        if (_.isEmpty(this.caseData)) {
            return;
        }

        const translateData = {
            caseName: this.i18nService.instant(this.caseData.name),
            classification: this.i18nService.instant(classificationOption.value)
        };
        // show confirm dialog
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_CHANGE_CASE_EPI_CLASSIFICATION', translateData)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.caseDataService.modifyCase(this.selectedOutbreak.id, this.caseId, {classification: classificationOption.value})
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
                        this.caseData.classification = this.initialCaseClassification;
                    }
                }
            });
    }

    /**
     * Check if we have write access to lab results
     * @returns {boolean}
     */
    hasLabResultWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }
}
