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
import { LocationDataService } from '../../../../core/services/data/location.data.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { ActivatedRoute } from '@angular/router';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';

@Component({
    selector: 'app-follow-ups-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './contacts-follow-ups-missed-list.component.html',
    styleUrls: ['./contacts-follow-ups-missed-list.component.less']
})
export class ContactsFollowUpsMissedListComponent extends ListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
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

    // yes / no / all options
    yesNoOptionsList$: Observable<any[]>;

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        private snackbarService: SnackbarService,
        private locationDataService: LocationDataService,
        private dialogService: DialogService,
        private route: ActivatedRoute,
        private genericDataService: GenericDataService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

        // add missed / upcoming breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                'LNG_PAGE_LIST_FOLLOW_UPS_MISSED_TITLE',
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
            // retrieve the list of Follow Ups
            this.followUpsList$ = this.followUpsDataService
                .getLastFollowUpsMissedList(this.selectedOutbreak.id, this.queryBuilder);
        }
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
            .subscribe((answer: DialogAnswerButton) => {
                if (answer === DialogAnswerButton.Yes) {
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
            .subscribe((answer: DialogAnswerButton) => {
                if (answer === DialogAnswerButton.Yes) {
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
}
