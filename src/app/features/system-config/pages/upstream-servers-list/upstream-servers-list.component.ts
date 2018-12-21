import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import * as _ from 'lodash';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SystemSyncDataService } from '../../../../core/services/data/system-sync.data.service';
import { SystemSyncModel } from '../../../../core/models/system-sync.model';
import { SystemSyncLogDataService } from '../../../../core/services/data/system-sync-log.data.service';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { Constants } from '../../../../core/models/constants';

@Component({
    selector: 'app-upstream-servers-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './upstream-servers-list.component.html',
    styleUrls: ['./upstream-servers-list.component.less']
})
export class UpstreamServersListComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // upstream servers
    upstreamServerList: SystemUpstreamServerModel[] = [];

    // sync in progress ?
    loading: boolean = false;

    // settings
    settings: SystemSettingsModel;

    // constants
    UserSettings = UserSettings;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private systemSettingsDataService: SystemSettingsDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private systemSyncDataService: SystemSyncDataService,
        private systemSyncLogDataService: SystemSyncLogDataService
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

        // initialize Side Table Columns
        this.initializeSideTableColumns();

        // retrieve backups
        this.needsRefreshList(true);
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'name',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_NAME'
            }),
            new VisibleColumnModel({
                field: 'url',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_URL'
            }),
            new VisibleColumnModel({
                field: 'credentials',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS'
            }),
            new VisibleColumnModel({
                field: 'description',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_DESCRIPTION'
            }),
            new VisibleColumnModel({
                field: 'timeout',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_TIMEOUT'
            }),
            new VisibleColumnModel({
                field: 'syncInterval',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_INTERVAL'
            }),
            new VisibleColumnModel({
                field: 'syncOnEveryChange',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ON_EVERY_CHANGE'
            }),
            new VisibleColumnModel({
                field: 'syncEnabled',
                label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ENABLED'
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
            })
        ];
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.upstreamServerList = [];
        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.settings = settings;
                this.upstreamServerList = _.get(this.settings, 'upstreamServers', []);

                // flag if list is empty
                this.checkEmptyList(this.upstreamServerList);
            });
    }

    /**
     * Check if we have write access to sys settings
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Delete record
     * @param item
     */
    deleteUpstreamServer(upstreamServer: SystemUpstreamServerModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SYSTEM_UPSTREAM_SERVER', upstreamServer)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.systemSettingsDataService
                        .getSystemSettings()
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe((settings: SystemSettingsModel) => {
                            // remove upstream server
                            const upIndex: number = _.findIndex(settings.upstreamServers, { url: upstreamServer.url });
                            if (upIndex > -1) {
                                // remove server
                                settings.upstreamServers.splice(upIndex, 1);

                                // save upstream servers
                                this.systemSettingsDataService
                                    .modifySystemSettings({
                                        upstreamServers: settings.upstreamServers
                                    })
                                    .catch((err) => {
                                        this.snackbarService.showError(err.message);
                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe(() => {
                                        // display success message
                                        this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_DELETE_SUCCESS_MESSAGE');

                                        // refresh
                                        this.needsRefreshList(true);
                                    });
                            } else {
                                // not found ?
                                // IGNORE...
                                this.needsRefreshList(true);
                            }
                        });
                }
            });
    }

    /**
     * Toggle sync enabled flag
     * @param upstreamServer
     */
    toggleSyncEnableFlag(upstreamServer: SystemUpstreamServerModel) {
        // toggle flag
        upstreamServer.syncEnabled = !upstreamServer.syncEnabled;

        // save sync
        this.systemSettingsDataService
            .getSystemSettings()
            .catch((err) => {
                this.snackbarService.showError(err.message);
                return ErrorObservable.create(err);
            })
            .subscribe((settings: SystemSettingsModel) => {
                // upstream server
                const upstreamItem: SystemUpstreamServerModel = _.find(settings.upstreamServers, { url: upstreamServer.url });
                if (upstreamItem) {
                    // set flag
                    upstreamItem.syncEnabled = upstreamServer.syncEnabled;

                    // save upstream servers
                    this.systemSettingsDataService
                        .modifySystemSettings({
                            upstreamServers: settings.upstreamServers
                        })
                        .catch((err) => {
                            this.snackbarService.showApiError(err);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_TOGGLE_SYNC_ENABLED_SUCCESS_MESSAGE');
                        });
                } else {
                    // not found ?
                    // IGNORE...
                    this.needsRefreshList(true);
                }
            });
    }

    /**
     * Start sync
     * @param upstreamServer
     */
    startSync(upstreamServer: SystemUpstreamServerModel) {
        // check if sync is done
        const syncCheckIfDone = (syncLogId: string) => {
            setTimeout(
                () => {
                    // check if backup is ready
                    this.systemSyncLogDataService
                        .getSyncLog(syncLogId)
                        .catch((err) => {
                            this.loading = false;
                            this.snackbarService.showApiError(err);
                            return ErrorObservable.create(err);
                        })
                        .subscribe((systemSyncLogModel: SystemSyncLogModel) => {
                            switch (systemSyncLogModel.status) {
                                // sync ready ?
                                case Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS.value:
                                case Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS_WITH_WARNINGS.value:
                                    // display success message
                                    this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_SYNC_SUCCESS_MESSAGE');
                                    this.loading = false;
                                    break;

                                // sync error ?
                                case Constants.SYSTEM_SYNC_LOG_STATUS.FAILED.value:
                                    this.snackbarService.showError('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_SYNC_FAILED_MESSAGE');
                                    this.loading = false;
                                    break;

                                // sync isn't ready ?
                                // Constants.SYSTEM_SYNC_LOG_STATUS.IN_PROGRESS.value
                                default:
                                    syncCheckIfDone(syncLogId);
                                    break;
                            }
                        });
                },
                Constants.DEFAULT_FILTER_POOLING_MS_CHECK_AGAIN
            );
        };

        // start sync ?
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SYSTEM_UPSTREAM_SYNC_CONFIRMATION', upstreamServer)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // start sync
                    this.loading = true;
                    this.systemSyncDataService
                        .sync(upstreamServer.url)
                        .catch((err) => {
                            this.loading = false;
                            this.snackbarService.showApiError(err);
                            return ErrorObservable.create(err);
                        })
                        .subscribe((result: SystemSyncModel) => {
                            syncCheckIfDone(result.syncLogId);
                        });
                }
            });

    }
}