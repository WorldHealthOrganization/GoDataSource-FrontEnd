import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable } from 'rxjs';
import { Constants } from '../../../../core/models/constants';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { FollowUpPage } from '../../typings/follow-up-page';
import { CaseDataService } from '../../../../core/services/data/case.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Component({
    selector: 'app-modify-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up.component.html',
    styleUrls: ['./modify-contact-follow-up.component.less']
})
export class ModifyContactFollowUpComponent extends ViewModifyComponent implements OnInit {
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

    teamsList$: Observable<TeamModel[]>;
    dailyStatusTypeOptions$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private caseDataService: CaseDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.teamsList$ = this.teamDataService.getTeamsList();
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

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

    private loadFollowUp() {
        if (
            this.contactId &&
            this.followUpId &&
            this.selectedOutbreak
        ) {
            // retrieve follow-up information
            this.followUpsDataService
                .getFollowUp(this.selectedOutbreak.id, this.contactId, this.followUpId)
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
                .subscribe((followUpData: FollowUpModel) => {
                    this.followUpData = new FollowUpModel(followUpData);

                    this.initializeBreadcrumbs();
                });
        }
    }

    private initializeBreadcrumbs() {
        if (
            this.followUpData
        ) {
            switch (this.rootPage) {
                case FollowUpPage.FOR_CONTACT:
                    this.breadcrumbs = [
                        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
                        new BreadcrumbItemModel(this.followUpData.contact.name, `/contacts/${this.followUpData.contact.id}/view`),
                        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', this.rootPageUrl),
                    ];
                    break;

                case FollowUpPage.CASE_RELATED:
                    let rootCaseName = '';
                    if (this.rootCaseData) {
                        rootCaseName = this.rootCaseData.name;
                    }

                    this.breadcrumbs = [
                        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
                        new BreadcrumbItemModel(rootCaseName, `/cases/${this.rootCaseId}/view`),
                        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_FOR_RELATED_CONTACTS_TITLE', this.rootPageUrl),
                    ];
                    break;

                case FollowUpPage.RANGE:
                    this.breadcrumbs = [
                        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
                        new BreadcrumbItemModel('LNG_PAGE_LIST_RANGE_FOLLOW_UPS_TITLE', this.rootPageUrl),
                    ];
                    break;

                case FollowUpPage.DAILY:
                default:
                    this.breadcrumbs = [
                        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
                        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', this.rootPageUrl),
                    ];
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
                this.followUpData
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

        // modify follow-up
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.followUpsDataService
            .modifyFollowUp(this.selectedOutbreak.id, this.followUpData.personId, this.followUpData.id, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    loadingDialog.close();
                    return throwError(err);
                })
            )
            .subscribe((followUpData) => {
                // update model
                this.followUpData = followUpData;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UP_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE');

                // update breadcrumb
                this.initializeBreadcrumbs();

                // hide dialog
                loadingDialog.close();
            });
    }

    /**
     * Check if we have access to create / generate follow-ups
     * @returns {boolean}
     */
    hasFollowUpsWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Check if we have access to view a contact
     * @returns {boolean}
     */
    hasContactReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CONTACT);
    }
}
