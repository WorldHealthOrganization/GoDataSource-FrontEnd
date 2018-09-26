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
import * as moment from 'moment';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { Subscriber } from 'rxjs/Subscriber';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Moment } from 'moment';

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

    availableSideFilters: FilterModel[];

    followUpsListCount$: Observable<any>;

    serverToday: Moment = null;

    constructor(
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private followUpsDataService: FollowUpsDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private router: Router
    ) {
        super();
    }

    ngOnInit() {
        // get today time
        this.genericDataService
            .getServerUTCToday()
            .subscribe((currentDate) => {
               this.serverToday = currentDate;
            });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();
        const genderOptionsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        const occupationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.OCCUPATION);

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
                // selected outbreak
                this.selectedOutbreak = selectedOutbreak;

                // initialize pagination
                this.initPaginator();
                // ...and re-load the list when the Selected Outbreak is changed
                this.needsRefreshList(true);
            });

        // set available side filters
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'address',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                type: FilterType.ADDRESS
            }),
            new FilterModel({
                fieldName: 'date',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_DATE',
                type: FilterType.RANGE_DATE
            }),
            new FilterModel({
                fieldName: 'lostToFollowUp',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_LOST_TO_FOLLOW_UP',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsList$
            }),
            new FilterModel({
                fieldName: 'performed',
                fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_PERFORMED',
                type: FilterType.SELECT,
                options$: this.yesNoOptionsList$
            })
        ];
        if (this.authUser.hasPermissions(PERMISSION.READ_CONTACT)) {
            this.availableSideFilters = [
                ...this.availableSideFilters,
                ...[
                    new FilterModel({
                        fieldName: 'firstName',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_FIRST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'lastName',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_LAST_NAME',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'addresses',
                        fieldLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS',
                        type: FilterType.ADDRESS,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'gender',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_GENDER',
                        type: FilterType.MULTISELECT,
                        options$: genderOptionsList$,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'age',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_AGE',
                        type: FilterType.RANGE_NUMBER,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'dob',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_DATE_OF_BIRTH',
                        type: FilterType.RANGE_DATE,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'phone',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_PHONE',
                        type: FilterType.TEXT,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    }),
                    new FilterModel({
                        fieldName: 'occupation',
                        fieldLabel: 'LNG_CONTACT_FIELD_LABEL_OCCUPATION',
                        type: FilterType.MULTISELECT,
                        options$: occupationsList$,
                        relationshipPath: ['contact'],
                        relationshipLabel: 'LNG_FOLLOW_UP_FIELD_LABEL_CONTACT'
                    })
                ]
            ];
        }
    }

    /**
     * Construct query builder
     */
    private addFollowUpConditionsToQB(): Observable<void> {
        return Observable.create((observer: Subscriber<void>) => {
            this.genericDataService.getServerUTCCurrentDateTime()
                .subscribe((serverDateTime: string) => {
                    // display only unresolved followups
                    this.queryBuilder.filter.where({
                        performed: false
                    }, true);

                    // show upcoming or past follow ups?
                    this.queryBuilder.filter.where({
                        // trick remove condition, so we can have filter on dates as well
                        or: [{
                            date: {
                                [this.showPastFollowUps ? 'lt' : 'gte']: this.showPastFollowUps ?
                                    moment(serverDateTime).endOf('day').toISOString() :
                                    moment(serverDateTime).startOf('day').toISOString()
                            }
                        }]
                    }, true);

                    // finished configuring query builder
                    observer.next();
                    observer.complete();
                });
        });
    }

    /**
     * Refresh list
     */
    refreshList() {
        if (this.selectedOutbreak) {
            this.addFollowUpConditionsToQB().subscribe(() => {
                // retrieve the list of Follow Ups
                this.followUpsList$ = this.followUpsDataService
                    .getFollowUpsList(this.selectedOutbreak.id, this.queryBuilder);
            });
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.selectedOutbreak) {
            this.addFollowUpConditionsToQB().subscribe(() => {
                // remove paginator from query builder
                const countQueryBuilder = _.cloneDeep(this.queryBuilder);
                countQueryBuilder.paginator.clear();
                this.followUpsListCount$ = this.followUpsDataService
                    .getFollowUpsCount(this.selectedOutbreak.id, countQueryBuilder);
            });
        }
    }

    switchToPastFollowUps() {
        this.showPastFollowUps = true;
        this.needsRefreshList(true);

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
        this.needsRefreshList(true);

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
            'deleted',
            'actions'
        ];

        // checkboxes should be visible only if we have write access
        if (this.hasFollowUpsWriteAccess()) {
            columns.unshift(
                'checkbox'
            );
        }

        // finished
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
                            this.needsRefreshList(true);
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
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Generate Follow Ups
     */
    generateFollowUps() {
        if (this.selectedOutbreak) {
            this.dialogService.showInput(new DialogConfiguration({
                message: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_TITLE',
                yesLabel: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_YES_BUTTON',
                placeholder: 'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_DIALOG_INPUT_LABEL'
            })).subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.followUpsDataService.generateFollowUps(this.selectedOutbreak.id, answer.inputValue.value)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);
                                return ErrorObservable.create(err);
                            })
                            .subscribe(() => {
                                this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_GENERATE_FOLLOW_UPS_SUCCESS_MESSAGE');

                                // reload data
                                this.needsRefreshList(true);
                            });
                    }
            });
        }
    }

    /**
     * Mark a contact as missing from a follow-up
     * @param {FollowUpModel} followUp
     * @param {boolean} contactMissed
     */
    markContactAsMissedFromFollowUp(followUp: FollowUpModel, contactMissed?: boolean) {
        // show confirm dialog to confirm the action and check if contact is missed or not to know what message to display
        const confirmMessage = contactMissed ?
            'LNG_DIALOG_CONFIRM_MARK_CONTACT_AS_PRESENT_ON_FOLLOW_UP' :
            'LNG_DIALOG_CONFIRM_MARK_CONTACT_AS_MISSING_FROM_FOLLOW_UP';
        this.dialogService.showConfirm(confirmMessage, new ContactModel(followUp.contact))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.outbreakDataService
                        .getSelectedOutbreak()
                        .subscribe((selectedOutbreak: OutbreakModel) => {
                            // mark follow-up
                            this.followUpsDataService
                                .modifyFollowUp(selectedOutbreak.id, followUp.personId, followUp.id, {
                                    lostToFollowUp : !contactMissed
                                })
                                .catch((err) => {
                                    this.snackbarService.showError(err.message);

                                    return ErrorObservable.create(err);
                                })
                                .subscribe(() => {
                                    // mark follow-up as missed or as present
                                    const successMessage =
                                        contactMissed ?
                                            'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MARK_CONTACT_AS_PRESENT_ON_FOLLOW_UP_SUCCESS_MESSAGE' :
                                            'LNG_PAGE_LIST_FOLLOW_UPS_ACTION_MARK_CONTACT_AS_MISSING_FROM_FOLLOW_UP_SUCCESS_MESSAGE';
                                    this.snackbarService.showSuccess(successMessage);

                                    // refresh list
                                    this.needsRefreshList(true);
                                });
                        });
                }
            });
    }

    /**
     * Modify selected follow-ups
     */
    modifySelectedFollowUps() {
        // get list of follow-ups that we want to modify
        const selectedRecords: string[] = this.checkedRecords;
        if (selectedRecords.length < 1) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            ['/contacts/follow-ups/modify-list'],
            {
                queryParams: {
                    followUpsIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

    /**
     * Check if date is in future to know if we show "Missed to follow-up" option or not
     */
    dateInTheFuture(followUpDate): boolean {
        const date = followUpDate ? moment(followUpDate) : null;
        return !!(date && this.serverToday && date.startOf('day').isAfter(this.serverToday.startOf('day')));
    }
}
