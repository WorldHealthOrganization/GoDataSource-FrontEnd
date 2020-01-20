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
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-case-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-case-lab-result.component.html',
    styleUrls: ['./create-case-lab-result.component.less']
})
export class CreateCaseLabResultComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

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

    // constants
    CaseModel = CaseModel;

    // authenticated user
    authUser: UserModel;

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

    /**
     * Constructor
     */
    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private snackbarService: SnackbarService,
        private router: Router,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private authDataService: AuthDataService,
        private formHelper: FormHelperService,
        private labResultDataService: LabResultDataService,
        private dialogService: DialogService,
        private redirectService: RedirectService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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

                                // initialize page breadcrumbs
                                this.initializeBreadcrumbs();
                            });
                    });
            });

        // initialize page breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // case list
        if (CaseModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // case view
        if (
            this.caseData &&
            CaseModel.canView(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(this.caseData.name, `/cases/${this.caseData.id}/view`)
            );
        }

        // lab result list
        if (LabResultModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', `/cases/${this.caseData.id}/lab-results`)
            );
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_CREATE_CASE_LAB_RESULT_TITLE', '.', true)
        );
    }

    /**
     * Create lab result
     * @param stepForms
     */
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

                    // navigate to proper page
                    this.disableDirtyConfirm();
                    if (LabResultModel.canModify(this.authUser)) {
                        this.router.navigate([`/cases/${this.caseData.id}/lab-results/${newLabResult.id}/modify`]);
                    } else if (LabResultModel.canView(this.authUser)) {
                        this.router.navigate([`/cases/${this.caseData.id}/lab-results/${newLabResult.id}/view`]);
                    } else if (LabResultModel.canList(this.authUser)) {
                        this.router.navigate([`/cases/${this.caseData.id}/lab-results`]);
                    } else {
                        // fallback to current page since we already know that we have access to this page
                        this.redirectService.to(
                            [`/cases/${this.caseData.id}/lab-results/create`]
                        );
                    }
                });
        }
    }
}
