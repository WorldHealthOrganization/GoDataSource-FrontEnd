import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Moment } from 'moment';
import * as _ from 'lodash';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-case-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-case-lab-result.component.html',
    styleUrls: ['./modify-case-lab-result.component.less']
})
export class ModifyCaseLabResultComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    authUser: UserModel;

    // selected outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();

    // case data
    caseData: CaseModel = new CaseModel();

    // lab results
    labResultData: LabResultModel = new LabResultModel();
    labResultId: string;

    // variable for breadcrumbs manipulation if we're coming from lab result list
    fromLabResultsList: boolean = false;

    sampleTypesList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    resultTypesList$: Observable<any[]>;
    labNameOptionsList$: Observable<any[]>;
    progressOptionsList$: Observable<any[]>;

    serverToday: Moment = null;

    constructor(
        protected route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private snackbarService: SnackbarService,
        private router: Router,
        private formHelper: FormHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private labResultDataService: LabResultDataService,
        private authDataService: AuthDataService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
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

        this.route.queryParams.
            subscribe((queryParams: {fromLabResultsList}) => {
            if (!_.isEmpty(queryParams)) {
                this.fromLabResultsList = JSON.parse(queryParams.fromLabResultsList);
            }
        });

        this.route.params
            .subscribe((params: {caseId, labResultId}) => {
                this.labResultId = params.labResultId;
                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
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
                                this.caseData = caseData;

                                // get relationship data
                                this.labResultDataService
                                    .getLabResult(this.selectedOutbreak.id, params.caseId, params.labResultId)
                                    .catch((err) => {
                                        this.snackbarService.showError(err.message);

                                        this.disableDirtyConfirm();
                                        this.router.navigate([`/cases/${params.caseId}/lab-results`]);

                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe((labResultData) => {
                                        this.labResultData = new LabResultModel(labResultData);

                                        // update breadcrumb
                                        this.createBreadcrumbs();
                                    });

                            });
                    });
            });
    }

    modifyLabResult(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the lab result
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.labResultDataService
            .modifyLabResult(
                this.selectedOutbreak.id,
                this.caseData.id,
                this.labResultData.id,
                dirtyFields
            )
            .catch((err) => {
                this.snackbarService.showError(err.message);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedLabResult: LabResultModel) => {
                // update model
                this.labResultData = modifiedLabResult;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CASE_LAB_RESULT_ACTION_MODIFY_CASE_LAB_RESULT_SUCCESS_MESSAGE');

                // update breadcrumb
                this.createBreadcrumbs();

                // hide dialog
                loadingDialog.close();
            });
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CASES_TITLE',
                '/cases'
            )
        ];

        // add case model only if necessary
        if (!this.fromLabResultsList) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.caseData.name,
                    `/cases/${this.caseData.id}/modify`
                )
            );
        }

        // add remaining breadcrumbs
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE',
                this.fromLabResultsList ?
                    '/cases/lab-results' :
                    `/cases/${this.caseData.id}/lab-results`
            ),

            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CASE_LAB_RESULT_TITLE' : 'LNG_PAGE_MODIFY_CASE_LAB_RESULT_TITLE',
                null,
                true,
                {},
                this.labResultData
            )
        );
    }

}
