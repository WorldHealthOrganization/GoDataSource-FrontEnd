import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
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
import { UserSettings } from '../../../../core/models/user.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { catchError, share, tap } from 'rxjs/operators';
import { Constants } from '../../../../core/models/constants';
import { throwError } from 'rxjs';

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

    // constants
    ReferenceDataCategory = ReferenceDataCategory;
    UserSettings = UserSettings;

    // available side filters
    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType = Constants.APP_PAGE.CASE_LAB_RESULTS.value;

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private labResultDataService: LabResultDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // retrieve case information
        this.route.params.subscribe((params: { caseId }) => {
            // get selected outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    // selected outbreak
                    this.selectedOutbreak = selectedOutbreak;

                    // get case data
                    this.caseDataService
                        .getCase(this.selectedOutbreak.id, params.caseId)
                        .subscribe((caseData: CaseModel) => {
                            this.caseId = caseData.id;

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

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize side filters
        this.initializeSideFilters();
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
                field: 'deleted',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_DELETED',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Initialize Side Filters
     */
    initializeSideFilters() {
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'sampleIdentifier',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_SAMPLE_LAB_ID',
                type: FilterType.TEXT,
                sortable: true,
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
                sortable: true,
            }),
            new FilterModel({
                fieldName: 'notes',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_NOTES',
                type: FilterType.TEXT,
                sortable: true,
            }),
            new FilterModel({
                fieldName: 'status',
                fieldLabel: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_STATUS',
                type: FilterType.TEXT,
                sortable: true,
            })
        ];
    }

    /**
     * Re(load) the Case lab results list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (
            this.selectedOutbreak &&
            this.caseId
        ) {
            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService.getCaseLabResults(this.selectedOutbreak.id, this.caseId, this.queryBuilder)
                .pipe(tap(this.checkEmptyList.bind(this)));
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
            this.labResultsListCount$ = this.labResultDataService.getCaseLabResultsCount(this.selectedOutbreak.id, this.caseId, countQueryBuilder).pipe(share());
        }
    }

    deleteLabResult(labResult: LabResultModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete lab result
                    this.labResultDataService
                        .deleteLabResult(this.selectedOutbreak.id, this.caseId, labResult.id)
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
}
