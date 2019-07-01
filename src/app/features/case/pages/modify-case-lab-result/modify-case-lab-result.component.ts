import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable, throwError } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { LabResultModel } from '../../../../core/models/lab-result.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import * as moment from 'moment';
import { Moment } from 'moment';
import * as _ from 'lodash';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from 'app/core/models/entity-type';
import { CaseModel } from '../../../../core/models/case.model';

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

    // lab results
    labResultData: LabResultModel = new LabResultModel();

    // variable for breadcrumbs manipulation if we're coming from lab result list
    fromLabResultsList: boolean = false;

    sampleTypesList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    resultTypesList$: Observable<any[]>;
    labNameOptionsList$: Observable<any[]>;
    progressOptionsList$: Observable<any[]>;

    serverToday: Moment = null;

    // constants
    EntityType = EntityType;

    /**
     * Check if we need to display warning message that case date of onset is after sample taken date
     */
    get displayOnsetDateWarningMessage(): boolean {
        return this.labResultData &&
            this.labResultData.entity &&
            (this.labResultData.entity as CaseModel).dateOfOnset &&
            this.labResultData.dateSampleTaken &&
            moment((this.labResultData.entity as CaseModel).dateOfOnset).startOf('day').isAfter(moment(this.labResultData.dateSampleTaken).startOf('day'));
    }

    constructor(
        protected route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
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
                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.selectedOutbreak = selectedOutbreak;
                        if (this.selectedOutbreak) {
                            // params.caseId can actually be either a case or a contact lately
                            // construct query builder
                            const qb: RequestQueryBuilder = new RequestQueryBuilder();
                            qb.filter
                                .where({
                                    id: params.labResultId
                                });

                            // get lab results
                            this.labResultDataService
                                .getOutbreakLabResults(this.selectedOutbreak.id, qb)
                                .pipe(
                                    catchError((err) => {
                                        this.snackbarService.showApiError(err);
                                        this.disableDirtyConfirm();
                                        this.router.navigate(['/cases/lab-results']);
                                        return throwError(err);
                                    })
                                )
                                .subscribe((labResults: LabResultModel[]) => {
                                    // not found ?
                                    if (_.isEmpty(labResults)) {
                                        this.disableDirtyConfirm();
                                        this.router.navigate(['/cases/lab-results']);
                                        return;
                                    }

                                    // creating labResult and caseData with the first item from response because api
                                    // is returning an array of objects. In this case there can't be more than one item in the response
                                    this.labResultData = new LabResultModel(labResults[0]);

                                    // update breadcrumbs
                                    this.createBreadcrumbs();
                                });
                        }
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
                this.labResultData.id,
                dirtyFields
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((modifiedLabResult: LabResultModel) => {
                // update model
                const parentData = this.labResultData.entity;
                this.labResultData = modifiedLabResult;
                this.labResultData.entity = parentData;

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
        // construct breadcrumbs
        this.breadcrumbs = [
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CASES_TITLE',
                '/cases'
            )
        ];

        // add case model only if necessary
        if (
            !this.fromLabResultsList &&
            this.labResultData.entity &&
            this.labResultData.entity.id
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.labResultData.entity.name,
                    `/cases/${this.labResultData.entity.id}/view`
                )
            );
        }

        // add remaining breadcrumbs
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_CASE_LAB_RESULTS_TITLE',
                this.fromLabResultsList || !this.labResultData.entity || this.labResultData.entity.id ?
                '/cases/lab-results' :
                `/cases/${this.labResultData.entity.id}/lab-results`
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
