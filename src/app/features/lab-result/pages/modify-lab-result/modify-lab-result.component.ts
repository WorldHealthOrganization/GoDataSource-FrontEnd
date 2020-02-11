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
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import * as _ from 'lodash';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from 'app/core/models/entity-type';
import { CaseModel } from '../../../../core/models/case.model';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { ContactModel } from '../../../../core/models/contact.model';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-modify-lab-result',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-lab-result.component.html',
    styleUrls: ['./modify-lab-result.component.less']
})
export class ModifyLabResultComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    authUser: UserModel;

    // selected outbreak
    selectedOutbreak: OutbreakModel = new OutbreakModel();

    // lab results
    labResultData: LabResultModel = new LabResultModel();

    // constants
    CaseModel = CaseModel;
    ContactModel = ContactModel;
    LabResultModel = LabResultModel;
    EntityType = EntityType;
    EntityModel = EntityModel;

    // entity data
    personType: EntityType;

    // variable for breadcrumbs manipulation if we're coming from lab result list
    fromLabResultsList: boolean = false;

    sampleTypesList$: Observable<any[]>;
    testTypesList$: Observable<any[]>;
    resultTypesList$: Observable<any[]>;
    labNameOptionsList$: Observable<any[]>;
    progressOptionsList$: Observable<any[]>;

    serverToday: Moment = moment();

    /**
     * Check if we need to display warning message that case date of onset is after sample taken date
     */
    get displayOnsetDateWarningMessage(): boolean {
        return this.labResultData &&
            this.labResultData.person &&
            this.personType === EntityType.CASE &&
            (this.labResultData.person as CaseModel).dateOfOnset &&
            this.labResultData.dateSampleTaken &&
            moment((this.labResultData.person as CaseModel).dateOfOnset).startOf('day').isAfter(moment(this.labResultData.dateSampleTaken).startOf('day'));
    }

    /**
     * Constructor
     */
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
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.sampleTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_SAMPLE);
        this.testTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.TYPE_OF_LAB_TEST);
        this.resultTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_TEST_RESULT);
        this.labNameOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.LAB_NAME);
        this.progressOptionsList$ = this.genericDataService.getProgressOptionsList();

        this.route.queryParams.
            subscribe((queryParams: {fromLabResultsList}) => {
            if (!_.isEmpty(queryParams)) {
                this.fromLabResultsList = JSON.parse(queryParams.fromLabResultsList);
            }
        });

        // show loading
        this.showLoadingDialog(false);

        // retrieve page information
        this.route.data.subscribe((data: { personType: EntityType }) => {
            // set page person type
            this.personType = data.personType;

            // retrieve entity information
            this.route.params
                .subscribe((params: { labResultId }) => {
                    // get selected outbreak
                    this.outbreakDataService
                        .getSelectedOutbreak()
                        .subscribe((selectedOutbreak: OutbreakModel) => {
                            this.selectedOutbreak = selectedOutbreak;
                            if (this.selectedOutbreak) {
                                // construct query builder
                                const qb: RequestQueryBuilder = new RequestQueryBuilder();
                                qb.filter
                                    .where({
                                        id: params.labResultId
                                    });

                                // retrieve created user & modified user information
                                qb.include('createdByUser', true);
                                qb.include('updatedByUser', true);

                                // get lab results
                                this.labResultDataService
                                    .getOutbreakLabResults(this.selectedOutbreak.id, qb)
                                    .pipe(
                                        catchError((err) => {
                                            this.snackbarService.showApiError(err);
                                            this.disableDirtyConfirm();
                                            this.router.navigate(['/']);
                                            return throwError(err);
                                        })
                                    )
                                    .subscribe((labResults: LabResultModel[]) => {
                                        // not found ?
                                        if (_.isEmpty(labResults)) {
                                            this.disableDirtyConfirm();
                                            this.router.navigate(['/']);
                                            return;
                                        }

                                        // creating labResult and caseData with the first item from response because api
                                        // is returning an array of objects. In this case there can't be more than one item in the response
                                        this.labResultData = new LabResultModel(labResults[0]);

                                        // initialize breadcrumbs
                                        this.initializeBreadcrumbs();

                                        // hide loading
                                        this.hideLoadingDialog();
                                    });
                            }
                        });
                });

            // initialize page breadcrumbs
            this.initializeBreadcrumbs();
        });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // init
        this.breadcrumbs = [];

        // entity list
        if (
            this.personType === EntityType.CONTACT &&
            ContactModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        } else if (
            this.personType === EntityType.CASE &&
            CaseModel.canList(this.authUser)
        ) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
            );
        }

        // case / contact view
        if (
            !this.fromLabResultsList &&
            this.labResultData &&
            this.labResultData.person &&
            this.labResultData.person.id
        ) {
            if (
                this.personType === EntityType.CONTACT &&
                ContactModel.canView(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.labResultData.person.name,
                        `/contacts/${this.labResultData.person.id}/view`
                    )
                );
            } else if (
                this.personType === EntityType.CASE &&
                CaseModel.canView(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        this.labResultData.person.name,
                        `/cases/${this.labResultData.person.id}/view`
                    )
                );
            }

            // lab result list
            if (
                this.personType === EntityType.CONTACT &&
                ContactModel.canListLabResult(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', `/lab-results/contacts/${this.labResultData.person.id}`)
                );
            } else if (
                this.personType === EntityType.CASE &&
                CaseModel.canListLabResult(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', `/lab-results/cases/${this.labResultData.person.id}`)
                );
            }
        } else if (this.fromLabResultsList) {
            // lab result list
            if (LabResultModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE',
                        '/lab-results'
                    )
                );
            }
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_LAB_RESULT_TITLE' : 'LNG_PAGE_MODIFY_LAB_RESULT_TITLE',
                null,
                true,
                {},
                this.labResultData
            )
        );
    }

    /**
     * Modify lab result
     * @param form
     */
    modifyLabResult(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // modify the lab result
        this.labResultDataService
            .modifyLabResult(
                this.selectedOutbreak.id,
                this.labResultData.id,
                dirtyFields,
                true
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((modifiedLabResult: LabResultModel) => {
                // update model
                const parentData = this.labResultData.person;
                this.labResultData = modifiedLabResult;
                this.labResultData.person = parentData;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_LAB_RESULT_ACTION_MODIFY_LAB_RESULT_SUCCESS_MESSAGE');

                // initialize breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
