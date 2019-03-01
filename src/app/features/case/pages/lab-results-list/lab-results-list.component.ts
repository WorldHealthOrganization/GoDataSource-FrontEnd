import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs/Observable';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import * as _ from 'lodash';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
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
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-lab-results',
    templateUrl: './lab-results-list.component.html',
    encapsulation: ViewEncapsulation.None,
    styleUrls: ['./lab-results-list.component.less']
})
export class LabResultsListComponent extends ListComponent implements OnInit {

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

    // authenticated user
    authUser: UserModel;
    // selected outbreak
    selectedOutbreak: OutbreakModel;

    // available side filters
    availableSideFilters: FilterModel[];

    // provide constants to template
    Constants = Constants;
    EntityType = EntityType;
    UserSettings = UserSettings;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        protected snackbarService: SnackbarService,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private labResultDataService: LabResultDataService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService
    ) {
        super(snackbarService);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // initialize side filters
        this.initializeSideFilters();

        this.labNamesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME).share();
        this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE).share();
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST).share();
        this.labTestResultsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT).share();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'caseLastName',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'caseFirstName',
                label: 'LNG_CASE_LAB_RESULT_FIELD_LABEL_CASE_FIRST_NAME'
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
            })
        ];
    }

    /**
     * Re(load) the Lab Results list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            // retrieve the list of lab results
            this.labResultsList$ = this.labResultDataService.getOutbreakLabResults(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(tap(this.checkEmptyList.bind(this)));
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
            this.labResultsListCount$ = this.labResultDataService.getOutbreakLabResultsCount(this.selectedOutbreak.id, countQueryBuilder).share();
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
                    this.labResultDataService.deleteLabResult(this.selectedOutbreak.id, labResult.case.id, labResult.id)
                        .catch((err) => {
                            this.snackbarService.showApiError(err);

                            return ErrorObservable.create(err);
                        })
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
     * @param {string} labResultId
     */
    restoreLabResult(labResult: LabResultModel) {
        // show confirm dialog to confirm de action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_LAB_RESULT', new LabResultModel(labResult))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // restore lab result
                    this.labResultDataService
                        .restoreLabResult(this.selectedOutbreak.id, labResult.personId, labResult.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_LAB_RESULTS_ACTION_RESTORE_LAB_RESULT_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
