import * as _ from 'lodash';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { RedirectService } from '../../../../core/services/helper/redirect.service';

@Component({
    selector: 'app-create-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact-follow-up.component.html',
    styleUrls: ['./create-contact-follow-up.component.less']
})
export class CreateContactFollowUpComponent
    extends CreateConfirmOnChanges
    implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // route params
    contactId: string;
    contactData: ContactModel;

    followUpData: FollowUpModel = new FollowUpModel();

    dailyStatusTypeOptions$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;
    ContactModel = ContactModel;

    // authenticated user
    authUser: UserModel;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
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

        // daily status types
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);
        this.followUpData.statusId = Constants.FOLLOW_UP_STATUS.NO_DATA.value;

        // read route params
        this.route.params
            .subscribe((params: { contactId }) => {
                this.contactId = params.contactId;

                this.loadContact();
            });

        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadContact();
            });
    }

    /**
     * Load contact data
     */
    private loadContact() {
        if (
            this.contactId &&
            this.selectedOutbreak
        ) {
            // retrieve contact information
            this.contactDataService
                .getContact(this.selectedOutbreak.id, this.contactId)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        this.disableDirtyConfirm();
                        this.router.navigate(['/contacts']);

                        return throwError(err);
                    })
                )
                .subscribe((contactData: ContactModel) => {
                    this.contactData = contactData;

                    this.initializeBreadcrumbs();
                });
        }
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // init breadcrumbs
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // create from follow-ups / related follow-ups
        if (this.contactData) {
            // contact view
            if (ContactModel.canView(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.contactData.name, `/contacts/${this.contactData.id}/view`)
                );
            }

            // contact related follow-ups list
            if (ContactModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', `/contacts/contact-related-follow-ups/${this.contactId}`)
                );
            }
        } else {
            // list
            if (FollowUpModel.canList(this.authUser)) {
                this.breadcrumbs.push(
                    new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups')
                );
            }
        }

        // current page breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_CREATE_FOLLOW_UP_TITLE', '.', true)
        );
    }

    /**
     * Create Follow-up
     * @param {NgForm[]} stepForms
     */
    createNewFollowUp(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);
        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Follow-up
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.followUpsDataService
                .createFollowUp(this.selectedOutbreak.id, this.contactData.id, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newContactFollowup: FollowUpModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    this.disableDirtyConfirm();
                    if (FollowUpModel.canModify(this.authUser)) {
                        this.router.navigate([`/contacts/${newContactFollowup.personId}/follow-ups/${newContactFollowup.id}/modify`]);
                    } else if (FollowUpModel.canView(this.authUser)) {
                        this.router.navigate([`/contacts/${newContactFollowup.personId}/follow-ups/${newContactFollowup.id}/view`]);
                    } else if (FollowUpModel.canList(this.authUser)) {
                        this.router.navigate([`/contacts/follow-ups`]);
                    } else {
                        // fallback to current page since we already know that we have access to this page
                        this.redirectService.to(
                            [`/contacts/${newContactFollowup.personId}/follow-ups/create`]
                        );
                    }
                });
        }
    }
}
