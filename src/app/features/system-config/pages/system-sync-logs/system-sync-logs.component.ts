import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { SystemSyncLogDataService } from '../../../../core/services/data/system-sync-log.data.service';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MatDialogRef } from '@angular/material';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, map, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

@Component({
    selector: 'app-system-sync-logs-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-sync-logs.component.html',
    styleUrls: ['./system-sync-logs.component.less']
})
export class SystemSyncLogsComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // settings
    settings: SystemSettingsModel;

    // sync logs
    syncLogsList$: Observable<SystemSyncLogModel[]>;
    syncLogsListCount$: Observable<any>;
    syncLogsStatusList$: Observable<any>;

    // upstream servers
    upstreamServerList: LabelValuePair[];

    // outbreaks
    outbreaks: OutbreakModel[];
    mappedOutbreaks: {
        [outbreakID: string]: OutbreakModel
    };

    // constants
    UserSettings = UserSettings;

    recordActions: HoverRowAction[] = [
        // View Error
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_VIEW_ERROR',
            click: (item: SystemSyncLogModel) => {
                this.viewError(item);
            },
            visible: (item: SystemSyncLogModel): boolean => {
                return !_.isEmpty(item.error);
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Log
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_LOG',
                    click: (item: SystemSyncLogModel) => {
                        this.deleteSyncLog(item);
                    },
                    visible: (): boolean => {
                        return this.hasSysConfigWriteAccess();
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private systemSyncLogDataService: SystemSyncLogDataService,
        private genericDataService: GenericDataService,
        private outbreakDataService: OutbreakDataService,
        private systemSettingsDataService: SystemSettingsDataService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve sync logs
        this.syncLogsStatusList$ = this.genericDataService.getSyncLogStatusList();

        // upstream servers
        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.settings = settings;
                this.upstreamServerList = _.map(_.get(settings, 'upstreamServers', []), (upstreamServer: SystemUpstreamServerModel) => {
                    return new LabelValuePair(
                        upstreamServer.name,
                        upstreamServer.url
                    );
                });
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // retrieve outbreaks information
        this.outbreakDataService
            .getOutbreaksList()
            .subscribe((outbreaks: OutbreakModel[]) => {
                // set outbreaks
                this.outbreaks = outbreaks;
                this.mappedOutbreaks = _.transform(
                    this.outbreaks,
                    (result, outbreak: OutbreakModel) => {
                        result[outbreak.id] = outbreak;
                    },
                    {}
                );

                // initialize pagination
                this.initPaginator();

                // ...and re-load the list
                this.needsRefreshList(true);
            });
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'syncServerUrl',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL'
            }),
            new VisibleColumnModel({
                field: 'syncClientId',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CLIENT_ID'
            }),
            new VisibleColumnModel({
                field: 'actionStartDate',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_ACTION_START_DATE'
            }),
            new VisibleColumnModel({
                field: 'actionCompletionDate',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_ACTION_COMPLETION_DATE'
            }),
            new VisibleColumnModel({
                field: 'outbreaks',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_OUTBREAKS'
            }),
            new VisibleColumnModel({
                field: 'status',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_STATUS'
            }),
            new VisibleColumnModel({
                field: 'informationStartDate',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_INFORMATION_START_DATE'
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList(finishCallback: () => void) {
        // sync logs
        this.syncLogsList$ = this.systemSyncLogDataService
            .getSyncLogList(this.queryBuilder)
            .pipe(
                map((syncLogs: SystemSyncLogModel[]) => {
                    return _.map(syncLogs, (log: SystemSyncLogModel) => {
                        // add list of outbreaks
                        log.outbreaks = _.transform(
                            log.outbreakIDs,
                            (result, outbreakID: string) => {
                                // outbreak not deleted ?
                                if (!_.isEmpty(this.mappedOutbreaks[outbreakID])) {
                                    result.push(this.mappedOutbreaks[outbreakID]);
                                }
                            },
                            []
                        );

                        // finished
                        return log;
                    });
                }),
                tap(this.checkEmptyList.bind(this)),
                tap(() => {
                    finishCallback();
                })
            );
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.syncLogsListCount$ = this.systemSyncLogDataService.getSyncLogsCount(countQueryBuilder);
    }

    /**
     * Check if we have write access to sys settings
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Configure sync settings
     */
    configureSyncSettings() {
        this.genericDataService
            .getFilterYesNoOptions()
            .subscribe((yesNoOptions: LabelValuePair[]) => {
                const yesNoOptionsFiltered: LabelValuePair[] = _.filter(yesNoOptions, (item: LabelValuePair) => _.isBoolean(item.value));
                this.dialogService.showInput(new DialogConfiguration({
                    message: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_TITLE',
                    yesLabel: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_SAVE_BUTTON',
                    fieldsList: [
                        new DialogField({
                            name: 'triggerBackupBeforeSync',
                            placeholder: 'LNG_UPSTREAM_SERVER_SYNC_SETTINGS_FIELD_LABEL_TRIGGER_BACKUP_BEFORE_SYNC',
                            description: 'LNG_UPSTREAM_SERVER_SYNC_SETTINGS_FIELD_LABEL_TRIGGER_BACKUP_BEFORE_SYNC_DESCRIPTION',
                            inputOptions: yesNoOptionsFiltered,
                            inputOptionsClearable: false,
                            required: true,
                            value: this.settings.sync.triggerBackupBeforeSync
                        })
                    ]
                })).subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        this.systemSettingsDataService
                            .modifySystemSettings({
                                sync: answer.inputValue.value
                            })
                            .pipe(
                                catchError((err) => {
                                    this.snackbarService.showApiError(err);
                                    return throwError(err);
                                })
                            )
                            .subscribe((settings: SystemSettingsModel) => {
                                this.settings = new SystemSettingsModel(settings);

                                // display success message
                                this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_SUCCESS_MESSAGE');

                                // refresh settings
                                this.needsRefreshList(true);
                            });
                    }
                });
            });
    }

    /**
     * Delete record
     * @param item
     */
    deleteSyncLog(systemSyncLogModel: SystemSyncLogModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SYSTEM_SYNC_LOG', systemSyncLogModel)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.systemSyncLogDataService
                        .deleteSyncLog(systemSyncLogModel.id)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showError(err.message);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // refresh
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * View Error details
     * @param systemSyncLogModel
     */
    viewError(systemSyncLogModel: SystemSyncLogModel) {
        this.dialogService
            .showConfirm(new DialogConfiguration({
                message: systemSyncLogModel.error,
                addDefaultButtons: false,
                buttons: [
                    new DialogButton({
                        label: 'LNG_COMMON_BUTTON_CLOSE',
                        clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                            dialogHandler.close();
                        }
                    })
                ]
            }))
            .subscribe();
    }

    /**
     * Delete all sync logs from a specific server
     */
    deleteServerSyncLogs() {
        this.dialogService
            .showInput(new DialogConfiguration({
                message: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_DELETE_SYNC_LOGS_DIALOG_TITLE',
                yesLabel: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_DELETE_SYNC_LOGS_DIALOG_DELETE_BUTTON',
                fieldsList: [
                    // upstream server url
                    new DialogField({
                        name: 'syncServerUrl',
                        placeholder: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL',
                        description: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL_DESCRIPTION',
                        inputOptions: this.upstreamServerList,
                        inputOptionsMultiple: false,
                        required: true
                    })
                ]
            })).subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // construct query
                    const qb = new RequestQueryBuilder();
                    qb.filter.byEquality(
                        'syncServerUrl',
                        answer.inputValue.value.syncServerUrl
                    );

                    // send request
                    this.systemSyncLogDataService
                        .deleteSyncLogs(qb)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SERVER_SUCCESS_MESSAGE');

                            // refresh
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
