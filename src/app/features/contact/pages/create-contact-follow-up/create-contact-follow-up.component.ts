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
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { EntityType } from '../../../../core/models/entity-type';
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-create-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-contact-follow-up.component.html',
    styleUrls: ['./create-contact-follow-up.component.less']
})
export class CreateContactFollowUpComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups')
    ];

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // route params
    contactId: string;
    contactData: ContactModel;

    followUpData: FollowUpModel = new FollowUpModel();

    dailyStatusTypeOptions$: Observable<any[]>;

    // provide constants to template
    EntityType = EntityType;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
    ) {
        super();
    }

    ngOnInit() {
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

    private loadContact() {
        if (
            this.contactId &&
            this.selectedOutbreak
        ) {
            // retrieve contact information
            this.contactDataService
                .getContact(this.selectedOutbreak.id, this.contactId)
                .catch((err) => {
                    this.snackbarService.showApiError(err);

                    this.disableDirtyConfirm();
                    this.router.navigate(['/contacts']);
                    return ErrorObservable.create(err);
                })
                .subscribe((contactData: ContactModel) => {
                    this.contactData = contactData;

                    this.initializeBreadcrumbs();
                });
        }
    }

    private initializeBreadcrumbs() {
        if (
            this.contactData
        ) {
            this.breadcrumbs = [
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
                new BreadcrumbItemModel(this.contactData.name, `/contacts/${this.contactData.id}/view`),
                new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', `/contacts/contact-related-follow-ups/${this.contactId}`),
                new BreadcrumbItemModel('LNG_PAGE_CREATE_FOLLOW_UP_TITLE', '.', true)
            ];
        }
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
                .catch((err) => {
                    this.snackbarService.showApiError(err);
                    loadingDialog.close();
                    return ErrorObservable.create(err);
                })
                .subscribe((newContactFollowup: FollowUpModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/contacts/${newContactFollowup.personId}/follow-ups/${newContactFollowup.id}/modify`]);
                });
        }
    }
}
