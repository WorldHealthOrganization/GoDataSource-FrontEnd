import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ContactDataService } from '../../../../core/services/data/contact.data.service';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { NgForm } from '@angular/forms';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';

@Component({
    selector: 'app-modify-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up.component.html',
    styleUrls: ['./modify-contact-follow-up.component.less']
})
export class ModifyContactFollowUpComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    followUpData: FollowUpModel = new FollowUpModel();

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    displayOnlyMissedFollowUps: boolean = false;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService
    ) {}

    ngOnInit() {
        // retrieve route params
        this.route.params
            .subscribe((params: {contactId, followUpId}) => {
                // retrieve query params
                this.route.queryParams
                    .subscribe((queryParams: {displayOnlyMissedFollowUps}) => {
                        // display missed follow-ups or upcoming follow-ups link
                        this.displayOnlyMissedFollowUps = queryParams.displayOnlyMissedFollowUps;
                        if (this.displayOnlyMissedFollowUps) {
                            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_MISSED_TITLE', '/contacts/follow-ups/missed'));
                        } else {
                            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups'));
                        }

                        // get selected outbreak
                        this.outbreakDataService
                            .getSelectedOutbreak()
                            .subscribe((selectedOutbreak: OutbreakModel) => {
                                // keep selected outbreak for later user
                                this.selectedOutbreak = selectedOutbreak;

                                // retrieve follow-up information
                                this.followUpsDataService
                                    .getFollowUp(selectedOutbreak.id, params.contactId, params.followUpId)
                                    .catch((err) => {
                                        // show error message
                                        this.snackbarService.showError(err.message);

                                        // redirect to cases
                                        this.router.navigate(['/contacts/follow-ups']);
                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe((followUpData: FollowUpModel) => {
                                        // initialize follow-up
                                        this.followUpData = new FollowUpModel(followUpData);
                                        this.breadcrumbs.push(
                                            new BreadcrumbItemModel(
                                                'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE',
                                                '.',
                                                true,
                                                {},
                                                this.followUpData
                                            )
                                        );
                                    });
                            });
                    });
            });
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
        this.followUpsDataService
            .modifyFollowUp(this.selectedOutbreak.id, this.followUpData.personId, this.followUpData.id, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UP_ACTION_MODIFY_FOLLOW_UP_SUCCESS_MESSAGE');

                // navigate to listing page
                this.router.navigate(['/contacts/follow-ups']);
            });
    }
}