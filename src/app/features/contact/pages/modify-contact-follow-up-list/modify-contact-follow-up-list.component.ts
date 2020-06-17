import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { NgForm } from '@angular/forms';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { forkJoin, Observable, throwError } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { IAnswerData } from '../../../../core/models/question.model';
import { catchError, share } from 'rxjs/operators';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { Constants } from '../../../../core/models/constants';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { CaseModel } from '../../../../core/models/case.model';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-modify-contact-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up-list.component.html',
    styleUrls: ['./modify-contact-follow-up-list.component.less']
})
export class ModifyContactFollowUpListComponent extends ConfirmOnFormChanges implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // selected follow-ups ids
    selectedFollowUpsIds: string[];
    // selected follow-ups to be modified
    selectedFollowUps: FollowUpModel[] = [];
    // persons to be displayed as info in selected contacts component
    personsToBeDisplayed: string;

    // current dirty fields
    currentDirtyFields: {
        [key: string]: any
    } = {};

    // dropdowns
    dailyStatusTypeOptions$: Observable<any[]>;
    teamsList$: Observable<TeamModel[]>;
    yesNoOptionsList$: Observable<any[]>;

    // provide constants to template
    Object = Object;
    Constants = Constants;

    // authenticated user
    authUser: UserModel;
    futureFollowUps: boolean = false;

    @ViewChild('targetedInput') targetedInput: any;
    @ViewChild('teamInput') teamInput: any;

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private followUpsDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private formHelper: FormHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService,
        private authDataService: AuthDataService,
        private genericDataService: GenericDataService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // dropdowns
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS).pipe(share());
        this.teamsList$ = this.teamDataService.getTeamsList().pipe(share());
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions(true);

        // read route query params
        this.route.queryParams
            .subscribe((queryParams: { followUpsIds }) => {
                if (_.isEmpty(queryParams.followUpsIds)) {
                    this.snackbarService.showError('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ERROR_NO_FOLLOW_UPS_SELECTED');

                    // No entities selected
                    this.disableDirtyConfirm();
                    this.router.navigate(['/contacts/follow-ups']);
                } else {
                    this.selectedFollowUpsIds = JSON.parse(queryParams.followUpsIds);

                    this.loadFollowUps();
                }
            });

        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadFollowUps();
            });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // contacts list page
        if (ContactModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
            );
        }

        // follow-ups list page
        if (FollowUpModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups')
            );
        }

        // current page
        this.breadcrumbs.push(
            new BreadcrumbItemModel('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE', '.', true)
        );
    }

    /**
     * Load follow-ups
     */
    private loadFollowUps() {
        if (
            this.selectedFollowUpsIds &&
            this.selectedOutbreak
        ) {
            // retrieve follow-ups information
            const qb: RequestQueryBuilder = new RequestQueryBuilder();

            // bring specific follow-ups
            qb.filter.bySelect(
                'id',
                this.selectedFollowUpsIds,
                true,
                null
            );

            // retrieve follow-ups and contact details
            this.followUpsDataService.getFollowUpsList(
                this.selectedOutbreak.id,
                qb
            ).subscribe((followUps: FollowUpModel[]) => {
                this.selectedFollowUps = followUps;

                // check if we have future follow-ups
                for (const followUp of this.selectedFollowUps) {
                    if (Constants.isDateInTheFuture(followUp.date)) {
                        this.futureFollowUps = true;
                        break;
                    }
                }
            });
        }
    }

    /**
     * Selected contacts
     */
    get selectedContacts(): (ContactModel | CaseModel)[]  {

        const selectedContactsToFormat = [];
        const selectedContacts = this.selectedFollowUps
            .map((followUp: FollowUpModel) => {
                if (followUp.person.type === EntityType.CASE) {
                    // need to know if we have follow-ups for persons that now are cases
                    selectedContactsToFormat.push(followUp.person.name);
                }
                return followUp.person;
            })
            .filter((contact, index, self) => {
                // keep only unique contacts
                return self.indexOf(contact) === index;
            });
        // persons to be displayed in the selected-contact-component
        this.personsToBeDisplayed = selectedContactsToFormat.join(', ');

        return selectedContacts;
    }

    /**
     * Return follow up dates for selected follow-ups to be modified
     */
    get followUpDates(): string[] {
        return _.sortBy(this.selectedFollowUps, 'date')
            .map((followUp) => followUp.date )
            .filter((date, index, self) => {
                // keep only unique dates
                return self.indexOf(date) === index;
            });
    }

    /**
     * Get dirty fields
     */
    getFormDirtyFields(stepForms: NgForm[]): any {
        const dirtyFields: any = this.formHelper.mergeDirtyFields(stepForms);

        // remove status if empty
        if (!dirtyFields.statusId) {
            delete dirtyFields.statusId;
        }

        // remove date if empty
        if (!dirtyFields.date) {
            delete dirtyFields.date;
        }

        return dirtyFields;
    }

    /**
     * Change step
     */
    onChangeStep(stepForms: NgForm[]) {
        // reload dirty fields to display the changes
        this.currentDirtyFields = this.getFormDirtyFields(stepForms);
    }

    /**
     * Update Follow-Ups
     * @param stepForms
     */
    updateFollowUps(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.getFormDirtyFields(stepForms);

        if (_.isEmpty(dirtyFields)) {
            this.snackbarService.showSuccess('LNG_FORM_WARNING_NO_CHANGES');
            return;
        }

        if (!this.formHelper.isFormsSetValid(stepForms)) {
            return;
        }

        // get selected follow-ups ids to pass them to qb
        const selectedFollowUpIds: string[] = this.selectedFollowUps.map((followUp: FollowUpModel) => {
            return followUp.id;
        });

        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.filter.where({
            id: {
                inq: selectedFollowUpIds
            }
        });

        // start modifying follow-ups
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.followUpsDataService
            .bulkModifyFollowUps(
                this.selectedOutbreak.id,
                dirtyFields,
                qb
            )
            .pipe(
                catchError((err) => {
                    loadingDialog.close();

                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                loadingDialog.close();

                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ACTION_MODIFY_MULTIPLE_FOLLOW_UPS_SUCCESS_MESSAGE');

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/contacts/follow-ups']);
            });
    }

    /**
     * On changing value to 'None' set targetedInput as pristine
     */
    onTargetedChangeValue(value) {
        // return if element is not initialized
        if (!this.targetedInput) {
            return;
        }
        // if option selected is 'None' mark input as pristine
        if (!value) {
            this.targetedInput.control.markAsPristine();
        }
    }

    /**
     * On changing value to 'None' set teamInput as pristine
     */
    onTeamChangeValue(value) {
        // return if element is not initialized
        if (!this.teamInput) {
            return;
        }
        // if option selected is 'None' mark input as pristine
        if (!value) {
            this.teamInput.control.markAsPristine();
        }
    }

    /**
     * Check if there is nothing to change
     */
    nothingToChange(): boolean {
        return _.isEmpty(this.currentDirtyFields);
    }
}
