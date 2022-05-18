import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { BackupModel } from '../../../../core/models/backup.model';
import { Constants } from '../../../../core/models/constants';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { UserModel } from '../../../../core/models/user.model';
import { SystemBackupDataService } from '../../../../core/services/data/system-backup.data.service';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputMultiDropdown, IV2SideDialogConfigInputSingleDropdown, IV2SideDialogConfigInputText, IV2SideDialogResponse, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';

@Component({
  selector: 'app-backups',
  templateUrl: './backups.component.html'
})
export class BackupsComponent extends ListComponent<BackupModel> implements OnDestroy {
  // settings
  settings: SystemSettingsModel;
  // used to determine when a backup has finished so we can start the restore process...
  waitForBackupIdToBeReady: string;

  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private systemSettingsDataService: SystemSettingsDataService,
    private systemBackupDataService: SystemBackupDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);

    // default backup settings
    this.refreshSystemSettings();
  }

  /**
  * Release resources
  */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
  * Initialize Side Table Columns
  */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'description',
        label: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'location',
        label: 'LNG_BACKUP_FIELD_LABEL_LOCATION',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'modules',
        label: 'LNG_BACKUP_FIELD_LABEL_MODULES',
        format: {
          type: (item: BackupModel) => {
            return this.getModulesTranslation(item);
          }
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.backupModules as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      },
      {
        field: 'date',
        label: 'LNG_BACKUP_FIELD_LABEL_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'status',
        label: 'LNG_BACKUP_FIELD_LABEL_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.backupStatus as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      },
      {
        field: 'sizeBytesHumanReadable',
        label: 'LNG_BACKUP_FIELD_LABEL_FILE_SIZE'
      },
      {
        field: 'duration',
        label: 'LNG_BACKUP_FIELD_LABEL_DURATION'
      },
      {
        field: 'user',
        label: 'LNG_BACKUP_FIELD_LABEL_USER',
        format: {
          type: 'createdByUser.name'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        }
      },
      {
        field: 'error',
        label: 'LNG_BACKUP_FIELD_LABEL_ERROR',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View backup path
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_VIEW_BACKUP_PATH',
            action: {
              click: (item: BackupModel) => {
                this.showBackupData(item);
              }
            },
            visible: (item: BackupModel): boolean => {
              return item.status !== Constants.SYSTEM_BACKUP_STATUS.PENDING.value &&
                BackupModel.canView(this.authUser);
            }
          },

          // Restore backup
          {
            type: V2ActionType.ICON,
            icon: 'restore',
            iconTooltip: 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_RESTORE_BACKUP',
            action: {
              click: (item: BackupModel) => {
                this.restoreBackup(item);
              }
            },
            visible: (item: BackupModel): boolean => {
              return item.status === Constants.SYSTEM_BACKUP_STATUS.SUCCESS.value &&
                BackupModel.canRestore(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete backup
              {
                label: {
                  get: () => 'LNG_PAGE_SYSTEM_BACKUPS_ACTION_DELETE_BACKUP'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: BackupModel): void => {
                    // determine what we need to delete
                    this.dialogV2Service
                      .showConfirmDialog({
                        config: {
                          title: {
                            get: () => 'LNG_COMMON_LABEL_DELETE',
                            data: () => (
                              {
                                name: item.description
                              }
                            )
                          },
                          message: {
                            get: () => 'LNG_DIALOG_CONFIRM_DELETE_BACKUP',
                            data: () => (
                              {
                                location: item.location ?
                                  item.location :
                                  '-'
                              }
                            )
                          }
                        }
                      })
                      .subscribe((response) => {
                        // canceled ?
                        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                          // finished
                          return;
                        }

                        // show loading
                        const loading = this.dialogV2Service.showLoadingDialog();

                        // delete backup
                        this.systemBackupDataService
                          .deleteBackup(item.id)
                          .pipe(
                            catchError((err) => {
                              // show error
                              this.toastV2Service.error(err);

                              // hide loading
                              loading.close();

                              // send error down the road
                              return throwError(err);
                            })
                          )
                          .subscribe(() => {
                            // success
                            this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // hide loading
                            loading.close();

                            // reload data
                            this.needsRefreshList(true);
                          });
                      });
                  }
                },
                visible: (item: BackupModel): boolean => {
                  return item.status !== Constants.SYSTEM_BACKUP_STATUS.PENDING.value &&
                    BackupModel.canDelete(this.authUser);
                }
              }
            ]
          }
        ]
      }
    ];
  }

  /**
  * Initialize process data
  */
  protected initializeProcessSelectedData(): void {}

  /**
  * Initialize table infos
  */
  protected initializeTableInfos(): void {}

  /**
  * Initialize Table Advanced Filters
  */
  protected initializeTableAdvancedFilters(): void {}

  /**
  * Initialize table quick actions
  */
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return this.settings && (BackupModel.canSetAutomaticBackupSettings(this.authUser) || BackupModel.canCreate(this.authUser));
      },
      menuOptions: [
        {
          label: {
            get: () => 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_BUTTON'
          },
          action: {
            click: () => {
              this.configureAutomaticBackupSettings();
            }
          },
          visible: (): boolean => {
            return BackupModel.canSetAutomaticBackupSettings(this.authUser);
          }
        },

        {
          label: {
            get: () => 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_BUTTON'
          },
          action: {
            click: () => {
              this.backupData();
            }
          },
          visible: (): boolean => {
            return BackupModel.canCreate(this.authUser);
          }
        }
      ]
    };
  }

  /**
  * Initialize table group actions
  */
  protected initializeGroupActions(): void {}

  /**
  * Initialize table add action
  */
  protected initializeAddAction(): void {}

  /**
  * Initialize table grouped data
  */
  protected initializeGroupedData(): void {}

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
  protected initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_SYSTEM_BACKUPS_TITLE',
        action: null
      }
    ];
  }

  /**
  * Fields retrieved from api to reduce payload size
  */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
  * Refresh list
  */
  refreshList() {
    this.records$ = this.systemBackupDataService
      .getBackupList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
  * Get total number of items, based on the applied filters
  */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    this.systemBackupDataService
      .getBackupListCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }

  /**
  * Get translation token from language
  */
  getModulesTranslation(backup: BackupModel) {
    return backup.modules.map(module => module && this.activatedRoute.snapshot.data.backupModules && this.activatedRoute.snapshot.data.backupModules.map[module] ?
      this.i18nService.instant(this.activatedRoute.snapshot.data.backupModules.map[module].label) : '').join(', ');
  }

  /**
  * Backup data
  */
  backupData() {
    // display dialog
    this.initBackupDialog().subscribe((response: IV2SideDialogResponse) => {
      // cancelled ?
      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
        return;
      }

      // backup settings
      const backupSettings = {
        description: (response.data.map.description as IV2SideDialogConfigInputText).value,
        location: (response.data.map.location as IV2SideDialogConfigInputText).value,
        modules: (response.data.map.modules as IV2SideDialogConfigInputMultiDropdown).values
      };

      this.systemBackupDataService
        .createBackup(backupSettings)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // success message
          this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

          // close popup
          response.handler.hide();

          // refresh list
          this.needsRefreshList(true);
        });
    });
  }

  /**
  * Init backup dialog
  */
  initBackupDialog(): Observable<IV2SideDialogResponse> {
    return this.dialogV2Service.showSideDialog({
      // title
      title: {
        get: () => 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_TITLE'
      },

      // inputs
      inputs: [
        {
          // description
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION',
          tooltip: 'LNG_BACKUP_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
          name: 'description',
          value: this.settings.dataBackup.description
        },
        {
          type: V2SideDialogConfigInputType.TEXT,
          placeholder: 'LNG_BACKUP_FIELD_LABEL_LOCATION',
          tooltip: 'LNG_BACKUP_FIELD_LABEL_LOCATION_DESCRIPTION',
          name: 'location',
          value: this.settings.dataBackup.location,
          validators: {
            required: () => true
          }
        },
        {
          type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
          placeholder: 'LNG_BACKUP_FIELD_LABEL_MODULES',
          tooltip: 'LNG_BACKUP_FIELD_LABEL_MODULES_DESCRIPTION',
          name: 'modules',
          options: (this.activatedRoute.snapshot.data.backupModules as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          values: this.settings.dataBackup.modules,
          validators: {
            required: () => true
          }
        }
      ],

      // buttons
      bottomButtons: [
        {
          label: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_CREATE_BACKUP_BUTTON',
          type: IV2SideDialogConfigButtonType.OTHER,
          color: 'primary',
          key: 'save',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }
      ],

      // hide search bar
      hideInputFilter: true
    });
  }

  // TODO: Restore backup needs to be tested on local environment ⚠️
  // /**
  //  * Restore system data to a previous state from a data backup
  //  */
  // restoreBackup(backupItemData: BackupModel) {
  //   // restore backup handler
  //   const restoreBackupNow = () => {
  //     this.loading = true;
  //     this.waitForBackupIdToBeReady = undefined;
  //     this.systemBackupDataService
  //       .restoreBackup(backupItemData.id)
  //       .pipe(
  //         catchError((err) => {
  //           this.toastV2Service.error(err);
  //           return throwError(err);
  //         })
  //       )
  //       .subscribe(() => {
  //         // display success message
  //         this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_BACKUP_RESTORE_SUCCESS_MESSAGE');

  //         // refresh page
  //         this.loading = false;
  //         this.needsRefreshList(true);
  //       });
  //   };

  //   // start restore process when backup is ready
  //   const backupCheckForReady = () => {
  //     setTimeout(
  //       () => {
  //         // check if backup is ready
  //         this.systemBackupDataService
  //           .getBackup(this.waitForBackupIdToBeReady)
  //           .pipe(
  //             catchError((err) => {
  //               this.toastV2Service.error(err);

  //               // can't continue with the restore
  //               this.waitForBackupIdToBeReady = undefined;
  //               this.needsRefreshList(true);

  //               return throwError(err);
  //             })
  //           )
  //           .subscribe((newBackup: BackupModel) => {
  //             switch (newBackup.status) {
  //               // backup ready ?
  //               case Constants.SYSTEM_BACKUP_STATUS.SUCCESS.value:
  //                 // start restore process
  //                 restoreBackupNow();
  //                 break;

  //                 // backup error ?
  //               case Constants.SYSTEM_BACKUP_STATUS.FAILED.value:
  //                 this.toastV2Service.error('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_FAILED_MESSAGE');
  //                 this.waitForBackupIdToBeReady = undefined;
  //                 this.needsRefreshList(true);
  //                 break;

  //                 // backup isn't ready ?
  //                 // Constants.SYSTEM_BACKUP_STATUS.PENDING.value
  //               default:
  //                 backupCheckForReady();
  //                 break;
  //             }
  //           });
  //       },
  //       Constants.DEFAULT_FILTER_POOLING_MS_CHECK_AGAIN
  //     );
  //   };

  //   // display dialog
  //   this.dialogService.showConfirm(new DialogConfiguration({
  //     message: 'LNG_DIALOG_CONFIRM_DELETE_BACKUP_RESTORE',
  //     yesLabel: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_BACKUP_AND_RESTORE_BUTTON',
  //     yesCssClass: 'primary dialog-btn-margin-right-10px',
  //     cancelCssClass: 'danger dialog-btn-margin-right-10px',
  //     addDefaultButtons: true,
  //     buttons: [
  //       new DialogButton({
  //         cssClass: 'success',
  //         label: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_RESTORE_BUTTON',
  //         clickCallback: (dialogHandler: MatDialogRef<DialogComponent>) => {
  //           dialogHandler.close(new DialogAnswer(DialogAnswerButton.Extra_1));
  //         }
  //       })
  //     ]
  //   })).subscribe((answer: DialogAnswer) => {
  //     // Backup & Restore
  //     if (answer.button === DialogAnswerButton.Yes) {
  //       // display dialog
  //       this.initBackupDialog().subscribe((answerBackup: DialogAnswer) => {
  //         if (answerBackup.button === DialogAnswerButton.Yes) {
  //           this.systemBackupDataService
  //             .createBackup(answerBackup.inputValue.value)
  //             .pipe(
  //               catchError((err) => {
  //                 this.toastV2Service.error(err);
  //                 return throwError(err);
  //               })
  //             )
  //             .subscribe((newBackup: BackupModel) => {
  //               // display success message
  //               this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

  //               // refresh page
  //               this.needsRefreshList(true);

  //               // restore data
  //               // should we wait for backup to be completed before proceeding ?
  //               this.waitForBackupIdToBeReady = newBackup.id;
  //               backupCheckForReady();
  //             });
  //         } else {
  //           // cancel - display again the previous dialog
  //           this.restoreBackup(backupItemData);
  //         }
  //       });
  //     } else if (answer.button === DialogAnswerButton.Extra_1) {
  //       // restore
  //       restoreBackupNow();
  //     }
  //   });
  // }

  /**
  * Restore system data to a previous state from a data backup
  */
  restoreBackup(item: BackupModel) {
    // restore backup handler
    const restoreBackupNow = () => {
      this.waitForBackupIdToBeReady = undefined;

      // show loading
      const loading = this.dialogV2Service.showLoadingDialog();

      this.systemBackupDataService
        .restoreBackup(item.id)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // display success message
          this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_BACKUP_RESTORE_SUCCESS_MESSAGE');

          // hide loading
          loading.close();

          // refresh page
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

    // show confirm dialog to confirm the action
    this.dialogV2Service.showBottomDialog({
      config: {
        title: {
          get: () => 'LNG_COMMON_LABEL_RESTORE',
          data: () => ({
            name: item.description
          })
        },
        message: {
          get: () => 'LNG_DIALOG_CONFIRM_DELETE_BACKUP_RESTORE',
          data: () => ({
            name: item.description
          })
        }
      },

      // buttons
      bottomButtons: [
        {
          type: IV2BottomDialogConfigButtonType.OTHER,
          label: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_BACKUP_AND_RESTORE_BUTTON',
          key: 'backupAndRestore',
          color: 'warn'
        },
        {
          type: IV2BottomDialogConfigButtonType.OTHER,
          label: 'LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_BACKUP_RESTORE_BUTTON',
          key: 'restore',
          color: 'warn'
        },
        {
          type: IV2BottomDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }
      ]
    }).subscribe((response) => {
      // canceled ?
      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
        // finished
        return;
      }

      // backup & restore
      if (response.button.type === IV2BottomDialogConfigButtonType.OTHER && response.button.key === 'backupAndRestore') {
        this.initBackupDialog().subscribe((answerBackup: IV2SideDialogResponse) => {
          // yes ?
          if (answerBackup.button.type === IV2SideDialogConfigButtonType.OTHER) {
            // backup settings
            const backupSettings = {
              description: (answerBackup.data.map.description as IV2SideDialogConfigInputText).value,
              location: (answerBackup.data.map.location as IV2SideDialogConfigInputText).value,
              modules: (answerBackup.data.map.modules as IV2SideDialogConfigInputMultiDropdown).values
            };

            // show loading
            const loading = this.dialogV2Service.showLoadingDialog();

            // create backup
            this.systemBackupDataService
              .createBackup(backupSettings)
              .pipe(
                catchError((err) => {
                  // show error
                  this.toastV2Service.error(err);

                  // hide loading
                  loading.close();

                  // send error down the road
                  return throwError(err);
                })
              ).subscribe((newBackup: BackupModel) => {
                // display success message
                this.toastV2Service.success('LNG_PAGE_SYSTEM_BACKUPS_CREATE_BACKUP_DIALOG_SUCCESS_MESSAGE');

                // hide loading
                loading.close();

                // refresh page
                this.needsRefreshList(true);

                // restore data
                // should we wait for backup to be completed before proceeding ?
                this.waitForBackupIdToBeReady = newBackup.id;
                backupCheckForReady();
              });
          } else {
            // cancel - display again the previous dialog
            this.restoreBackup(item);
          }
        });
      }

      // restore
      else if (response.button.type === IV2BottomDialogConfigButtonType.OTHER && response.button.key === 'restore') {
        restoreBackupNow();
      }
    });
  }

  /**
  * Configure automatic backup settings
  */
  configureAutomaticBackupSettings() {
    // keep the existing configuration
    const currentSettings = { ...this.settings.dataBackup };

    this.dialogV2Service
      .showSideDialog({
        // title
        title: {
          get: () => 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_TITLE'
        },

        // width
        width: '50rem',

        // hide search bar
        hideInputFilter: true,

        // inputs
        inputs: [
          // info
          {
            type: V2SideDialogConfigInputType.DIVIDER,
            placeholder: 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_EXISTING_CONFIGURATION_INFO'
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'disabled',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_DISABLED'),
            value: this.settings.dataBackup.disabled ? this.i18nService.instant('LNG_COMMON_LABEL_YES') : this.i18nService.instant('LNG_COMMON_LABEL_NO')
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'description',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION'),
            value: this.settings.dataBackup.description ?
              this.settings.dataBackup.description :
              '',
            visible: () => {
              return !this.settings.dataBackup.disabled;
            }
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'location',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION'),
            value: this.settings.dataBackup.location,
            visible: (data) => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'backupInterval',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL'),
            value: this.settings.dataBackup.backupInterval !== undefined ?
              this.settings.dataBackup.backupInterval.toString() :
              '',
            visible: (data) => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'dataRetentionInterval',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL'),
            value: this.settings.dataBackup.dataRetentionInterval !== undefined ?
              this.settings.dataBackup.dataRetentionInterval.toString() :
              '',
            visible: (data) => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            name: 'modules',
            placeholder: this.i18nService.instant('LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES'),
            value: this.settings.dataBackup.modules ? this.settings.dataBackup.modules.join(', ') : '',
            visible: (data) => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },

          // disabled
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            name: 'disabled',
            placeholder: 'LNG_BACKUP_FIELD_LABEL_DISABLED',
            tooltip: 'LNG_BACKUP_FIELD_LABEL_DISABLED_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            value: this.settings.dataBackup.disabled as unknown as string,
            validators: {
              required: () => true
            }
          },

          // description
          {
            type: V2SideDialogConfigInputType.TEXT,
            name: 'description',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FILED_LABEL_DESCRIPTION_DESCRIPTION',
            value: this.settings.dataBackup.description,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },

          // location
          {
            type: V2SideDialogConfigInputType.TEXT,
            name: 'location',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_LOCATION_DESCRIPTION',
            validators: {
              required: () => true
            },
            value: this.settings.dataBackup.location,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },

          // backup interval type
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            name: 'backupType',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_TYPE_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.backupTypes as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            validators: {
              required: () => true
            },
            value: this.settings.dataBackup.backupType ?
              this.settings.dataBackup.backupType :
              Constants.SYSTEM_BACKUP_TYPES.N_HOURS.value,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },

          // backup interval
          {
            type: V2SideDialogConfigInputType.NUMBER,
            name: 'backupInterval',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_INTERVAL_DESCRIPTION',
            validators: {
              required: () => true
            },
            value: this.settings.dataBackup.backupInterval,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value &&
                  (data.map.backupType as IV2SideDialogConfigInputSingleDropdown).value === Constants.SYSTEM_BACKUP_TYPES.N_HOURS.value;
            }
          },

          // backup daily at a time
          {
            type: V2SideDialogConfigInputType.TIMEPICKER,
            name: 'backupDailyAtTime',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_DAILY_AT_TIME',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_BACKUP_DAILY_AT_TIME_DESCRIPTION',
            validators: {
              required: () => true
            },
            value: this.settings.dataBackup.backupDailyAtTime,
            visible: (data): boolean => {
              // input visible ?
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value &&
                  (data.map.backupType as IV2SideDialogConfigInputSingleDropdown).value === Constants.SYSTEM_BACKUP_TYPES.DAILY_AT_TIME.value;
            }
          },

          // data retention interval
          {
            type: V2SideDialogConfigInputType.NUMBER,
            name: 'dataRetentionInterval',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_RETENTION_INTERVAL_DESCRIPTION',
            validators: {
              required: () => true
            },
            value: this.settings.dataBackup.dataRetentionInterval,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          },

          // module list
          {
            type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
            name: 'modules',
            placeholder: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES',
            tooltip: 'LNG_AUTOMATIC_BACKUP_FIELD_LABEL_MODULES_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.backupModules as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            validators: {
              required: () => true
            },
            values: this.settings.dataBackup.modules,
            visible: (data): boolean => {
              return !(data.map.disabled as IV2SideDialogConfigInputSingleDropdown).value;
            }
          }
        ],

        // buttons
        bottomButtons: [
          {
            label: 'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SAVE_BUTTON',
            type: IV2SideDialogConfigButtonType.OTHER,
            color: 'primary',
            key: 'save',
            disabled: (_data, handler): boolean => {
              return !handler.form || handler.form.invalid;
            }
          }, {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ]
      })
      .subscribe((response: IV2SideDialogResponse) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          return;
        }

        // if the automatic backup is off do not change the rest of the settings
        let backupSettings;
        if (response.data.map.disabled) {
          backupSettings = { ...currentSettings };
          backupSettings.disabled = true;
        }

        // change automatic backup settings
        this.systemSettingsDataService
          .modifySystemSettings({
            dataBackup: backupSettings
          })
          .pipe(
            catchError((err) => {
              this.toastV2Service.error(err);
              return throwError(err);
            })
          )
          .subscribe(() => {
            // success message
            this.toastV2Service.success(
              'LNG_PAGE_SYSTEM_BACKUPS_AUTOMATIC_BACKUP_SETTINGS_DIALOG_SUCCESS_MESSAGE');

            // close popup
            response.handler.hide();

            // refresh list
            this.needsRefreshList(true);
          });
      });
  }

  /**
  * Show backup data
  * @param item
  */
  showBackupData(item: BackupModel) {
    this.dialogV2Service
      .showSideDialog({
        // title
        title: {
          get: () => 'LNG_PAGE_SYSTEM_BACKUPS_VIEW_BACKUP_DIALOG_TITLE'
        },

        // inputs
        inputs: [
          {
            type: V2SideDialogConfigInputType.KEY_VALUE,
            placeholder: 'LNG_BACKUP_FIELD_LABEL_LOCATION',
            name: 'path',
            value: item.location
          }
        ],

        // buttons
        bottomButtons: [
          {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ],

        // Hide search bar
        hideInputFilter: true
      })
      .subscribe();
  }
}
