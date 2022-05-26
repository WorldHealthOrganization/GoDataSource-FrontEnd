import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSyncLogModel } from '../../../../core/models/system-sync-log.model';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemSyncLogDataService } from '../../../../core/services/data/system-sync-log.data.service';
import { SystemSyncDataService } from '../../../../core/services/data/system-sync.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-upstream-servers-list',
  templateUrl: './upstream-servers-list.component.html'
})
export class UpstreamServersListComponent extends ListComponent<SystemUpstreamServerModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service,
    private systemSyncDataService: SystemSyncDataService,
    private systemSyncLogDataService: SystemSyncLogDataService,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);
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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_NAME'
      },
      {
        field: 'url',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_URL'
      },
      {
        field: 'credentials',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS',
        format: {
          obfuscated: true,
          type: (item: SystemUpstreamServerModel) => {
            return `${item.credentials?.clientId}/${item.credentials?.clientSecret}`;
          }
        }
      },
      {
        field: 'description',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_DESCRIPTION'
      },
      {
        field: 'timeout',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_TIMEOUT'
      },
      {
        field: 'syncInterval',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_INTERVAL'
      },
      {
        field: 'syncOnEveryChange',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ON_EVERY_CHANGE',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'syncEnabled',
        label: 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ENABLED',
        format: {
          type: V2ColumnFormat.BOOLEAN
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
          // Start sync
          {
            type: V2ActionType.ICON,
            icon: 'sync',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_START_SYNC',
            action: {
              click: (item: SystemUpstreamServerModel) => {
                this.startSync(item);
              }
            },
            visible: (): boolean => {
              return SystemUpstreamServerModel.canSync(this.authUser);
            }
          },

          // Disable sync
          {
            type: V2ActionType.ICON,
            icon: 'sync_disabled',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_DISABLE_SYNC',
            action: {
              click: (item: SystemUpstreamServerModel) => {
                this.toggleSyncEnableFlag(item);
              }
            },
            visible: (item: SystemUpstreamServerModel): boolean => {
              return item.syncEnabled &&
                SystemUpstreamServerModel.canDisableSync(this.authUser);
            }
          },

          // Enable sync
          {
            type: V2ActionType.ICON,
            icon: 'alarm_on',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_ENABLE_SYNC',
            action: {
              click: (item: SystemUpstreamServerModel) => {
                this.toggleSyncEnableFlag(item);
              }
            },
            visible: (item: SystemUpstreamServerModel): boolean => {
              return !item.syncEnabled &&
                SystemUpstreamServerModel.canEnableSync(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_DELETE_SERVER'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: SystemUpstreamServerModel): void => {
                    let systemSettings: SystemSettingsModel;

                    // determine what we need to delete
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: item.name
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_SYSTEM_UPSTREAM_SERVER',
                          data: () => ({
                            name: item.name
                          })
                        }
                      },
                      initialized: (handler) => {
                        // display loading
                        handler.loading.show();

                        // determine if case has exposed contacts
                        this.systemSettingsDataService
                          .getSystemSettings()
                          .pipe(
                            catchError((err) => {
                              // show error
                              this.toastV2Service.error(err);

                              // hide loading
                              handler.loading.hide();

                              // send error down the road
                              return throwError(err);
                            })
                          )
                          .subscribe((settings: SystemSettingsModel) => {
                            systemSettings = settings;

                            // hide loading
                            handler.loading.hide();
                          });
                      }
                    }).subscribe((response) => {
                      // canceled ?
                      if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                        // finished
                        return;
                      }

                      // show loading
                      const loading = this.dialogV2Service.showLoadingDialog();

                      // filter upstream servers
                      const upstreamServers = systemSettings.upstreamServers.filter((server: SystemUpstreamServerModel) => {
                        return server.url !== item.url;
                      });

                      // save upstream servers
                      this.systemSettingsDataService
                        .modifySystemSettings({
                          upstreamServers
                        })
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
                          this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (): boolean => {
                  return SystemUpstreamServerModel.canDelete(this.authUser);
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
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['./create']
      },
      visible: (): boolean => {
        return SystemUpstreamServerModel.canCreate(this.authUser);
      }
    };
  }

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
        label: 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_TITLE',
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
    this.records$ = this.systemSettingsDataService
      .getSystemSettings()
      .pipe(
        // map data
        map((settings: SystemSettingsModel) => {
          return settings.upstreamServers;
        }),

        // set count
        tap((upstreamServers: SystemUpstreamServerModel[]) => {
          this.pageCount = {
            count: upstreamServers.length,
            hasMore: false
          };
        })
      );
  }

  /**
   * Get total number of items
   */
  refreshListCount() {}

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
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
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
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_ACTION_TOGGLE_SYNC_ENABLED_SUCCESS_MESSAGE');
            });
          this.needsRefreshList(false, false, true);
        }
      });
  }

  /**
   * Start sync
   * @param upstreamServer
   */
  startSync(upstreamServer: SystemUpstreamServerModel) {
    this.dialogV2Service.showConfirmDialog({
      config: {
        title: {
          get: () => 'LNG_COMMON_LABEL_SYNC'
        },
        message: {
          get: () => 'LNG_DIALOG_CONFIRM_DELETE_SYSTEM_UPSTREAM_SYNC_CONFIRMATION',
          data: () => ({ name: upstreamServer.name })
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

      // check if sync is done
      const syncCheckIfDone = (syncLogId: string) => {
        setTimeout(
          () => {
            // check if backup is ready
            this.systemSyncLogDataService
              .getSyncLog(syncLogId)
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
              .subscribe((systemSyncLogModel: SystemSyncLogModel) => {
                switch (systemSyncLogModel.status) {
                  // sync ready ?
                  case Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS.value:
                  case Constants.SYSTEM_SYNC_LOG_STATUS.SUCCESS_WITH_WARNINGS.value:
                    // display success message
                    this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_SYNC_SUCCESS_MESSAGE');

                    // hide loading
                    loading.close();

                    // reload data
                    this.needsRefreshList(true);
                    break;

                  // sync error ?
                  case Constants.SYSTEM_SYNC_LOG_STATUS.FAILED.value:
                    this.toastV2Service.error('LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_SYNC_FAILED_MESSAGE');

                    // hide loading
                    loading.close();

                    // reload data
                    this.needsRefreshList(true);
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

      // start sync
      this.systemSyncDataService
        .sync(upstreamServer.url)
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
        .subscribe((systemSync) => {
          syncCheckIfDone(systemSync.syncLogId);
        });
    });
  }
}
