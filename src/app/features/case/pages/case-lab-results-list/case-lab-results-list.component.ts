import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ActivatedRoute } from '@angular/router';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { Observable } from 'rxjs/Observable';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import * as moment from 'moment';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';

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

    // constants
    ReferenceDataCategory = ReferenceDataCategory;

    // available side filters
    availableSideFilters: FilterModel[];

    // available lab names
    labNamesList$;

    // available sample types
    sampleTypeList$;

    // available test types
    testTypesList$;

    // available results list
    resultsList$;

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private labResultDataService: LabResultDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super();
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
                            this.breadcrumbs.push(new BreadcrumbItemModel(caseData.name, `/cases/${this.caseId}/modify`));
                            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE', '.', true));

                            // retrieve lab data
                            this.refreshList();
                    });
                });
        });

        // get the option list for side filters
        this.resultsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT);
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST);
        this.sampleTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE);
        this.labNamesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME);

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
                options$: this.sampleTypeList$,
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
                options$: this.resultsList$,
            }),
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
            this.genericDataService.getServerUTCCurrentDateTime()
                .subscribe((serverDateTime: string) => {
                    // display only unresolved followups
                    this.queryBuilder.filter.where({
                        or: [{
                                dateOfResult: {
                                    lte: moment(serverDateTime).endOf('day').toISOString()
                                }
                            }, {
                                dateOfResult: {
                                    eq: null
                                }
                        }]
                    }, true);

                    // retrieve the list of lab results
                    this.labResultsList$ = this.labResultDataService.getCaseLabResults(this.selectedOutbreak.id, this.caseId, this.queryBuilder);
                });
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'sampleIdentifier',
            'dateSampleTaken',
            'dateSampleDelivered',
            'dateOfResult',
            'labName',
            'sampleType',
            'testType',
            'result',

            // since we have writeCase permission because of module.routing we don't need to check anything else
            'actions'
        ];
    }

    deleteLabResult(labResult: LabResultModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_LAB_RESULT')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete lab result
                    this.labResultDataService
                        .deleteLabResult(this.selectedOutbreak.id, this.caseId, labResult.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CASE_LAB_RESULTS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.refreshList();
                        });
                }
            });
    }
}
