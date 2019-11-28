import { ListComponent } from '../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { PERMISSION } from '../../../core/models/permission.model';
import { UserModel } from '../../../core/models/user.model';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { FollowUpModel } from '../../../core/models/follow-up.model';
import { ContactModel } from '../../../core/models/contact.model';
import { DialogAnswer, DialogAnswerButton, DialogField, LoadingDialogModel, ModifyContactFollowUpQuestionnaireData, ModifyContactFollowUpQuestionnaireDialogComponent } from '../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../core/services/helper/dialog.service';
import { FollowUpsDataService } from '../../../core/services/data/follow-ups.data.service';
import { MatTable } from '@angular/material';
import { Constants } from '../../../core/models/constants';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { TeamModel } from '../../../core/models/team.model';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { OnInit } from '@angular/core';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Observable } from 'rxjs';
import { TeamDataService } from '../../../core/services/data/team.data.service';
import { throwError } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { moment } from '../../../core/helperClasses/x-moment';

export abstract class FollowUpsListComponent extends ListComponent implements OnInit {
    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // teams list
    teamsList$: Observable<TeamModel[]>;
    teamsListLoaded: TeamModel[];
    teamsListLoadedMap: {
        [teamId: string]: TeamModel
    };
    teamsListLoadedForHeaderSearch: LabelValuePair[];
    teamIdFilterValue: string = 'all';

    // export Follow-ups
    exportFollowUpsUrl: string;
    followUpsDataExportFileName: string = moment().format(Constants.DEFAULT_DATE_DISPLAY_FORMAT);
    allowedExportTypes: ExportDataExtension[] = [
        ExportDataExtension.CSV,
        ExportDataExtension.XLS,
        ExportDataExtension.XLSX,
        ExportDataExtension.XML,
        ExportDataExtension.JSON,
        ExportDataExtension.ODS,
        ExportDataExtension.PDF
    ];
    anonymizeFields: LabelValuePair[] = [
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_ID', 'id'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_DATE', 'date'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_TARGETED', 'targeted'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_STATUS_ID', 'statusId'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_ADDRESS', 'address'),
        new LabelValuePair('LNG_FOLLOW_UP_FIELD_LABEL_QUESTIONNAIRE_ANSWERS', 'questionnaireAnswers')
    ];

    // print follow-ups
    printFollowUpsUrl: string;
    printFollowUpsFileName: string;
    printFollowUpsDialogFields: DialogField[] = [];
    printFollowUpsDialogExtraAPIData: {
        [key: string]: any
    } = {};

    loadingDialog: LoadingDialogModel;

    constructor(
        protected snackbarService: SnackbarService,
        protected dialogService: DialogService,
        protected followUpsDataService: FollowUpsDataService,
        protected router: Router,
        protected i18nService: I18nService,
        protected teamDataService: TeamDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // add page title
        this.followUpsDataExportFileName = this.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_TITLE') +
            ' - ' +
            this.followUpsDataExportFileName;

        // print follow-ups file name
        this.printFollowUpsFileName = this.i18nService.instant('LNG_PAGE_LIST_FOLLOW_UPS_PRINT_DAILY_FORM_FILE_NAME');

        // load teams list
        // using share does the job, but it takes a bit to see the changes in the list
        // loading an array is instantaneous
        this.teamsList$ = this.teamDataService.getTeamsList().pipe(share());
        this.teamsList$.subscribe((teamsList) => {
            // teams loaded used by quick team change
            this.teamsListLoaded = teamsList;

            // format search options
            this.teamsListLoadedMap = {};
            this.teamsListLoadedForHeaderSearch = _.map(this.teamsListLoaded, (team: TeamModel) => {
                // map for easy access if we don't have access to write data to follow-ups
                if (!this.hasFollowUpsWriteAccess()) {
                    this.teamsListLoadedMap[team.id] = team;
                }

                // header search
                return new LabelValuePair(
                    team.name,
                    team.id
                );
            });

            // add all option
            this.teamsListLoadedForHeaderSearch = [
                new LabelValuePair(
                    'LNG_COMMON_LABEL_ALL',
                    this.teamIdFilterValue
                ),
                ...this.teamsListLoadedForHeaderSearch
            ];
        });
    }

    protected initializeFollowUpsPrint() {
        this.printFollowUpsUrl = null;

        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            this.printFollowUpsUrl = `outbreaks/${this.selectedOutbreak.id}/contacts/daily-followup-form/export`;
        }
    }

    protected initializeFollowUpsExport() {
        this.exportFollowUpsUrl = null;

        if (
            this.selectedOutbreak &&
            this.selectedOutbreak.id
        ) {
            this.exportFollowUpsUrl = `outbreaks/${this.selectedOutbreak.id}/follow-ups/export`;
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Delete selected follow-ups
     */
    deleteSelectedFollowUps() {
        // get list of selected follow-ups ids
        const selectedRecords: false |  string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }
        // construct filter
        const qb = new RequestQueryBuilder();

        qb.filter.
        where({
            id: {
                inq: selectedRecords
            }
        });


        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_FOLLOW_UPS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // display loading
                    const loadingDialog = this.dialogService.showLoadingDialog();
                    this.followUpsDataService
                        .deleteBulkFollowUps(this.selectedOutbreak.id, qb)
                        .pipe(
                            catchError((err) => {
                                // hide dialog
                                loadingDialog.close();

                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // hide dialog
                            loadingDialog.close();

                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore selected follow-ups
     */
    restoreSelectedFollowUps() {
        // get list of selected follow-ups ids
        const selectedRecords: false |  string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }
        // construct filter
        const qb = new RequestQueryBuilder();

        qb.filter.
        where({
            id: {
                inq: selectedRecords
            }
        });

        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_FOLLOW_UPS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // display loading
                    const loadingDialog = this.dialogService.showLoadingDialog();
                    this.followUpsDataService
                        .restoreBulkFollowUps(this.selectedOutbreak.id, qb)
                        .pipe(
                            catchError((err) => {
                                // hide dialog
                                loadingDialog.close();

                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // hide dialog
                            loadingDialog.close();

                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Modify selected follow-ups
     */
    modifySelectedFollowUps(table: MatTable<any>) {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // check if we have future records
        let hasFutureFollowUps: boolean = false;
        _.each(
            table.dataSource,
            (item: FollowUpModel) => {
                if (
                    selectedRecords.indexOf(item.id) > -1 &&
                    Constants.isDateInTheFuture(item.date)
                ) {
                    // found record that is in the future
                    hasFutureFollowUps = true;

                    // stop each
                    return false;
                }
            }
        );

        // we aren't allowed to continue to modify follow-ups if in our list we have future follow-ups
        if (hasFutureFollowUps) {
            this.snackbarService.showError('LNG_PAGE_LIST_FOLLOW_UPS_MODIFY_FUTURE_FOLLOW_UPS');
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
     * Export selected follow-ups
     */
    exportSelectedFollowUps() {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // construct query builder
        const qb = new RequestQueryBuilder();
        qb.filter.bySelect(
            'id',
            selectedRecords,
            true,
            null
        );

        // display export dialog
        this.dialogService.showExportDialog({
            // required
            message: 'LNG_PAGE_LIST_FOLLOW_UPS_EXPORT_TITLE',
            url: this.exportFollowUpsUrl,
            fileName: this.followUpsDataExportFileName,

            // // optional
            allowedExportTypes: this.allowedExportTypes,
            queryBuilder: qb,
            displayEncrypt: true,
            displayAnonymize: true,
            displayUseQuestionVariable: true,
            anonymizeFields: this.anonymizeFields,
            exportStart: () => {
                this.showLoadingDialog();
            },
            exportFinished: () => {
                this.closeLoadingDialog();
            }
        });
    }

    /**
     * Modify follow-up questionnaire
     * @param followUp
     */
    modifyQuestionnaire(followUp: FollowUpModel) {
        this.dialogService.showCustomDialog(
            ModifyContactFollowUpQuestionnaireDialogComponent, {
                ...ModifyContactFollowUpQuestionnaireDialogComponent.DEFAULT_CONFIG,
                ...{
                    data: new ModifyContactFollowUpQuestionnaireData(
                        followUp,
                        this.selectedOutbreak
                    )
                }
            }
        ).subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                // update list information that was changed
                followUp.statusId = (answer.inputValue.value as FollowUpModel).statusId;
            }
        });
    }

    /**
     * Change FollowUp Team
     */
    changeFollowUpTeam(
        followUp: FollowUpModel,
        team: TeamModel
    ) {
        // modify follow-up
        this.followUpsDataService
            .modifyFollowUp(
                this.selectedOutbreak.id,
                followUp.personId,
                followUp.id, {
                    teamId: team ? team.id : null
                }
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                // update loaded follow-up data
                followUp.teamId = team ? team.id : null;

                // show success ?
                // this might not be the best idea...maybe we can replace / remove it
                this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_CHANGE_FOLLOW_UP_TEAM_SUCCESS_MESSAGE');
            });
    }

    /**
     * Change FollowUp "targeted" status
     * @param {FollowUpModel} followUp
     * @param {boolean} targeted
     */
    setTargetedItem(followUp: FollowUpModel, targeted: boolean) {
        this.followUpsDataService
            .modifyFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id, {targeted: targeted})
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_CHANGE_TARGETED_STATUS_SUCCESS_MESSAGE');
            });
    }

    /**
     * Filter by team
     */
    filterByTeam(data: LabelValuePair) {
        // nothing to retrieve ?
        if (!data) {
            // no team
            this.queryBuilder.filter.where({
                teamId: {
                    eq: null
                }
            });

            // refresh list
            this.needsRefreshList();
        } else {
            // retrieve everything?
            if (data.value === this.teamIdFilterValue) {
                this.filterBySelectField('teamId', []);
            } else {
                this.filterBySelectField('teamId', data);
            }
        }
    }

    /**
     * Display loading dialog
     */
    showLoadingDialog() {
        this.loadingDialog = this.dialogService.showLoadingDialog();
    }

    /**
     * Hide loading dialog
     */
    closeLoadingDialog() {
        if (this.loadingDialog) {
            this.loadingDialog.close();
            this.loadingDialog = null;
        }
    }
}
