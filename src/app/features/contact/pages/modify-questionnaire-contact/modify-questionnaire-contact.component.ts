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
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { ContactModel } from 'app/core/models/contact.model';

@Component({
    selector: 'app-modify-questionnaire-contact',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-questionnaire-contact.component.html',
    styleUrls: ['./modify-questionnaire-contact.component.less']
})
export class ModifyQuestionnaireContactComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    contactId: string;
    contactData: ContactModel = new ContactModel();

    // constants
    ContactModel = ContactModel;

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private contactDataService: ContactDataService,
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
            .subscribe((params: { contactId }) => {
                this.contactId = params.contactId;
                this.retrieveContactData();
            });

        // retrieve outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // breadcrumbs
                this.retrieveContactData();
            });
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // contact
        if (
            this.contactData &&
            this.contactData.id
        ) {
            // model bread
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.contactData.name,
                    `/contacts/${this.contactData.id}/${this.viewOnly ? 'view' : 'modify'}`
                )
            );

            // view / modify breadcrumb
            this.breadcrumbs.push(
                new BreadcrumbItemModel(
                    this.viewOnly ?
                        'LNG_PAGE_VIEW_CONTACT_TITLE' :
                        'LNG_PAGE_MODIFY_CONTACT_TITLE',
                    '.',
                    true,
                    {},
                    this.contactData
                )
            );
        }
    }

    /**
     * Retrieve contact information
     */
    private retrieveContactData() {
        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id &&
            this.contactId
        ) {
            // show loading
            this.showLoadingDialog(false);

            this.contactDataService
                .getContact(
                    this.selectedOutbreak.id,
                    this.contactId,
                    true
                )
                .subscribe((contactData) => {
                    // keep data
                    this.contactData = contactData;

                    // update breadcrumb
                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
                });
        }
    }

    /**
     * Modify contact
     */
    modifyContact(form: NgForm) {
        // validate form
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // retrieve dirty fields
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // show loading
        this.showLoadingDialog();

        // modify
        this.contactDataService
            .modifyContact(
                this.selectedOutbreak.id,
                this.contactId,
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
                this.retrieveContactData();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CONTACT_ACTION_MODIFY_CONTACT_SUCCESS_MESSAGE');

                // loading will be closed by retrieveContactData() method
                // NOTHING TO DO
            });
    }
}
