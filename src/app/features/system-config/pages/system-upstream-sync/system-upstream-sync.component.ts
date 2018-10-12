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

@Component({
    selector: 'app-system-upstream-sync-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-upstream-sync.component.html',
    styleUrls: ['./system-upstream-sync.component.less']
})
export class SystemUpstreamSyncComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SYNC_SERVERS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // upstream servers
    upstreamServerList: SystemUpstreamServerModel[] = [];

    // constants
    UserSettings = UserSettings;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private systemSettingsDataService: SystemSettingsDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService
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
        this.needsRefreshList();
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
                this.upstreamServerList = _.get(settings, 'upstreamServers', []);
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
                            // remove first upstream server that matches all properties since we don't have an id, and removing it by index..ins't a good idea
                            const upIndex: number = _.findIndex(settings.upstreamServers, upstreamServer);
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
                                        this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SYNC_SERVERS_ACTION_DELETE_SUCCESS_MESSAGE');

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
}
