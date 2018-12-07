import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable } from 'rxjs/Observable';
import { BackupModel } from '../../../../core/models/backup.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { SystemBackupDataService } from '../../../../core/services/data/system-backup.data.service';
import * as _ from 'lodash';
import { Constants } from '../../../../core/models/constants';
import { MatDialogRef } from '@angular/material';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as moment from 'moment';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { tap } from 'rxjs/operators';

@Component({
    selector: 'app-system-config-main',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './system-config.component.html',
    styleUrls: ['./system-config.component.less']
})
export class SystemConfigComponent extends ListComponent implements OnInit {
    /**
     * Breadcrumbs
     */
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_MAIN_SYSTEM_CONFIG_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;

    // settings
    settings: SystemSettingsModel;

    // backups list
    backupsList$: Observable<BackupModel[]>;
    backupsListCount$: Observable<any>;

    // module list
    backupModulesList$: Observable<any[]>;
    moduleList: LabelValuePair[];
    backupStatusList$: Observable<any[]>;

    // used to determine when a backup has finished so we can start the restore process...
    waitForBackupIdToBeReady: string;
    loading: boolean = false;

    mappedOutbreaks: LabelValuePair[];
    mappedCollections: LabelValuePair[];
    mappedExportTypes: LabelValuePair[];

    // constants
    Constants = Constants;

    /**
     * Constructor
     */
    constructor(
        private authDataService: AuthDataService,
        private dialogService: DialogService,
        private systemSettingsDataService: SystemSettingsDataService,
        private systemBackupDataService: SystemBackupDataService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private i18nService: I18nService,
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

        // default backup settings
        this.refreshSystemSettings();

        // module list
        this.backupModulesList$ = this.genericDataService.getBackupModuleList().share();
        this.backupModulesList$.subscribe((moduleList) => {
            this.moduleList = moduleList;
        });

        // backup status list
        this.backupStatusList$ = this.genericDataService.getBackupStatusList();

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

        // retrieve outbreaks
        this.outbreakDataService
            .getOutbreaksList()
            .map((outbreaks: OutbreakModel[]) => {
                return _.map(outbreaks, (outbreak: OutbreakModel) => {
                    return new LabelValuePair(
                        outbreak.name,
                        outbreak.id
                    );
                });
            }).subscribe((mappedOutbreaks: LabelValuePair[]) => {
                this.mappedOutbreaks = mappedOutbreaks;
            });
        // initialize pagination
        this.initPaginator();
        // retrieve backups
        this.needsRefreshList(true);
    }

    /**
     * Reload system settings
     */
    refreshSystemSettings() {
        this.settings = undefined;
        this.systemSettingsDataService
            .getSystemSettings()
            .subscribe((settings: SystemSettingsModel) => {
                this.settings = settings;
            });
    }

    /**
     * Check if we have write access to cases
     * @returns {boolean}
     */
    hasSysConfigWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_SYS_CONFIG);
    }

    /**
     * Refresh list
     */
    refreshList() {
        this.backupsList$ = this.systemBackupDataService.getBackupList(this.queryBuilder)
            .pipe(tap(this.checkEmptyList.bind(this)));
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        this.backupsListCount$ = this.systemBackupDataService.getBackupListCount(countQueryBuilder).share();
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'location',
            'modules',
            'date',
            'status',
            'error',
            'user',
            'actions'
        ];
    }

    /**
     * Get translation token from language
     */
    getModuleTranslation(module: string) {
        const moduleItem: LabelValuePair = _.find(this.moduleList, { value: module });
        return moduleItem ?
            moduleItem.label :
            '';
    }

    /**
     * Init backup dialog
     */
    initBackupDialog(): Observable<DialogAnswer> {
        return this.dialogService.showInput(new DialogConfiguration({
            message: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_TITLE',
            yesLabel: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_BACKUP_BUTTON',
            fieldsList: [
                // location
                new DialogField({
                    name: 'location',
                    placeholder: 'LNG_BACKUP_FIELD_LABEL_LOCATION',
                    description: 'LNG_BACKUP_FIELD_LABEL_LOCATION_DESCRIPTION',
                    required: true,
                    value: this.settings.dataBackup.location
                }),

                // module list
                new DialogField({
                    name: 'modules',
                    placeholder: 'LNG_BACKUP_FIELD_LABEL_MODULES',
                    description: 'LNG_BACKUP_FIELD_LABEL_MODULES_DESCRIPTION',
                    inputOptions: this.moduleList,
                    inputOptionsMultiple: true,
                    required: true,
                    value: this.settings.dataBackup.modules
                })
            ]
        }));
    }

    /**
     * Backup data
     */
    backupData() {
        // display dialog
        this.initBackupDialog().subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                this.systemBackupDataService
                    .createBackup(answer.inputValue.value)
                    .catch((err) => {
                        this.snackbarService.showError(err.message);
                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        // display success message
                        this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

                        // refresh page
                        this.needsRefreshList(true);
                    });
            }
        });
    }

    /**
     * Delete
     */
    deleteBackup(item: BackupModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_BACKUP', item)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.systemBackupDataService
                        .deleteBackup(item.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);
                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            // display success message
                            this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_ACTION_DELETE_SUCCESS_MESSAGE');

                            // refresh page
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Restore system data to a previous state from a data backup
     */
    restoreBackup(backupItemData: BackupModel) {
        // restore backup handler
        const restoreBackupNow = () => {
            this.loading = true;
            this.waitForBackupIdToBeReady = undefined;
            this.systemBackupDataService
                .restoreBackup(backupItemData.id)
                .catch((err) => {
                    this.snackbarService.showError(err.message);
                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    // display success message
                    this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_BACKUP_RESTORE_SUCCESS_MESSAGE');

                    // refresh page
                    this.loading = false;
                    this.needsRefreshList(true);
                });
        };

        // start restore process when backup is ready
        const backupCheckForReady = () => {
            setTimeout(
                () => {
                    // check if backup is ready
                    this.systemBackupDataService
                        .getBackup(this.waitForBackupIdToBeReady)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            // can't continue with the restore
                            this.waitForBackupIdToBeReady = undefined;
                            this.needsRefreshList(true);

                            return ErrorObservable.create(err);
                        })
                        .subscribe((newBackup: BackupModel) => {
                            switch (newBackup.status) {
                                // backup ready ?
                                case Constants.SYSTEM_BACKUP_STATUS.SUCCESS.value:
                                    // start restore process
                                    restoreBackupNow();
                                    break;

                                // backup error ?
                                case Constants.SYSTEM_BACKUP_STATUS.FAILED.value:
                                    this.snackbarService.showError('LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_FAILED_MESSAGE');
                                    this.waitForBackupIdToBeReady = undefined;
                                    this.needsRefreshList(true);
                                    break;

                                // backup isn't ready ?
                                // Constants.SYSTEM_BACKUP_STATUS.PENDING.value
                                default:
                                    backupCheckForReady();
                                    break;
                            }
                        });
                },
                Constants.DEFAULT_FILTER_POOLING_MS_CHECK_AGAIN
            );
        };

        // display dialog
        this.dialogService.showConfirm(new DialogConfiguration({
            message: 'LNG_DIALOG_CONFIRM_DELETE_BACKUP_RESTORE',
            yesLabel: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_BACKUP_BACKUP_AND_RESTORE_BUTTON',
            yesCssClass: 'primary dialog-btn-margin-right-10px',
            cancelCssClass: 'danger dialog-btn-margin-right-10px',
            addDefaultButtons: true,
            buttons: [
                new DialogButton({
                    cssClass: 'success',
                    label: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_BACKUP_RESTORE_BUTTON',
                    clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
                        dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
                    }
                })
            ]
        })).subscribe((answer: DialogAnswer) => {
            // Backup & Restore
            if (answer.button === DialogAnswerButton.Yes) {
                // display dialog
                this.initBackupDialog().subscribe((answerBackup: DialogAnswer) => {
                    if (answerBackup.button === DialogAnswerButton.Yes) {
                        this.systemBackupDataService
                            .createBackup(answerBackup.inputValue.value)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);
                                return ErrorObservable.create(err);
                            })
                            .subscribe((newBackup: BackupModel) => {
                                // display success message
                                this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

                                // refresh page
                                this.needsRefreshList(true);

                                // restore data
                                // should we wait for backup to be completed before proceeding ?
                                this.waitForBackupIdToBeReady = newBackup.id;
                                backupCheckForReady();
                            });
                    } else {
                        // cancel - display again the previous dialog
                        this.restoreBackup(backupItemData);
                    }
                });
            } else if (answer.button === DialogAnswerButton.Extra_1) {
                // restore
                restoreBackupNow();
            }
        });
    }

    /**
     * Configure automatic backup settings
     */
    configureAutomaticBackupSettings() {
        return this.dialogService.showInput(new DialogConfiguration({
            message: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_AUTOMATIC_BACKUP_SETTINGS_DIALOG_TITLE',
            yesLabel: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SAVE_BUTTON',
            fieldsList: [
                // location
                new DialogField({
                    name: 'location',
                    placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION',
                    description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION_DESCRIPTION',
                    required: true,
                    value: this.settings.dataBackup.location
                }),

                // backup interval
                new DialogField({
                    name: 'backupInterval',
                    placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL',
                    description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_DESCRIPTION',
                    required: true,
                    value: this.settings.dataBackup.backupInterval,
                    type: 'number'
                }),

                // data retention interval
                new DialogField({
                    name: 'dataRetentionInterval',
                    placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL',
                    description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL_DESCRIPTION',
                    required: true,
                    value: this.settings.dataBackup.dataRetentionInterval,
                    type: 'number'
                }),

                // module list
                new DialogField({
                    name: 'modules',
                    placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES',
                    description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES_DESCRIPTION',
                    inputOptions: this.moduleList,
                    inputOptionsMultiple: true,
                    required: true,
                    value: this.settings.dataBackup.modules
                })
            ]
        })).subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                this.systemSettingsDataService
                    .modifySystemSettings({
                        dataBackup: answer.inputValue.value
                    })
                    .catch((err) => {
                        this.snackbarService.showError(err.message);
                        return ErrorObservable.create(err);
                    })
                    .subscribe(() => {
                        // display success message
                        this.snackbarService.showSuccess('LNG_PAGE_MAIN_SYSTEM_CONFIG_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SUCCESS_MESSAGE');

                        // refresh settings
                        this.refreshSystemSettings();
                    });
            }
        });
    }

    /**
     * Export sync package
     */
    exportSyncPackage() {
        // display export dialog
        if (this.mappedOutbreaks) {
            this.dialogService.showExportDialog({
                message: 'LNG_PAGE_MAIN_SYSTEM_CONFIG_EXPORT_SYNC_PACKAGE',
                url: 'sync/database-snapshot',
                fileName: this.i18nService.instant('LNG_PAGE_MAIN_SYSTEM_CONFIG_EXPORT_SYNC_PACKAGE') +
                    ' - ' +
                    moment().format('YYYY-MM-DD'),
                fileType: ExportDataExtension.ZIP,
                exportStart: () => {
                    this.loading = true;
                },
                exportFinished: () => {
                    this.loading = false;
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
                        inputOptions: this.mappedOutbreaks,
                        inputOptionsMultiple: true
                    }),
                    new DialogField({
                        name: 'filter[where][collections]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS_DESCRIPTION',
                        fieldType: DialogFieldType.SELECT,
                        inputOptions: this.mappedCollections,
                        inputOptionsMultiple: true
                    }),
                    new DialogField({
                        name: 'filter[where][exportType]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE_DESCRIPTION',
                        fieldType: DialogFieldType.SELECT,
                        inputOptions: this.mappedExportTypes,
                        inputOptionsMultiple: false,
                        value: Constants.SYNC_PACKAGE_EXPORT_TYPES.FULL.value
                    }),
                    new DialogField({
                        name: 'filter[where][includeUsers]',
                        placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_INCLUDE_USERS',
                        description: 'LNG_SYNC_PACKAGE_FIELD_LABEL_INCLUDE_USERS_DESCRIPTION',
                        fieldType: DialogFieldType.BOOLEAN
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
