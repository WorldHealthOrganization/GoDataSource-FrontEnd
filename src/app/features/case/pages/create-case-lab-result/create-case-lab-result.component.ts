import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-create-case-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case-lab-result.component.html',
    styleUrls: ['./create-case-lab-result.component.less']
})
export class CreateCaseLabResultComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

    labResultData: LabResultModel = new LabResultModel();

    sampleTypesList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    resultTypesList$: Observable<any[]>;
    labNameOptionsList$: Observable<any[]>;
    progressOptionsList$: Observable<any[]>;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    // case data
    caseData: CaseModel = new CaseModel();

    serverToday: Moment = moment();

    /**
     * Check if we need to display warning message that case date of onset is after sample taken date
     */
    get displayOnsetDateWarningMessage(): boolean {
        return this.caseData &&
            this.labResultData &&
            this.caseData.dateOfOnset &&
            this.labResultData.dateSampleTaken &&
            moment(this.caseData.dateOfOnset).startOf('day').isAfter(moment(this.labResultData.dateSampleTaken).startOf('day'));
    }

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private snackbarService: SnackbarService,
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private formHelper: FormHelperService,
        private labResultDataService: LabResultDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
        this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE);
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST);
        this.resultTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT);
        this.labNameOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME);
        this.progressOptionsList$ = this.genericDataService.getProgressOptionsList();

        this.route.params
            .subscribe((params: {caseId}) => {
                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        // outbreak
                        this.selectedOutbreak = selectedOutbreak;

                        // get case data
                        this.caseDataService
                            .getCase(this.selectedOutbreak.id, params.caseId)
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showError(err.message);

                                    // Case not found; navigate back to Cases list
                                    this.disableDirtyConfirm();
                                    this.router.navigate(['/cases']);

                                    return throwError(err);
                                })
                            )
                            .subscribe((caseData: CaseModel) => {
                                this.caseData = caseData;

                                // add new breadcrumb: Case Modify page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(caseData.name, `/cases/${this.caseData.id}/view`)
                                );
                                // add new breadcrumb: Lab Results list page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE', `/cases/${this.caseData.id}/lab-results`)
                                );
                                // add new breadcrumb : page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_LAB_RESULT_TITLE', '.', true)
                                );
                            });
                    });
            });
    }

    createLabResult(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add new Lab Result
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.labResultDataService
                .createLabResult(this.selectedOutbreak.id, this.caseData.id, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        // hide dialog
                        loadingDialog.close();

                        return throwError(err);
                    })
                )
                .subscribe((newLabResult: LabResultModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CASE_LAB_RESULT_ACTION_CREATE_CASE_LAB_RESULT_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/cases/${this.caseData.id}/lab-results/${newLabResult.id}/modify`]);
                });
        }
    }
}
