import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { throwError } from 'rxjs';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError } from 'rxjs/operators';
import { ContactModel } from 'app/core/models/contact.model';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { moment } from '../../../../core/helperClasses/x-moment';

@Component({
    selector: 'app-modify-questionnaire-contact-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-questionnaire-contact-follow-up.component.html',
    styleUrls: ['./modify-questionnaire-contact-follow-up.component.less']
})
export class ModifyQuestionnaireContactFollowUpComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    contactId: string;
    followUpId: string;
    followUpData: FollowUpModel = new FollowUpModel();

    rootPage: string;

    // constants
    FollowUpModel = FollowUpModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private followUpsDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
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

        // show loading
        this.showLoadingDialog(false);

        // retrieve data
        this.route.params
            .subscribe((params: { contactId, followUpId }) => {
                this.contactId = params.contactId;
                this.followUpId = params.followUpId;
                this.retrieveFollowUpData();
            });

        this.route.queryParams.subscribe((params: {rootPage}) => {
            this.rootPage = params.rootPage;
        });

        // retrieve outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // breadcrumbs
                this.retrieveFollowUpData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // do we have follow-up data
        if (this.followUpData) {
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

            if (FollowUpModel.canModify(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(
                        'LNG_PAGE_LIST_FOLLOW_UPS_TITLE',
                        `/contacts/${this.followUpData.person.id}/follow-ups/${this.followUpData.id}/modify`,
                        false,
                        {rootPage: this.rootPage}
                    )
                );
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

    /**
     * Retrieve information
     */
    private retrieveFollowUpData() {
        if (
            this.contactId &&
            this.followUpId &&
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            // show loading
            this.showLoadingDialog(false);

            // retrieve follow-up information
            this.followUpsDataService
                .getFollowUp(
                    this.selectedOutbreak.id,
                    this.contactId,
                    this.followUpId
                )
                .pipe(
                    catchError((err) => {
                        // show error message
                        this.snackbarService.showApiError(err);

                        // redirect
                        this.disableDirtyConfirm();

                        // hide loading
                        this.hideLoadingDialog();

                        return throwError(err);
                    })
                )
                .subscribe((followUpData: FollowUpModel) => {
                    this.followUpData = new FollowUpModel(followUpData);

                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Modify
     */
    modifyFollowUp(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // show loading
        this.showLoadingDialog();

        // modify
        this.followUpsDataService
            .modifyFollowUp(
                this.selectedOutbreak.id,
                this.contactId,
                this.followUpId,
                dirtyFields
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);

                    // hide loading
                    this.hideLoadingDialog();

                    return throwError(err);
                })
            )
            .subscribe(() => {
                // update data
                this.retrieveFollowUpData();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UP_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE');

                // loading will be closed by retrieveFollowUpData() method
                // NOTHING TO DO
            });
    }
}
