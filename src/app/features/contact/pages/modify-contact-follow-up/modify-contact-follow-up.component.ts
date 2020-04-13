import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable, throwError } from 'rxjs';
import { Constants } from '../../../../core/models/constants';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { FollowUpPage } from '../../typings/follow-up-page';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { catchError } from 'rxjs/operators';
import { ContactModel } from '../../../../core/models/contact.model';
import * as moment from 'moment';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-modify-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up.component.html',
    styleUrls: ['./modify-contact-follow-up.component.less']
})
export class ModifyContactFollowUpComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;
    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // route params
    contactId: string;
    followUpId: string;
    // root follow-ups list page
    rootPage: FollowUpPage;
    // when user came from the list of follow-ups of contacts that are related to a case
    rootCaseId: string;
    rootCaseData: CaseModel;

    followUpData: FollowUpModel = new FollowUpModel();
    relatedPersonData: ContactModel | CaseModel = new ContactModel();

    teamsList$: Observable<TeamModel[]>;
    dailyStatusTypeOptions$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    FollowUpModel = FollowUpModel;
    ContactModel = ContactModel;
    EntityType = EntityType;
    /**
     * Constructor
     */
    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService,
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
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.teamsList$ = this.teamDataService.getTeamsList();
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // show loading
        this.showLoadingDialog(false);

        // read route query params
        this.route.queryParams
            .subscribe((queryParams: { rootPage: FollowUpPage, rootCaseId: string }) => {
                this.rootPage = queryParams.rootPage;
                this.rootCaseId = queryParams.rootCaseId;

                this.loadRootCase();
                this.initializeBreadcrumbs();
            });

        // read route params
        this.route.params
            .subscribe((params: { contactId, followUpId }) => {
                this.contactId = params.contactId;
                this.followUpId = params.followUpId;

                this.loadFollowUp();
            });

        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadFollowUp();
                this.loadRootCase();
            });
    }

    /**
     * Load root case
     */
    private loadRootCase() {
        if (
            this.rootCaseId &&
            this.selectedOutbreak
        ) {
            // retrieve root case information
            this.caseDataService
                .getCase(this.selectedOutbreak.id, this.rootCaseId)
                .pipe(
                    catchError((err) => {
                        // show error message
                        this.snackbarService.showApiError(err);

                        // redirect
                        this.disableDirtyConfirm();
                        this.router.navigate([this.rootPageUrl]);

                        return throwError(err);
                    })
                )
                .subscribe((caseData) => {
                    this.rootCaseData = caseData;

                    this.initializeBreadcrumbs();
                });
        }
    }

    /**
     * Load follow-up
     */
    private loadFollowUp() {
        if (
            this.contactId &&
            this.followUpId &&
            this.selectedOutbreak
        ) {
            // show loading
            this.showLoadingDialog(false);

            // retrieve follow-up information
            this.followUpsDataService
                .getFollowUp(this.selectedOutbreak.id, this.contactId, this.followUpId, true)
                .pipe(
                    catchError((err) => {
                        // show error message
                        this.snackbarService.showApiError(err);

                        // redirect
                        this.disableDirtyConfirm();
                        this.router.navigate([this.rootPageUrl]);

                        // hide loading
                        this.hideLoadingDialog();

                        return throwError(err);
                    })
                )
                .subscribe((followUpData: FollowUpModel) => {
                    this.followUpData = new FollowUpModel(followUpData);
                    this.relatedPersonData = followUpData.person.type === EntityType.CASE ? new CaseModel(followUpData.person) : new ContactModel(followUpData.person);

                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // do we have follow-up data
        if (this.followUpData) {
            switch (this.rootPage) {
                case FollowUpPage.FOR_CONTACT:
                    // contacts list page
                    if (ContactModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
                        );
                    }

                    // contacts view page
                    if (ContactModel.canView(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(this.followUpData.person.name, `/contacts/${this.followUpData.person.id}/view`)
                        );
                    }

                    // follow-ups list page
                    if (FollowUpModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', this.rootPageUrl)
                        );
                    }

                    // finished
                    break;

                case FollowUpPage.CASE_RELATED:
                    // cases list page
                    if (CaseModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases')
                        );
                    }

                    // case view page
                    if (
                        this.rootCaseData &&
                        CaseModel.canView(this.authUser)
                    ) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel(this.rootCaseData.name, `/cases/${this.rootCaseId}/view`)
                        );
                    }

                    // follow-ups related list page
                    if (FollowUpModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_FOR_RELATED_CONTACTS_TITLE', this.rootPageUrl)
                        );
                    }

                    // finished
                    break;

                case FollowUpPage.RANGE:
                    // contacts list page
                    if (ContactModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
                        );
                    }

                    // follow-ups range list page
                    if (FollowUpModel.canListDashboard(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', this.rootPageUrl)
                        );
                    }

                    // finished
                    break;

                default:
                    // contacts list page
                    if (ContactModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
                        );
                    }

                    // follow-ups list page
                    if (FollowUpModel.canList(this.authUser)) {
                        this.breadcrumbs.push(
                            new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', this.rootPageUrl)
                        );
                    }

                    // finished
                    break;
            }
        }

        // add breadcrumb for current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_FOLLOW_UP_TITLE' : 'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE',
                '.',
                true,
                {},
                this.followUpData ? {
                    ...this.followUpData, ...{
                        dateFormatted: moment(this.followUpData.date).format('YYYY-MM-DD')
                    }
                } : {}
            )
        );
    }

    get rootPageUrl(): string {
        switch (this.rootPage) {
            case FollowUpPage.FOR_CONTACT:
                return `/contacts/contact-related-follow-ups/${this.contactId}`;

            case FollowUpPage.CASE_RELATED:
                return `/contacts/case-related-follow-ups/${this.rootCaseId}`;

            case FollowUpPage.RANGE:
                return '/contacts/range-follow-ups';

            case FollowUpPage.DAILY:
            default:
                return '/contacts/follow-ups';
        }
    }

    /**
     * Modify Follow-up
     * @param {NgForm[]} stepForms
     */
    modifyFollowUp(form: NgForm) {
        // retrieve changed fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // validate fields
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // modify follow-up
        this.followUpsDataService
            .modifyFollowUp(
                this.selectedOutbreak.id,
                this.followUpData.personId,
                this.followUpData.id,
                dirtyFields,
                true
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((followUpData) => {
                // update model
                const contact = this.followUpData.person;
                this.followUpData = followUpData;
                this.followUpData.person = contact;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UP_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE');

                // update breadcrumb
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
