import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { DialogAnswer, DialogAnswerButton, DialogButton, DialogComponent, DialogConfiguration, DialogField, DialogFieldType, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Observable, throwError } from 'rxjs';
import { BackupModel } from '../../../../core/models/backup.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { SystemBackupDataService } from '../../../../core/services/data/system-backup.data.service';
import * as _ from 'lodash';
import { Constants } from '../../../../core/models/constants';
import { MatDialogRef } from '@angular/material/dialog';
import { catchError, share, tap } from 'rxjs/operators';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-backups',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './backups.component.html',
  styleUrls: ['./backups.component.less']
})
export class BackupsComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_SYSTEM_BACKUPS_TITLE', '.', true)
  // ];

  // constants
  BackupModel = BackupModel;
  UserSettings = UserSettings;

  // settings
  settings: SystemSettingsModel;

  // backups list
  backupsList$: Observable<BackupModel[]>;
  backupsListCount$: Observable<IBasicCount>;
  usersList$: Observable<UserModel[]>;

  // module list
  backupModulesList$: Observable<any[]>;
  moduleList: LabelValuePair[];
  backupStatusList$: Observable<any[]>;

  // used to determine when a backup has finished so we can start the restore process...
  waitForBackupIdToBeReady: string;
  loading: boolean = false;

  // actions
  recordActions: HoverRowAction[] = [
    // View Backup Path
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_VIEW_BACKUP_PATH',
      click: (item: BackupModel) => {
        this.showBackupData(item);
      },
      visible: (item: BackupModel): boolean => {
        return item.status !== Constants.SYSTEM_BACKUP_STATUS.PENDING.value &&
                    BackupModel.canView(this.authUser);
      }
    }),

    // Restore backup
    new HoverRowAction({
      icon: 'swapVertical',
      iconTooltip: 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_RESTORE_BACKUP',
      click: (item: BackupModel) => {
        this.restoreBackup(item);
      },
      visible: (item: BackupModel): boolean => {
        return item.status === Constants.SYSTEM_BACKUP_STATUS.SUCCESS.value &&
                    BackupModel.canRestore(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Backup
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_DELETE_BACKUP',
          click: (item: BackupModel) => {
            this.deleteBackup(item);
          },
          visible: (item: BackupModel): boolean => {
            return item.status !== Constants.SYSTEM_BACKUP_STATUS.PENDING.value &&
                            BackupModel.canDelete(this.authUser);
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
    private dialogService: DialogService,
    private systemSettingsDataService: SystemSettingsDataService,
    private systemBackupDataService: SystemBackupDataService,
    private toastV2Service: ToastV2Service,
    private genericDataService: GenericDataService,
    private userDataService: UserDataService,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // default backup settings
    this.refreshSystemSettings();

    // module list
    this.backupModulesList$ = this.genericDataService.getBackupModuleList().pipe(share());
    this.backupModulesList$.subscribe((moduleList) => {
      this.moduleList = moduleList;
    });

    // backup status list
    this.backupStatusList$ = this.genericDataService.getBackupStatusList();

    // users list
    this.usersList$ = this.userDataService.getUsersList();

    // initialize pagination
    this.initPaginator();

    // retrieve backups
    this.needsRefreshList(true);

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'location',
    //     label: 'LNG_BACKUP_FIELD_LABEL_LOCATION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'modules',
    //     label: 'LNG_BACKUP_FIELD_LABEL_MODULES'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'date',
    //     label: 'LNG_BACKUP_FIELD_LABEL_DATE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'status',
    //     label: 'LNG_BACKUP_FIELD_LABEL_STATUS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'fileSize',
    //     label: 'LNG_BACKUP_FIELD_LABEL_FILE_SIZE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'duration',
    //     label: 'LNG_BACKUP_FIELD_LABEL_DURATION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'user',
    //     label: 'LNG_BACKUP_FIELD_LABEL_USER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'error',
    //     label: 'LNG_BACKUP_FIELD_LABEL_ERROR'
    //   })
    // ];
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
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Refresh list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    this.backupsList$ = this.systemBackupDataService
      .getBackupList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          finishCallback([]);
          return throwError(err);
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
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.backupsListCount$ = this.systemBackupDataService
      .getBackupListCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Get translation token from language
     */
  getModuleTranslation(module: string) {
    const moduleItem: LabelValuePair = _.find(this.moduleList, {value: module}) as LabelValuePair;
    return moduleItem ?
      moduleItem.label :
      '';
  }

  /**
     * Init backup dialog
     */
  initBackupDialog(): Observable<DialogAnswer> {
    return this.dialogService.showInput(new DialogConfiguration({
      message: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_TITLE',
      yesLabel: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_CREATE_BACKUP_BUTTON',
      fieldsList: [
        // description
        new DialogField({
          name: 'description',
          placeholder: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION',
          description: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
          required: false,
          value: this.settings.dataBackup.description
        }),

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
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);
              return throwError(err);
            })
          )
          .subscribe(() => {
            // display success message
            this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

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
    this.dialogService
      .showConfirm(
        'LNG_DIALOG_CONFIRM_DELETE_BACKUP', {
          location: item.location ?
            item.location :
            '-'
        }
      )
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.systemBackupDataService
            .deleteBackup(item.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_ACTION_DELETE_SUCCESS_MESSAGE');

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
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // display success message
          this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_BACKUP_RESTORE_SUCCESS_MESSAGE');

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
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);

                // can't continue with the restore
                this.waitForBackupIdToBeReady = undefined;
                this.needsRefreshList(true);

                return throwError(err);
              })
            )
            .subscribe((newBackup: BackupModel) => {
              switch (newBackup.status) {
                // backup ready ?
                case Constants.SYSTEM_BACKUP_STATUS.SUCCESS.value:
                  // start restore process
                  restoreBackupNow();
                  break;

                  // backup error ?
                case Constants.SYSTEM_BACKUP_STATUS.FAILED.value:
                  this.toastV2Service.error('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_FAILED_MESSAGE');
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
      yesLabel: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_BACKUP_AND_RESTORE_BUTTON',
      yesCssClass: 'primary dialog-btn-margin-right-10px',
      cancelCssClass: 'danger dialog-btn-margin-right-10px',
      addDefaultButtons: true,
      buttons: [
        new DialogButton({
          cssClass: 'success',
          label: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_RESTORE_BUTTON',
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
              .pipe(
                catchError((err) => {
                  this.toastV2Service.error(err);
                  return throwError(err);
                })
              )
              .subscribe((newBackup: BackupModel) => {
                // display success message
                this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

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
    // keep the existing configuration
    const currentSettings = {...this.settings.dataBackup};
    forkJoin([
      this.genericDataService.getFilterYesNoOptions(),
      this.genericDataService.getAutomaticBackupTypesList()
    ]).subscribe((
      [
        yesNoOptions,
        automaticBackupTypeOptions
      ]: [
        LabelValuePair[],
        LabelValuePair[]
      ]
    ) => {
      const yesNoOptionsFiltered: LabelValuePair[] = _.filter(yesNoOptions, (item: LabelValuePair) => _.isBoolean(item.value));
      this.dialogService
        .showInput(new DialogConfiguration({
          message: 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_TITLE',
          yesLabel: 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SAVE_BUTTON',
          additionalInfo: this.settings.dataBackup && !this.settings.dataBackup.disabled ?
            'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_EXISTING_CONFIGURATION_INFO' :
            'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_EXISTING_CONFIGURATION_INFO_DISABLE',
          translateData: this.settings.dataBackup ? {
            disabledLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_DISABLED'),
            disabled: this.settings.dataBackup.disabled ? this.i18nService.instant('LNG_COMMON_LABEL_YES') : this.i18nService.instant('LNG_COMMON_LABEL_NO'),
            descriptionLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION'),
            description: this.settings.dataBackup.description ?
              this.settings.dataBackup.description :
              '',
            locationLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION'),
            location: this.settings.dataBackup.location,
            backupIntervalLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL'),
            backupInterval: this.settings.dataBackup.backupInterval,
            dataRetentionIntervalLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL'),
            dataRetentionInterval: this.settings.dataBackup.dataRetentionInterval,
            modulesLabel: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES'),
            modules: this.settings.dataBackup.modules ? this.settings.dataBackup.modules.join(', ') : ''
          } : {},
          fieldsList: [
            // disabled
            new DialogField({
              name: 'disabled',
              placeholder: 'LNG_BACKUP_FIELD_LABEL_DISABLED',
              description: 'LNG_BACKUP_FIELD_LABEL_DISABLED_DESCRIPTION',
              inputOptions: yesNoOptionsFiltered,
              inputOptionsClearable: false,
              required: true,
              value: this.settings.dataBackup.disabled
            }),

            // description
            new DialogField({
              name: 'description',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION',
              description: 'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION_DESCRIPTION',
              required: false,
              value: this.settings.dataBackup.description,
              visible: (fieldsData): boolean => {
                return !fieldsData.disabled;
              }
            }),

            // location
            new DialogField({
              name: 'location',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION_DESCRIPTION',
              required: true,
              value: this.settings.dataBackup.location,
              visible: (fieldsData): boolean => {
                return !fieldsData.disabled;
              }
            }),

            // backup interval type
            new DialogField({
              name: 'backupType',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE_DESCRIPTION',
              inputOptions: automaticBackupTypeOptions,
              inputOptionsClearable: false,
              required: true,
              value: this.settings.dataBackup.backupType ?
                this.settings.dataBackup.backupType :
                Constants.SYSTEM_BACKUP_TYPES.N_HOURS.value,
              visible: (fieldsData): boolean => {
                return !fieldsData.disabled;
              }
            }),

            // backup interval
            new DialogField({
              name: 'backupInterval',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_DESCRIPTION',
              required: true,
              value: this.settings.dataBackup.backupInterval,
              type: 'number',
              visible: (fieldsData): boolean => {
                // input visible ?
                return !fieldsData.disabled && (
                  !fieldsData.backupType ||
                                    fieldsData.backupType === Constants.SYSTEM_BACKUP_TYPES.N_HOURS.value
                );
              }
            }),

            // backup daily at a time
            new DialogField({
              name: 'backupDailyAtTime',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_DAILY_AT_TIME',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_DAILY_AT_TIME_DESCRIPTION',
              required: true,
              value: this.settings.dataBackup.backupDailyAtTime,
              fieldType: DialogFieldType.TIMEPICKER,
              visible: (fieldsData): boolean => {
                // input visible ?
                return !fieldsData.disabled &&
                                    fieldsData.backupType === Constants.SYSTEM_BACKUP_TYPES.DAILY_AT_TIME.value;
              }
            }),

            // data retention interval
            new DialogField({
              name: 'dataRetentionInterval',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL_DESCRIPTION',
              required: true,
              value: this.settings.dataBackup.dataRetentionInterval,
              type: 'number',
              visible: (fieldsData): boolean => {
                return !fieldsData.disabled;
              }
            }),

            // module list
            new DialogField({
              name: 'modules',
              placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES',
              description: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES_DESCRIPTION',
              inputOptions: this.moduleList,
              inputOptionsMultiple: true,
              required: true,
              value: this.settings.dataBackup.modules,
              visible: (fieldsData): boolean => {
                return !fieldsData.disabled;
              }
            })
          ]})
        )
        .subscribe((answer: DialogAnswer) => {
          if (answer.button === DialogAnswerButton.Yes) {
            // if the automatic backup is off do not change the rest of the settings
            if (answer.inputValue.value.disabled) {
              answer.inputValue.value = {...currentSettings};
              answer.inputValue.value.disabled = true;
            }

            this.showLoadingDialog();
            this.systemSettingsDataService
              .modifySystemSettings({
                dataBackup: answer.inputValue.value
              })
              .pipe(
                catchError((err) => {
                  this.closeLoadingDialog();
                  this.toastV2Service.error(err);
                  return throwError(err);
                })
              )
              .subscribe(() => {
                // display success message
                this.closeLoadingDialog();
                this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SUCCESS_MESSAGE');

                // refresh settings
                this.refreshSystemSettings();
              });
          }
        });
    });
  }

  /**
     * Show backup data
     * @param item
     */
  showBackupData(item: BackupModel) {
    this.dialogService
      .showInput(new DialogConfiguration({
        message: 'LNG_PAGE_SYSTEM_BACKUPS_VIEW_BACKUP_DIALOG_TITLE',
        buttons: [
          new DialogButton({
            label: 'LNG_COMMON_BUTTON_CLOSE',
            clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
              dialogHandler.close();
            }
          })
        ],
        fieldsList: [
          new DialogField({
            name: '_',
            fieldType: DialogFieldType.SECTION_TITLE,
            placeholder: 'LNG_BACKUP_FIELD_LABEL_LOCATION'
          }),
          new DialogField({
            name: '_',
            fieldType: DialogFieldType.ACTION,
            placeholder: item.location
          })
        ]
      }))
      .subscribe();
  }
}
