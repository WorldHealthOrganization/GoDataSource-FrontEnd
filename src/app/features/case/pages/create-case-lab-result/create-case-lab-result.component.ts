import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { NgForm } from '@angular/forms';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { Moment } from 'moment';
import { DialogService } from '../../../../core/services/helper/dialog.service';

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

    caseId: string;

    serverToday: Moment = null;

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

        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((curDate) => {
                this.serverToday = curDate;
            });

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
                            .catch((err) => {
                                this.snackbarService.showError(err.message);

                                // Case not found; navigate back to Cases list
                                this.disableDirtyConfirm();
                                this.router.navigate(['/cases']);

                                return ErrorObservable.create(err);
                            })
                            .subscribe((caseData: CaseModel) => {
                                this.caseId = caseData.id;

                                // add new breadcrumb: Case Modify page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(caseData.name, `/cases/${this.caseId}/modify`),
                                );
                                // add new breadcrumb: Lab Results list page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE', `/cases/${this.caseId}/lab-results`)
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
                .createLabResult(this.selectedOutbreak.id, this.caseId, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    // hide dialog
                    loadingDialog.close();

                    return ErrorObservable.create(err);
                })
                .subscribe((newLabResult: LabResultModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CASE_LAB_RESULT_ACTION_CREATE_CASE_LAB_RESULT_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/cases/${this.caseId}/lab-results/${newLabResult.id}/modify`]);
                });
        }
    }
}
