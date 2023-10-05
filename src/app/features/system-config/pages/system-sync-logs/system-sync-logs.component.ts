import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { EMPTY, ObservableInput, throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSyncLogDataService } from '../../../../core/services/data/system-sync-log.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2FilterMultipleSelect, V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputSingleDropdown, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { Constants } from '../../../../core/models/constants';
import { ExportSyncErrorModel, ExportSyncErrorModelCode } from '../../../../core/models/export-sync-error.model';
import { LocalizationHelper } from '../../../../core/helperClasses/localization-helper';

@Component({
  selector: 'app-system-sync-logs-list',
  templateUrl: './system-sync-logs.component.html'
})
export class SystemSyncLogsComponent
  extends ListComponent<SystemSyncLogModel, IV2Column>
  implements OnDestroy {
  /**
  * Constructor
  */
  constructor(
    protected listHelperService: ListHelperService,
    private toastV2Service: ToastV2Service,
    private systemSyncLogDataService: SystemSyncLogDataService,
    private systemSettingsDataService: SystemSettingsDataService,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService, {
        disableWaitForSelectedOutbreakToRefreshList: true
      }
    );
  }

  /**
   * Component initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Error
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_VIEW_ERROR',
          action: {
            click: (item: SystemSyncLogModel) => {
              this.viewError(item);
            }
          },
          visible: (item: SystemSyncLogModel): boolean => {
            return !_.isEmpty(item.error) &&
              SystemSyncLogModel.canView(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete log
            {
              label: {
                get: () => 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_LOG'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: SystemSyncLogModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE_WITHOUT_NAME'
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_SYSTEM_SYNC_LOG'
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete log
                    this.systemSyncLogDataService
                      .deleteSyncLog(item.id)
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
                        this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (): boolean => {
                return SystemSyncLogModel.canDelete(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'syncServerUrl',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'syncClientId',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CLIENT_ID',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'actionStartDate',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_ACTION_START_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'actionCompletionDate',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_ACTION_COMPLETION_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
      },
      {
        field: 'outbreaks',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_OUTBREAKS',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: SystemSyncLogModel) => item.outbreakIDs?.length > 0 ?
          item.outbreakIDs
            .filter((outbreakId) => !!(this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId])
            .map((outbreakId) => {
              return {
                label: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).map[outbreakId].name,
                href: OutbreakModel.canView(this.authUser) ?
                  `/outbreaks/${ outbreakId }/view` :
                  null
              };
            }) :
          [
            {
              label: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_LABEL_ALL_OUTBREAKS'),
              href: null
            }
          ],
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
          search: (column: IV2Column) => {
            // create condition
            const values: string[] = (column.filter as IV2FilterMultipleSelect).value;
            const condition = {
              outbreakIDs: {
                inq: values
              }
            };

            // remove existing filter
            this.queryBuilder.filter.removeExactCondition(condition);

            // add new filter
            if (values) {
              // filter
              this.queryBuilder.filter.bySelect(
                'outbreakIDs',
                values,
                false,
                null
              );

              // refresh list
              this.needsRefreshList();
            }
          }
        }
      },
      {
        field: 'status',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_STATUS',
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.syncLogsStatus as IResolverV2ResponseModel<ILabelValuePairModel>).options
        }
      },
      {
        field: 'informationStartDate',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_INFORMATION_START_DATE',
        sortable: true,
        format: {
          type: V2ColumnFormat.DATE
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        }
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
        return SystemSyncLogModel.canSetSettings(this.authUser) ||
          SystemSyncLogModel.canBulkDelete(this.authUser) ||
          SystemSyncLogModel.canImportPackage(this.authUser) ||
          SystemSyncLogModel.canExportPackage(this.authUser);
      },
      menuOptions: [
        // change logs sync settings
        {
          label: {
            get: () => {
              return 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_BUTTON';
            }
          },
          action: {
            click: () => {
              this.configureSyncSettings();
            }
          },
          visible: (): boolean => {
            return SystemSyncLogModel.canSetSettings(this.authUser);
          }
        },

        // bulk delete
        {
          label: {
            get: () => {
              return 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_DELETE_LOGS_BUTTON';
            }
          },
          action: {
            click: () => {
              this.deleteServerSyncLogs();
            }
          },
          visible: (): boolean => {
            return SystemSyncLogModel.canBulkDelete(this.authUser);
          }
        },

        // import sync package
        {
          label: {
            get: () => 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_IMPORT_SYNC_PACKAGE_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'sync-package', 'import']
          },
          visible: (): boolean => {
            return SystemSyncLogModel.canImportPackage(this.authUser);
          }
        },

        // export sync package
        {
          label: {
            get: () => {
              return 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_EXPORT_SYNC_PACKAGE_BUTTON';
            }
          },
          action: {
            click: () => {
              this.exportSyncPackage();
            }
          },
          visible: (): boolean => {
            return SystemSyncLogModel.canExportPackage(this.authUser);
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
        label: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_TITLE',
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
    // sync logs
    this.records$ = this.systemSyncLogDataService
      .getSyncLogList(this.queryBuilder)
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

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    countQueryBuilder.clearFields();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    this.systemSyncLogDataService
      .getSyncLogsCount(countQueryBuilder)
      .pipe(
        // error
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
  * Configure sync settings
  */
  configureSyncSettings() {
    this.dialogV2Service.showSideDialog(
      {
        // title
        title: {
          get: () => 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_TITLE'
        },

        // inputs
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_UPSTREAM_SERVER_SYNC_SETTINGS_FIELD_LABEL_TRIGGER_BACKUP_BEFORE_SYNC',
            tooltip: 'LNG_UPSTREAM_SERVER_SYNC_SETTINGS_FIELD_LABEL_TRIGGER_BACKUP_BEFORE_SYNC_DESCRIPTION',
            options: (this.activatedRoute.snapshot.data.yesNo as IResolverV2ResponseModel<ILabelValuePairModel>).options,
            name: 'triggerBackupBeforeSync',
            value: undefined,
            validators: {
              required: () => true
            }
          }
        ],
        bottomButtons: [
          {
            label: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_SAVE_BUTTON',
            type: IV2SideDialogConfigButtonType.OTHER,
            color: 'primary',
            key: 'save',
            disabled: (_data, handler): boolean => {
              return !handler.form || handler.form.invalid;
            }
          },
          {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ],
        initialized: (handler) => {
          // display loading
          handler.loading.show();

          // retrieve system settings
          this.systemSettingsDataService
            .getSystemSettings()
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((settings) => {
              // set data
              (handler.data.map.triggerBackupBeforeSync as IV2SideDialogConfigInputSingleDropdown).value = settings.sync?.triggerBackupBeforeSync as unknown as string;

              // hide loading
              handler.loading.hide();
            });
        }
      }
    ).subscribe((response) => {
      // cancelled ?
      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
        return;
      }

      // modify sync settings
      this.systemSettingsDataService
        .modifySystemSettings({
          sync: {
            triggerBackupBeforeSync: (response.data.map.triggerBackupBeforeSync as IV2SideDialogConfigInputSingleDropdown).value
          }
        }).pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // success message
          this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_SYNC_SETTINGS_DIALOG_SUCCESS_MESSAGE');

          // close popup
          response.handler.hide();

          // refresh list
          this.needsRefreshList(true);
        });
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

    this.dialogV2Service
      .showSideDialog({
        // title
        title: {
          get: () => 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ERROR_DETAILS_TITLE',
          data: () => {
            return { count: '?' };
          }
        },

        // hide search bar
        hideInputFilter: true,

        // inputs
        width: '65rem',
        inputs: [
          {
            type: V2SideDialogConfigInputType.HTML,
            name: 'error',
            placeholder: errJson ?
              `<code><pre>${JSON.stringify(errJson, null, 1)}</pre></code>` :
              `<code>${error}</code>`
          }
        ],

        // buttons
        bottomButtons: [
          {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ]
      }).subscribe();
  }

  /**
  * Delete all sync logs from a specific server
  */
  deleteServerSyncLogs() {
    this.dialogV2Service.showSideDialog(
      {
        title: {
          get: () => 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_DELETE_SYNC_LOGS_DIALOG_TITLE'
        },
        hideInputFilter: true,
        width: '50rem',
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL',
            tooltip: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SERVER_URL_DESCRIPTION',
            options: [],
            name: 'syncServerUrl',
            value: null,
            validators: {
              required: () => true
            }
          }
        ],
        bottomButtons: [
          {
            label: 'LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_DELETE_SYNC_LOGS_DIALOG_DELETE_BUTTON',
            type: IV2SideDialogConfigButtonType.OTHER,
            color: 'primary',
            key: 'save',
            disabled: (_data, handler): boolean => {
              return !handler.form || handler.form.invalid;
            }
          },
          {
            type: IV2SideDialogConfigButtonType.CANCEL,
            label: 'LNG_COMMON_BUTTON_CANCEL',
            color: 'text'
          }
        ],
        initialized: (handler) => {
          // display loading
          handler.loading.show();

          // retrieve system settings
          this.systemSettingsDataService
            .getSystemSettings()
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              }),

              // should be the last pipe
              takeUntil(this.destroyed$)
            )
            .subscribe((settings) => {
              // set data
              (handler.data.map.syncServerUrl as IV2SideDialogConfigInputSingleDropdown).options = (settings.upstreamServers || []).map((upstreamServer: SystemUpstreamServerModel) => {
                return {
                  label: upstreamServer.name,
                  value: upstreamServer.url
                };
              });

              // hide loading
              handler.loading.hide();
            });
        }
      }
    ).subscribe((response) => {
      // cancelled ?
      if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
        return;
      }

      // construct query
      const qb = new RequestQueryBuilder();
      qb.filter.byEquality(
        'syncServerUrl',
        (response.data.map.syncServerUrl as IV2SideDialogConfigInputSingleDropdown).value
      );

      // send request
      this.systemSyncLogDataService
        .deleteSyncLogs(qb)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          })
        )
        .subscribe(() => {
          // success message
          this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_SYNC_LOGS_ACTION_DELETE_SERVER_SUCCESS_MESSAGE');

          // close popup
          response.handler.hide();

          // refresh list
          this.needsRefreshList(true);
        });
    });
  }

  /**
  * Export sync package
  */
  exportSyncPackage() {
    // display export dialog
    this.dialogV2Service.showExportData({
      title: {
        get: () => 'LNG_PAGE_SYSTEM_BACKUPS_EXPORT_SYNC_PACKAGE'
      },
      export: {
        url: 'sync/database-snapshot',
        async: false,
        method: ExportDataMethod.GET,
        fileName: `${ this.i18nService.instant('LNG_PAGE_SYSTEM_BACKUPS_EXPORT_SYNC_PACKAGE') } - ${ LocalizationHelper.now().format('YYYY-MM-DD') }`,
        allow: {
          types: [ExportDataExtension.ZIP],
          encrypt: false
        },
        inputs: {
          append: [
            {
              type: V2SideDialogConfigInputType.DATE,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_FROM_DATE',
              tooltip: 'LNG_SYNC_PACKAGE_FIELD_LABEL_FROM_DATE_DESCRIPTION',
              name: 'filter[where][fromDate]',
              value: null
            },
            {
              type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_OUTBREAKS',
              tooltip: 'LNG_SYNC_PACKAGE_FIELD_LABEL_OUTBREAKS_DESCRIPTION',
              name: 'filter[where][outbreakId][inq]',
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<OutbreakModel>).options,
              values: null
            },
            {
              type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE',
              tooltip: 'LNG_SYNC_PACKAGE_FIELD_LABEL_EXPORT_TYPE_DESCRIPTION',
              name: 'filter[where][exportType]',
              options: (this.activatedRoute.snapshot.data.syncLogsType as IResolverV2ResponseModel<ILabelValuePairModel>).options,
              clearable: true,
              value: null
            },
            {
              type: V2SideDialogConfigInputType.DROPDOWN_MULTI,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS',
              tooltip: 'LNG_SYNC_PACKAGE_FIELD_LABEL_COLLECTIONS_DESCRIPTION',
              name: 'filter[where][collections]',
              options: (this.activatedRoute.snapshot.data.syncLogsModule as IResolverV2ResponseModel<ILabelValuePairModel>).options,
              values: null,
              visible: (data): boolean => {
                return _.isEmpty((data.map['filter[where][exportType]'] as IV2SideDialogConfigInputSingleDropdown).value);
              }
            },
            {
              type: V2SideDialogConfigInputType.TOGGLE_CHECKBOX,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_INCLUDE_USERS',
              name: 'filter[where][includeUsers]',
              value: false,
              visible: (data): boolean => {
                // display only if Export Type is selected, excluding "Mobile" (because the Users, including Teams and Roles collections, are included by default in Mobile)
                const exportType = (data.map['filter[where][exportType]'] as IV2SideDialogConfigInputSingleDropdown).value;
                return !_.isEmpty(exportType) &&
                 exportType !== Constants.SYNC_PACKAGE_EXPORT_TYPES.MOBILE.value;
              }
            },
            {
              type: V2SideDialogConfigInputType.TEXT,
              placeholder: 'LNG_SYNC_PACKAGE_FIELD_LABEL_ENCRYPTION_PASSWORD',
              tooltip: 'LNG_SYNC_PACKAGE_FIELD_LABEL_ENCRYPTION_PASSWORD_DESCRIPTION',
              name: 'password',
              value: undefined
            }
          ]
        },
        formDataPrefilter: (data) => {
          // remove outbreak filter if no outbreak is selected
          if (
            data.filter?.where?.outbreakId &&
            !data.filter.where.outbreakId.inq
          ) {
            delete data.filter.where.outbreakId;
          }
        },
        catchError: (err: Blob | Error | ExportSyncErrorModel): ObservableInput<any> => {
          // custom error message ?
          if ((err as ExportSyncErrorModel).code === ExportSyncErrorModelCode.SYNC_NO_DATA_TO_EXPORT) {
            // normal error, continue with default process
            this.toastV2Service.notice('LNG_COMMON_LABEL_EXPORT_ERROR_NO_DATA');

            // send error further down the road
            // - DO NOT use of(..) because it goes into subscribe
            // - EMPTY allows you to not call callback from subscribe and also not show the error in console
            return EMPTY;
          }

          // normal error, continue with default process
          // show error
          this.toastV2Service.error('LNG_COMMON_LABEL_EXPORT_ERROR');

          // send error further down the road
          return throwError(err as any);
        }
      }
    });
  }
}
