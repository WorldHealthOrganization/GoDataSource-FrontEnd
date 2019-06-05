import { Component, OnInit, ViewEncapsulation } from '@angular/core';
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
import { Observable } from 'rxjs';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { TeamModel } from '../../../../core/models/team.model';
import { TeamDataService } from '../../../../core/services/data/team.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { IAnswerData } from '../../../../core/models/question.model';
import { throwError, forkJoin } from 'rxjs';
import { catchError, share } from 'rxjs/operators';

@Component({
    selector: 'app-modify-contact-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-contact-follow-up-list.component.html',
    styleUrls: ['./modify-contact-follow-up-list.component.less']
})
export class ModifyContactFollowUpListComponent extends ConfirmOnFormChanges implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts'),
        new BreadcrumbItemModel('LNG_PAGE_LIST_FOLLOW_UPS_TITLE', '/contacts/follow-ups'),
        new BreadcrumbItemModel('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_TITLE', '.', true)
    ];

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // form model
    followUp = new FollowUpModel();
    // selected follow-ups ids
    selectedFollowUpsIds: string[];
    // selected follow-ups to be modified
    selectedFollowUps: FollowUpModel[] = [];
    // current dirty fields
    currentDirtyFields: {
        questionnaireAnswers?: {
            [variable: string]: IAnswerData[];
        },
        [key: string]: any
    } = {};

    // dropdowns
    dailyStatusTypeOptions$: Observable<any[]>;
    teamsList$: Observable<TeamModel[]>;

    // provide constants to template
    Object = Object;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private followUpsDataService: FollowUpsDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private formHelper: FormHelperService,
        private referenceDataDataService: ReferenceDataDataService,
        private teamDataService: TeamDataService
    ) {
        super();
    }

    ngOnInit() {
        // dropdowns
        this.dailyStatusTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTACT_DAILY_FOLLOW_UP_STATUS).pipe(share());
        this.teamsList$ = this.teamDataService.getTeamsList().pipe(share());

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
    }

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
            });
        }
    }

    get selectedContacts(): ContactModel[] {
        return this.selectedFollowUps
            .map((followUp) => followUp.contact)
            .filter((contact, index, self) => {
                // keep only unique contacts
                return self.indexOf(contact) === index;
            });
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

    onChangeStep(step: { selectedIndex: number }, stepForms: NgForm[]) {
        if (step.selectedIndex === 2) {
            // reload dirty fields to display the changes
            this.currentDirtyFields = this.getFormDirtyFields(stepForms);
        }
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

        // save follow-ups
        // construct list of observables to save follow-ups
        const observableList$: Observable<any>[] = [];
        _.each(
            this.selectedFollowUps,
            (followUp: FollowUpModel) => {
                // retrieve contact id
                observableList$.push(
                    this.followUpsDataService
                        .modifyFollowUp(
                            this.selectedOutbreak.id,
                            followUp.personId,
                            followUp.id,
                            dirtyFields
                        )
                );
            }
        );

        // execute observables in parallel
        forkJoin(observableList$)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_FOLLOW_UPS_LIST_ACTION_MODIFY_MULTIPLE_FOLLOW_UPS_SUCCESS_MESSAGE');

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate(['/contacts/follow-ups']);
            });
    }
}
