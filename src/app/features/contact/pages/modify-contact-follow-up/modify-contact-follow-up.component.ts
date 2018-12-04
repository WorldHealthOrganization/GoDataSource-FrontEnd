import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
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
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Observable } from 'rxjs/Observable';
import { Constants } from '../../../../core/models/constants';
import * as moment from 'moment';

@Component({
    selector: 'app-modify-follow-up',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up.component.html',
    styleUrls: ['./modify-contact-follow-up.component.less']
})
export class ModifyContactFollowUpComponent extends ViewModifyComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups')
    ];

    teamsList$: Observable<TeamModel[]>;

    followUpData: FollowUpModel = new FollowUpModel();

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    dailyStatusTypeOptions$: Observable<any[]>;

    contactId: string;
    followUpId: string;

    authUser: UserModel;

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private contactDataService: ContactDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private followUpsDataService: FollowUpsDataService,
        private authDataService: AuthDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService
    ) {
        super(route);
    }

    ngOnInit() {
        this.teamsList$ = this.teamDataService.getTeamsList();

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // daily status types
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS);

        // retrieve route params
        this.route.params
            .subscribe((params: {contactId, followUpId}) => {
            this.contactId = params.contactId;
            this.followUpId = params.followUpId;
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

                                // redirect
                                this.disableDirtyConfirm();
                                this.router.navigate(['/contacts/follow-ups']);
                                return ErrorObservable.create(err);
                            })
                            .subscribe((followUpData: FollowUpModel) => {
                                // initialize follow-up
                                this.followUpData = new FollowUpModel(followUpData);
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        this.viewOnly ? 'LNG_PAGE_VIEW_FOLLOW_UP_TITLE' : 'LNG_PAGE_MODIFY_FOLLOW_UP_TITLE',
                                        '.',
                                        true,
                                        {},
                                        this.followUpData
                                    )
                                );
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
                this.disableDirtyConfirm();
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

    /**
     * Check if date is in future
     */
    dateInTheFuture(followUpDate): boolean {
        const date = followUpDate ? moment(followUpDate) : null;
        return !!(date && date.startOf('day').isAfter(Constants.getCurrentDate()));
    }
}
