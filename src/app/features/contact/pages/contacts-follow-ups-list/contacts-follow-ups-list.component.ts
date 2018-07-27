import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { Observable } from 'rxjs/Observable';
import { FollowUpModel } from '../../../../core/models/follow-up.model';
import { Constants } from '../../../../core/models/constants';
import { FollowUpsDataService } from '../../../../core/services/data/follow-ups.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { DialogAnswer, DialogConfiguration } from '../../../../shared/components/dialog/dialog.component';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-follow-ups-list.component.html',
    styleUrls: ['./contacts-follow-ups-list.component.less']
})
export class ContactsFollowUpsListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CONTACTS_TITLE', '/contacts')
    ];

    // import constants into template
    Constants = Constants;

    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // follow ups list
    followUpsList$: Observable<FollowUpModel[]>;
    // display past follow-ups or upcoming follow-ups?
    showPastFollowUps: boolean = false;

    // yes / no / all options
    yesNoOptionsList$: Observable<any[]>;

    constructor(private authDataService: AuthDataService,
                private outbreakDataService: OutbreakDataService,
                private followUpsDataService: FollowUpsDataService,
                private snackbarService: SnackbarService,
                private dialogService: DialogService,
                private genericDataService: GenericDataService) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // add missed / upcoming breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_FOLLOW_UPS_UPCOMING_TITLE',
                '.',
                true
            )
        );

        // subscribe to the Selected Outbreak
        this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // selected oubreak
                this.selectedOutbreak = selectedOutbreak;

                // re-load the list when the Selected Outbreak is changed
                this.refreshList();
            });
    }

    refreshList() {
        if (this.selectedOutbreak) {
            this.genericDataService.getServerUTCCurrentDateTime()
                .subscribe((serverDateTime: string) => {
                    // display only unresolved followups
                    this.queryBuilder.filter.where({
                        performed: false
                    }, true);

                    // show upcoming or past follow ups?
                    const operator = this.showPastFollowUps ? 'lt' : 'gte';
                    this.queryBuilder.filter.where({
                        date: {
                            [operator]: serverDateTime
                        }
                    }, true);

                    // retrieve the list of Follow Ups
                    this.followUpsList$ = this.followUpsDataService
                        .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder);
                });
        }
    }

    switchToPastFollowUps() {
        this.showPastFollowUps = true;
        this.refreshList();

        // update breadcrumbs
        this.breadcrumbs.pop();
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_FOLLOW_UPS_PAST_TITLE',
                '.',
                true
            )
        );
    }

    switchToUpcomingFollowUps() {
        this.showPastFollowUps = false;
        this.refreshList();

        // update breadcrumbs
        this.breadcrumbs.pop();
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_FOLLOW_UPS_UPCOMING_TITLE',
                '.',
                true
            )
        );
    }

    /**
     * Check if we have access to create / generate follow-ups
     * @returns {boolean}
     */
    hasFollowUpsWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_FOLLOWUP);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        // default visible columns
        const columns = [
            'firstName',
            'lastName',
            'date',
            'area',
            'fullAddress',
            'lostToFollowUp',
            'deleted'
        ];

        // check if the authenticated user has WRITE access
        if (this.hasFollowUpsWriteAccess()) {
            columns.push('actions');
        }

        // return columns that should be visible
        return columns;
    }

    /**
     * Delete specific follow-up
     * @param {FollowUpModel} followUp
     */
    deleteFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP', new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .deleteFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.refreshList();
                        });
                }
            });
    }

    /**
     * Restore specific follow-up
     * @param {FollowUpModel} followUp
     */
    restoreFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP', new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .restoreFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                            // reload data
                            this.refreshList();
                        });
                }
            });
    }

    /**
     * Generate Follow Ups
     */
    generateFollowUps() {
        if (this.selectedOutbreak) {
            this.dialogService.showInput(new DialogConfiguration(
                'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_TITLE',
                'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_YES_BUTTON',
                undefined,
                'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_INPUT_LABEL'
            )).subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.followUpsDataService.generateFollowUps(this.selectedOutbreak.id, answer.inputValue.value)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);
                                return ErrorObservable.create(err);
                            })
                            .subscribe(() => {
                                this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_SUCCESS_MESSAGE');

                                // reload data
                                this.refreshList();
                            });
                    }
                });
        }
    }

    /**
     * Mark a contact as missing from a follow-up
     * @param {FollowUpModel} followUp
     */
    markContactAsMissedFromFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_MARK_CONTACT_AS_MISSING_FROM_FOLLOW_UP', new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.outbreakDataService
                        .getSelectedOutbreak()
                        .subscribe((selectedOutbreak: OutbreakModel) => {
                            // mark follow-up
                            this.followUpsDataService
                                .modifyFollowUp(selectedOutbreak.id, followUp.personId, followUp.id, {
                                    lostToFollowUp: true
                                })
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);

                                    return ErrorObservable.create(err);
                                })
                                .subscribe(() => {
                                    // mark follow-up
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MARK_CONTACT_AS_MISSING_FROM_FOLLOW_UP_SUCCESS_MESSAGE');

                                    // refresh list
                                    this.refreshList();
                                });
                        });
                }
            });

    }
}