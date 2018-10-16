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
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';

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

    // sync logs
    syncLogsList$: Observable<SystemSyncLogModel[]>;
    syncLogsListCount$: Observable<any>;
    syncLogsStatusList$: Observable<any>;

    // outbreaks
    outbreaks: OutbreakModel[];
    mappedOutbreaks: {
        [outbreakID: string]: OutbreakModel
    };

    // constants
    UserSettings = UserSettings;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private dialogService: DialogService,
        private systemSyncLogDataService: SystemSyncLogDataService,
        private genericDataService: GenericDataService,
        private outbreakDataService: OutbreakDataService
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

                // load logs
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
        // sync logs
        this.syncLogsList$ = this.systemSyncLogDataService
            .getSyncLogList(this.queryBuilder)
            .map((syncLogs: SystemSyncLogModel[]) => {
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
            });
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
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
     * Delete record
     * @param item
     */
    deleteSyncLog(systemSyncLogModel: SystemSyncLogModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SYSTEM_SYNC_LOG', systemSyncLogModel)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.systemSyncLogDataService
                        .deleteSyncLog(systemSyncLogModel.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // refresh
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
