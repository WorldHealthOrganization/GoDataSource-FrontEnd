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
import { Observable, throwError } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import * as _ from 'lodash';
import { LabResultDataService } from '../../../../core/services/data/lab-result.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { moment, Moment } from '../../../../core/helperClasses/x-moment';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { EntityModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-create-lab-result',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-lab-result.component.html',
    styleUrls: ['./create-lab-result.component.less']
})
export class CreateLabResultComponent
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

    // entity data
    entityData: CaseModel | ContactModel;
    personType: EntityType;

    serverToday: Moment = moment();

    // constants
    CaseModel = CaseModel;
    ContactModel = ContactModel;
    EntityType = EntityType;
    EntityModel = EntityModel;

    // authenticated user
    authUser: UserModel;

    /**
     * Check if we need to display warning message that case date of onset is after sample taken date
     */
    get displayOnsetDateWarningMessage(): boolean {
        return this.entityData &&
            this.labResultData &&
            this.personType === EntityType.CASE &&
            (this.entityData as CaseModel).dateOfOnset &&
            this.labResultData.dateSampleTaken &&
            moment((this.entityData as CaseModel).dateOfOnset).startOf('day').isAfter(moment(this.labResultData.dateSampleTaken).startOf('day'));
    }

    /**
     * Constructor
     */
    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private caseDataService: CaseDataService,
        private contactDataService: ContactDataService,
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

        // retrieve page information
        this.route.data.subscribe((data: { personType: EntityType }) => {
            // set page person type
            this.personType = data.personType;

            // retrieve entity information
            this.route.params
                .subscribe((params: { caseId?: string, contactId?: string }) => {
                    // get selected outbreak
                    this.outbreakDataService
                        .getSelectedOutbreak()
                        .subscribe((selectedOutbreak: OutbreakModel) => {
                            // outbreak
                            this.selectedOutbreak = selectedOutbreak;

                            // determine entity endpoint that we need to call
                            const entitySubscriber: Observable<CaseModel | ContactModel> = this.personType === EntityType.CONTACT ?
                                this.contactDataService.getContact(this.selectedOutbreak.id, params.contactId) :
                                this.caseDataService.getCase(this.selectedOutbreak.id, params.caseId);

                            // get case data
                            entitySubscriber
                                .pipe(
                                    catchError((err) => {
                                        this.snackbarService.showApiError(err);

                                        // Case / Contact not found
                                        this.disableDirtyConfirm();
                                        this.router.navigate(['/']);

                                        return throwError(err);
                                    })
                                )
                                .subscribe((entityData: CaseModel | ContactModel) => {
                                    this.entityData = entityData;

                                    // initialize page breadcrumbs
                                    this.initializeBreadcrumbs();
                                });
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
        // reset
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

        // person breadcrumbs
        if (this.entityData) {
            // entity view
            if (
                this.personType === EntityType.CONTACT &&
                ContactModel.canView(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.entityData.name, `/contacts/${this.entityData.id}/view`)
                );
            } else if (
                this.personType === EntityType.CASE &&
                CaseModel.canView(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.entityData.name, `/cases/${this.entityData.id}/view`)
                );
            }

            // lab result list
            if (
                this.personType === EntityType.CONTACT &&
                ContactModel.canListLabResult(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', `/lab-results/contacts/${this.entityData.id}`)
                );
            } else if (
                this.personType === EntityType.CASE &&
                CaseModel.canListLabResult(this.authUser)
            ) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_LAB_RESULTS_TITLE', `/lab-results/cases/${this.entityData.id}`)
                );
            }
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_CREATE_LAB_RESULT_TITLE', '.', true)
        );
    }

    /**
     * Create lab result
     * @param stepForms
     */
    createLabResult(stepForms: NgForm[]) {
        // no entity ?
        if (!this.entityData) {
            return;
        }

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add new Lab Result
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.labResultDataService
                .createLabResult(
                    this.selectedOutbreak.id,
                    EntityModel.getLinkForEntityType(this.personType),
                    this.entityData.id,
                    dirtyFields
                )
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        // hide dialog
                        loadingDialog.close();

                        return throwError(err);
                    })
                )
                .subscribe((newLabResult: LabResultModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_LAB_RESULT_ACTION_CREATE_LAB_RESULT_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    this.disableDirtyConfirm();
                    if (
                        this.personType === EntityType.CONTACT &&
                        ContactModel.canModifyLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/contacts/${this.entityData.id}/${newLabResult.id}/modify`]);
                    } else if (
                        this.personType === EntityType.CASE &&
                        CaseModel.canModifyLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/cases/${this.entityData.id}/${newLabResult.id}/modify`]);
                    } else if (
                        this.personType === EntityType.CONTACT &&
                        ContactModel.canViewLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/contacts/${this.entityData.id}/${newLabResult.id}/view`]);
                    } else if (
                        this.personType === EntityType.CASE &&
                        CaseModel.canViewLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/cases/${this.entityData.id}/${newLabResult.id}/view`]);
                    } else if (
                        this.personType === EntityType.CONTACT &&
                        ContactModel.canListLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/contacts/${this.entityData.id}`]);
                    } else if (
                        this.personType === EntityType.CASE &&
                        CaseModel.canListLabResult(this.authUser)
                    ) {
                        this.router.navigate([`/lab-results/cases/${this.entityData.id}`]);
                    } else {
                        // fallback to current page since we already know that we have access to this page
                        this.redirectService.to(
                            [`/lab-results/${EntityModel.getLinkForEntityType(this.personType)}/${this.entityData.id}/create`]
                        );
                    }
                });
        }
    }
}
