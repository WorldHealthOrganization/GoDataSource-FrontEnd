import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { Router } from '@angular/router';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-lab-results',
    templateUrl: './lab-results-list.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./lab-results-list.component.less']
})
export class LabResultsListComponent extends ListComponent implements OnInit, OnDestroy {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_LAB_RESULTS_TITLE', '.', true),
    ];
    // lab results list
    labResultsList$: Observable<any>;
    // lab results count
    labResultsListCount$: Observable<any>;

    labNamesList$: Observable<any[]>;
    sampleTypesList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    labTestResultsList$: Observable<any[]>;
    yesNoOptionsList$: Observable<any>;
    caseClassificationsList$: Observable<any[]>;

    // user list
    userList$: Observable<UserModel[]>;

    // authenticated user
    authUser: UserModel;
    // selected outbreak
    selectedOutbreak: OutbreakModel;

    outbreakSubscriber: Subscription;

    // available side filters
    availableSideFilters: FilterModel[];

    // values for side filter
    savedFiltersType = Constants.APP_PAGE.LAB_RESULTS.value;

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    recordActions: HoverRowAction[] = [
        // View Case Lab Results
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_VIEW_LAB_RESULT',
            click: (item: LabResultModel) => {
                this.router.navigate(['/cases', item.personId, 'lab-results', item.id, 'view'], {
                    queryParams: {
                        fromLabResultsList: true
                    }
                });
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
                this.router.navigate(['/cases', item.personId, 'lab-results', item.id, 'modify'], {
                    queryParams: {
                        fromLabResultsList: true
                    }
                });
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
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private labResultDataService: LabResultDataService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private userDataService: UserDataService
    ) {
        super(snackbarService);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.labNamesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME).pipe(share());
        this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE).pipe(share());
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST).pipe(share());
        this.labTestResultsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT).pipe(share());
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions().pipe(share());

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());
        // case classification
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION);

        // subscribe to the Selected Outbreak
        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize side filters
                this.initializeSideFilters();

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'case.visualId',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_PERSON_ID'
            }),
            new VisibleColumnModel({
                field: 'case.lastName',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'case.firstName',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'case.classification',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_CLASSIFICATION'
            }),
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
                fieldName: 'case.visualId',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_PERSON_ID',
                type: FilterType.TEXT,
            }),
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
                fieldName: 'testedFor',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_TESTED_FOR',
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
     * Re(load) the Lab Results list
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            // retrieve created user & modified user information
            this.queryBuilder.include('createdByUser', true);
            this.queryBuilder.include('updatedByUser', true);

            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService
                .getOutbreakLabResults(this.selectedOutbreak.id, this.queryBuilder)
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
        if (this.selectedOutbreak) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.labResultsListCount$ = this.labResultDataService
                .getOutbreakLabResultsCount(this.selectedOutbreak.id, countQueryBuilder)
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
     * Check if we have write access to lab results
     * @returns {boolean}
     */
    hasLabResultWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Delete specific lab result
     * @param {LabResultModel} labResult
     */
    deleteLabResult(labResult: LabResultModel) {
        // show confirm dialog
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT', labResult)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete lab result
                    this.labResultDataService.deleteLabResult(this.selectedOutbreak.id, labResult.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

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

}
