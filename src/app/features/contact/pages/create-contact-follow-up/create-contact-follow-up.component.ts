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
import { Observable } from 'rxjs/Observable';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';

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

    followUpData: FollowUpModel = new FollowUpModel();
    contactData: ContactModel = new ContactModel();

    selectedOutbreak: OutbreakModel = new OutbreakModel();

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
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super();
    }

    ngOnInit() {
        // daily status types
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // retrieve query params
        this.route.params
            .subscribe((params: {contactId}) => {
                // update breadcrumbs
                this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_FOLLOW_UP_TITLE', '.', true));

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .catch((err) => {
                        // show error message
                        this.snackbarService.showError(err.message);

                        // redirect to cases
                        this.disableDirtyConfirm();
                        this.router.navigate(['/contacts']);
                        return ErrorObservable.create(err);
                    })
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        // keep selected outbreak for later user
                        this.selectedOutbreak = selectedOutbreak;

                        // retrieve contact information
                        this.contactDataService
                            .getContact(selectedOutbreak.id, params.contactId)
                            .catch((err) => {
                                // show error message
                                this.snackbarService.showError(err.message);

                                // redirect to cases
                                this.disableDirtyConfirm();
                                this.router.navigate(['/contacts']);
                                return ErrorObservable.create(err);
                            })
                            .subscribe((contactData: ContactModel) => {
                                // initialize contact
                                this.contactData = contactData;
                            });
                    });
            });
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
            this.followUpsDataService
                .createFollowUp(this.selectedOutbreak.id, this.contactData.id, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe((newContactFollowup: FollowUpModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_FOLLOW_UP_ACTION_CREATE_FOLLOW_UP_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.disableDirtyConfirm();
                    this.router.navigate([`/contacts/${newContactFollowup.personId}/follow-ups/${newContactFollowup.id}/modify`]);
                });
        }
    }
}
