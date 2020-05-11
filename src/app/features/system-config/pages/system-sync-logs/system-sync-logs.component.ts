import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { SystemSyncLogDataService } from '../../../../core/services/data/system-sync-log.data.service';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType, HoverRowAction, HoverRowActionType, LoadingDialogModel } from '../../../../shared/components';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { MatDialogRef } from '@angular/material';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { catchError, map, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { moment } from '../../../../core/helperClasses/x-moment';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

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

    // constants
    SystemSyncLogModel = SystemSyncLogModel;

    // authenticated user
    authUser: UserModel;

    loadingDialog: LoadingDialogModel;

    // settings
    settings: SystemSettingsModel;

    // sync logs
    syncLogsList$: Observable<SystemSyncLogModel[]>;
    syncLogsListCount$: Observable<IBasicCount>;
    syncLogsStatusList$: Observable<any>;

    // upstream servers
    upstreamServerList: LabelValuePair[];

    mappedLVOutbreaks: LabelValuePair[];
    mappedCollections: LabelValuePair[];
    mappedExportTypes: LabelValuePair[];

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
                return !_.isEmpty(item.error) &&
                    SystemSyncLogModel.canView(this.authUser);
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
                        return SystemSyncLogModel.canDelete(this.authUser);
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
        protected listHelperService: ListHelperService,
        private router: Router,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService,
        private systemSyncLogDataService: SystemSyncLogDataService,
        private genericDataService: GenericDataService,
        private outbreakDataService: OutbreakDataService,
        private systemSettingsDataService: SystemSettingsDataService,
        private i18nService: I18nService
    ) {
        super(listHelperService);
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

        // retrieve collections
        this.genericDataService
            .getSyncPackageModuleOptions()
            .subscribe((mappedCollections) => {
                this.mappedCollections = mappedCollections;
            });

        // retrieve export types
        this.genericDataService
            .getSyncPackageExportTypeOptions()
            .subscribe((mappedExportTypes) => {
                this.mappedExportTypes = mappedExportTypes;
            });

        // retrieve outbreaks information
        this.outbreakDataService
            .getOutbreaksListReduced()
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

                this.mappedLVOutbreaks = _.map(outbreaks, (outbreak: OutbreakModel) => {
                    return new LabelValuePair(
                        outbreak.name,
                        outbreak.id
                    );
                });

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
    refreshList(finishCallback: (records: any[]) => void) {
        // sync logs
        this.syncLogsList$ = this.systemSyncLogDataService
            .getSyncLogList(this.queryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    finishCallback([]);
                    return throwError(err);
                }),
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
                tap((data: any[]) => {
                    finishCallback(data);
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
        this.syncLogsListCount$ = this.systemSyncLogDataService
            .getSyncLogsCount(countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
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
                                this.snackbarService.showApiError(err);
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
        // if not string, then there is no point in continuing
        if (
            !systemSyncLogModel.error ||
            !_.isString(systemSyncLogModel.error)
        ) {
            return;
        }

        // fix api issue
        let error: string = systemSyncLogModel.error.trim();
        let errJson: any;
        const detailsString: string = '"details":{';
        const detailsIndex: number = error.indexOf(detailsString);
        if (detailsIndex > -1) {
            // split error object & details object
            const detailsText: string = error.substr(detailsIndex, error.length - (detailsIndex + 2));
            const detailsObjectText: string = detailsText.substr(detailsString.length - 1);
            error = error.substr(0, detailsIndex - 1) + '}';

            // convert to json
            errJson = JSON.parse(error);
            errJson.details = JSON.parse(detailsObjectText);
        }

        // display data
        if (errJson) {
            this.dialogService
                .showConfirm(new DialogConfiguration({
                    message: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ERROR_DETAILS_TITLE',
                    additionalInfo: `<code><pre>${JSON.stringify(errJson, null, 1)}</pre></code>`,
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
                    // display loading
                    const loadingDialog = this.dialogService.showLoadingDialog();

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
                                loadingDialog.close();
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SERVER_SUCCESS_MESSAGE');

                            // refresh
                            this.needsRefreshList(true);

                            // hide loading
                            loadingDialog.close();
                        });
                }
            });
    }

    /**
     * Export sync package
     */
    exportSyncPackage() {
        // display export dialog
        if (this.mappedLVOutbreaks) {
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_SYSTEM_BACKUPS_EXPORT_SYNC_PACKAGE',
                url: 'sync/database-snapshot',
                fileName: this.i18nService.instant('LNG_PAGE_SYSTEM_BACKUPS_EXPORT_SYNC_PACKAGE') +
                    ' - ' +
                    moment().format('YYYY-MM-DD'),
                fileType: ExportDataExtension.ZIP,
                exportStart: () => {
                    // hide previous dialog ?
                    if (this.loadingDialog) {
                        this.loadingDialog.close();
                    }

                    // display loading dialog
                    this.loadingDialog = this.dialogService.showLoadingDialog();
                },
                exportFinished: () => {
                    if (this.loadingDialog) {
                        this.loadingDialog.close();
                        this.loadingDialog = undefined;
                    }
                },
                extraDialogFields: [
                    new DialogField({
                        name: 'filter[where][fromDate]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_FROM_DATE',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_FROM_DATE_DESCRIPTION',
                        fieldType: DialogFieldType.DATE
                    }),
                    new DialogField({
                        name: 'filter[where][outbreakId][inq]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_OUTBREAKS',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_OUTBREAKS_DESCRIPTION',
                        fieldType: DialogFieldType.SELECT,
                        inputOptions: this.mappedLVOutbreaks,
                        inputOptionsMultiple: true
                    }),
                    new DialogField({
                        name: 'filter[where][exportType]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE_DESCRIPTION',
                        fieldType: DialogFieldType.SELECT,
                        inputOptions: this.mappedExportTypes,
                        inputOptionsMultiple: false
                    }),
                    new DialogField({
                        name: 'filter[where][collections]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS_DESCRIPTION',
                        fieldType: DialogFieldType.SELECT,
                        inputOptions: this.mappedCollections,
                        inputOptionsMultiple: true,
                        visible: (fieldsData): boolean => {
                            return _.isEmpty(fieldsData['filter[where][exportType]']);
                        }
                    }),
                    new DialogField({
                        name: 'filter[where][includeUsers]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_INCLUDE_USERS',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_INCLUDE_USERS_DESCRIPTION',
                        fieldType: DialogFieldType.BOOLEAN,
                        visible: (fieldsData): boolean => {
                            return !_.isEmpty(fieldsData['filter[where][exportType]']);
                        }
                    }),
                    new DialogField({
                        name: 'password',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_ENCRYPTION_PASSWORD',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_ENCRYPTION_PASSWORD_DESCRIPTION',
                        fieldType: DialogFieldType.TEXT
                    })
                ]
            });
        }
    }
}
