import { ListComponent } from '../../../core/helperClasses/list-component';
import { UserModel } from '../../../core/models/user.model';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { FollowUpModel } from '../../../core/models/follow-up.model';
import { ContactModel } from '../../../core/models/contact.model';
import { DialogAnswer, DialogAnswerButton, DialogField, ModifyContactFollowUpQuestionnaireData, ModifyContactFollowUpQuestionnaireDialogComponent } from '../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../core/services/helper/dialog.service';
import { FollowUpsDataService } from '../../../core/services/data/follow-ups.data.service';
import { Constants } from '../../../core/models/constants';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { TeamModel } from '../../../core/models/team.model';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { Directive, OnDestroy, OnInit } from '@angular/core';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { Observable } from 'rxjs';
import { TeamDataService } from '../../../core/services/data/team.data.service';
import { throwError } from 'rxjs';
import { catchError, share } from 'rxjs/operators';
import { moment } from '../../../core/helperClasses/x-moment';
import { ListHelperService } from '../../../core/services/helper/list-helper.service';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import {
    IExportFieldsGroupRequired,
    ExportFieldsGroupModelNameEnum
} from '../../../core/models/export-fields-group.model';

/**
 * Follow-up list component
 */
@Directive()
// tslint:disable-next-line:directive-class-suffix
export abstract class FollowUpsListComponent extends ListComponent implements OnInit, OnDestroy {
    // authenticated user
    authUser: UserModel;
    // contacts outbreak
    selectedOutbreak: OutbreakModel;

    // list of export fields groups
    fieldsGroupList: LabelValuePair[];
    fieldsGroupListRequired: IExportFieldsGroupRequired;

    // teams list
    teamsList$: Observable<TeamModel[]>;
    teamsListLoaded: TeamModel[];
    teamsListLoadedMap: {
        [teamId: string]: TeamModel
    } = {};
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

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        protected dialogService: DialogService,
        protected followUpsDataService: FollowUpsDataService,
        protected router: Router,
        protected i18nService: I18nService,
        protected teamDataService: TeamDataService,
        protected outbreakDataService: OutbreakDataService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
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
                this.teamsListLoadedMap[team.id] = team;

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

        // retrieve the list of export fields groups
        this.outbreakDataService.getExportFieldsGroups(ExportFieldsGroupModelNameEnum.FOLLOWUP)
            .subscribe((fieldsGroupList) => {
                this.fieldsGroupList = fieldsGroupList.toLabelValuePair(this.i18nService);
                this.fieldsGroupListRequired = fieldsGroupList.toRequiredList();
            });
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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
     * Delete specific follow-up
     * @param {FollowUpModel} followUp
     */
    deleteFollowUp(followUp: FollowUpModel) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_FOLLOW_UP', new ContactModel(followUp.person))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .deleteFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .pipe(
                            catchError((err) => {
                                this.listHelperService.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SUCCESS_MESSAGE');

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

        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_DELETE_MULTIPLE_FOLLOW_UPS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // construct filter
                    const qb = new RequestQueryBuilder();

                    qb.filter.
                    where({
                        id: {
                            inq: selectedRecords
                        }
                    });

                    // display loading
                    this.showLoadingDialog();
                    this.followUpsDataService
                        .deleteBulkFollowUps(this.selectedOutbreak.id, qb)
                        .pipe(
                            catchError((err) => {
                                // hide dialog
                                this.closeLoadingDialog();

                                this.listHelperService.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // hide dialog
                            this.closeLoadingDialog();

                            this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_DELETE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

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

        // show confirm dialog to confirm the action
        this.dialogService
            .showConfirm('LNG_DIALOG_CONFIRM_RESTORE_MULTIPLE_FOLLOW_UPS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // construct filter
                    const qb = new RequestQueryBuilder();

                    qb.filter.
                    where({
                        id: {
                            inq: selectedRecords
                        }
                    });
                    // display loading
                    this.showLoadingDialog();
                    this.followUpsDataService
                        .restoreBulkFollowUps(this.selectedOutbreak.id, qb)
                        .pipe(
                            catchError((err) => {
                                // hide dialog
                                this.closeLoadingDialog();

                                this.listHelperService.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // hide dialog
                            this.closeLoadingDialog();

                            this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SELECTED_FOLLOW_UPS_SUCCESS_MESSAGE');

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
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_RESTORE_FOLLOW_UP', new ContactModel(followUp.person))
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete follow up
                    this.followUpsDataService
                        .restoreFollowUp(this.selectedOutbreak.id, followUp.personId, followUp.id)
                        .pipe(
                            catchError((err) => {
                                this.listHelperService.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_RESTORE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Modify selected follow-ups
     */
    modifySelectedFollowUps() {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
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
            displayFieldsGroupList: true,
            displayUseQuestionVariable: true,
            anonymizeFields: this.anonymizeFields,
            fieldsGroupList: this.fieldsGroupList,
            fieldsGroupListRequired: this.fieldsGroupListRequired,
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
     * Called after change follow-up finishes with success
     */
    changeFollowUpTeamFinishedWithSuccess() {
        // Overwritten in Child Class
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
                    this.listHelperService.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                // update loaded follow-up data
                followUp.teamId = team ? team.id : null;

                // call callback
                this.changeFollowUpTeamFinishedWithSuccess();

                // show success ?
                // this might not be the best idea...maybe we can replace / remove it
                this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_CHANGE_FOLLOW_UP_TEAM_SUCCESS_MESSAGE');
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
                    this.listHelperService.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                this.listHelperService.snackbarService.showSuccess('LNG_PAGE_LIST_FOLLOW_UPS_ACTION_CHANGE_TARGETED_STATUS_SUCCESS_MESSAGE');
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
}
