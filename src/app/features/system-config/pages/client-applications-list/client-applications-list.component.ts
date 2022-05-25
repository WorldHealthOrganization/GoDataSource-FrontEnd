import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { Observable, Subscriber, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { moment } from '../../../../core/helperClasses/x-moment';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { DialogField, DialogFieldType } from '../../../../shared/components';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { IV2SideDialogConfigInputText, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';

@Component({
  selector: 'app-client-applications-list',
  templateUrl: './client-applications-list.component.html'
})
export class ClientApplicationsListComponent
  extends ListComponent<SystemClientApplicationModel>
  implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private i18nService: I18nService,
    private activatedRoute: ActivatedRoute,
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
        label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME'
      },
      // TODO: Needs show/hide feature
      {
        field: 'credentials.clientSecret',
        label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CREDENTIALS'
      },
      {
        field: 'active',
        label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ACTIVE',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      }
    ];

    // // outbreaks
    if (OutbreakModel.canList(this.authUser)) {
      this.tableColumns.push(
        {
          field: 'outbreaks',
          label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS',
          format: {
            type: V2ColumnFormat.LINK_LIST
          },
          links: (item: SystemClientApplicationModel) => item.outbreakIDs?.length > 0 ?
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
                label: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_LABEL_ALL_OUTBREAKS'),
                href: null
              }
            ]
        }
      );
    }

    // rest of columns :)
    this.tableColumns.push(
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
          // Download client application config file
          {
            type: V2ActionType.ICON,
            // TODO: Icon doesn't look right
            icon: 'fileCopy',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE',
            action: {
              click: (item: SystemClientApplicationModel) => {
                this.downloadConfFile(item);
              }
            },
            visible: (item: SystemClientApplicationModel): boolean => {
              return SystemClientApplicationModel.canDownloadConfFile(this.authUser) && item.active;
            }
          },

          // Disable client application
          {
            type: V2ActionType.ICON,
            // TODO: Icon doesn't look right
            icon: 'visibilityOf',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DISABLE',
            action: {
              click: (item: SystemClientApplicationModel) => {
                this.toggleActiveFlag(item, false);
              }
            },
            visible: (item: SystemClientApplicationModel): boolean => {
              return item.active &&
                SystemClientApplicationModel.canDisable(this.authUser);
            }
          },

          // Enable client application
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_ENABLE',
            action: {
              click: (item: SystemClientApplicationModel) => {
                this.toggleActiveFlag(item, true);
              }
            },
            visible: (item: SystemClientApplicationModel): boolean => {
              return !item.active &&
                SystemClientApplicationModel.canEnable(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            menuOptions: [
              // Delete Case
              {
                label: {
                  get: () => 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DELETE'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: SystemClientApplicationModel): void => {
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
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_CLIENT_APPLICATION',
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

                      // filter client applications and remove client application
                      const filteredClientApplications = systemSettings.clientApplications.filter((clientApp: SystemClientApplicationModel) => {
                        return clientApp.id !== item.id;
                      });

                      // save upstream servers
                      this.systemSettingsDataService
                        .modifySystemSettings({
                          clientApplications: filteredClientApplications
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
                          this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (): boolean => {
                  return SystemClientApplicationModel.canDelete(this.authUser);
                }
              }
            ]
          }
        ]
      }
    );
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
        return SystemClientApplicationModel.canCreate(this.authUser);
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
        label: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE',
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
    this.records$ = this.systemSettingsDataService.getSystemSettings()
      .pipe(
        map((systemSettings: SystemSettingsModel) => {
          // get settings
          let clientApplications = _.get(systemSettings, 'clientApplications');
          clientApplications = clientApplications ? clientApplications : [];

          return _.map(
            clientApplications,
            (item: SystemClientApplicationModel) => {
              // set outbreak
              item.outbreaks = _.transform(
                item.outbreakIDs,
                (result, outbreakID: string) => {
                  // outbreak not deleted ?
                  if (this.activatedRoute.snapshot.data.outbreak && this.activatedRoute.snapshot.data.outbreak.map[outbreakID]) {
                    result.push(this.activatedRoute.snapshot.data.outbreak.map[outbreakID]);
                  }
                },
                []
              );

              // finished
              return item;
            });
        }),

        // set count
        tap((clientApplications: SystemClientApplicationModel[]) => {
          this.pageCount = {
            count: clientApplications.length,
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
   * Toggle active flag
   */
  toggleActiveFlag(clientApplication: SystemClientApplicationModel, newValue: boolean) {
    // save
    this.systemSettingsDataService
      .getSystemSettings()
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe((settings: SystemSettingsModel) => {
        // map client applications and modify client application status
        const childClientApplication: SystemClientApplicationModel = _.find(settings.clientApplications, (clientApp: SystemClientApplicationModel) => {
          return clientApp.id === clientApplication.id;
        });
        if (childClientApplication) {
          // update data
          childClientApplication.active = newValue;

          // save client applications
          this.systemSettingsDataService
            .modifySystemSettings({
              clientApplications: settings.clientApplications
            })
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_TOGGLE_ENABLED_SUCCESS_MESSAGE');

              // finished
              clientApplication.active = newValue;
            });
          // no client application found - must refresh page
          this.needsRefreshList(false, false, true);
        }
      });
  }

  // TODO: To be deleted, method left for inspiration
  /**
   * Download Configuration File
   * @param clientApplication
   */
  downloadConfFileOLD(clientApplication: SystemClientApplicationModel) {
    // construct api url if necessary
    let apiUrl: string = environment.apiUrl;
    apiUrl = apiUrl.indexOf('http://') === 0 || apiUrl.indexOf('https://') === 0 ?
      apiUrl : (
        (apiUrl.indexOf('/') === 0 ? '' : '/') +
                window.location.origin +
                apiUrl
      );

    // define api async check
    let apiURL: string;
    const apiObserver = new Observable((subscriber: Subscriber<boolean>) => {
      if (
        _.isString(apiURL) &&
                apiURL.includes('localhost')
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        this.systemSettingsDataService
          .getAPIVersion(apiURL)
          .pipe(
            catchError((err) => {
              subscriber.next(false);
              subscriber.complete();
              return throwError(err);
            })
          )
          .subscribe((versionData: any) => {
            if (_.get(versionData, 'version')) {
              subscriber.next(true);
              subscriber.complete();
            } else {
              subscriber.next(false);
              subscriber.complete();
            }
          });
      }
    });

    // display export dialog
    this.dialogService.showExportDialog({
      message: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_TITLE',
      url: 'system-settings/generate-file',
      fileName: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_FILE_NAME') +
                ' - ' +
                moment().format('YYYY-MM-DD'),
      fileType: ExportDataExtension.QR,
      allowedExportTypesKey: 'type',
      extraAPIData: {
        data: {
          clientId: clientApplication.credentials.clientId,
          clientSecret: clientApplication.credentials.clientSecret
        }
      },
      isPOST: true,
      extraDialogFields: [
        new DialogField({
          name: 'data[url]',
          placeholder: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_URL_LABEL',
          required: true,
          value: apiUrl,
          fieldType: DialogFieldType.URL,
          urlAsyncErrorMsg: 'LNG_FORM_VALIDATION_ERROR_FIELD_URL',
          urlAsyncValidator: (url: string): Observable<boolean> => {
            apiURL = url;
            return apiObserver;
          }
        })
      ],
      fileExtension: 'png'
      // exportStart: () => {
      //   this.showLoadingDialog();
      // },
      // exportFinished: () => {
      //   this.closeLoadingDialog();
      // }
    });
  }

  /**
   * Download Configuration File
   * @param clientApplication
   */
  downloadConfFile(clientApplication: SystemClientApplicationModel) {
    // construct api url if necessary
    let apiUrl: string = environment.apiUrl;
    apiUrl = apiUrl.indexOf('http://') === 0 || apiUrl.indexOf('https://') === 0 ?
      apiUrl : (
        (apiUrl.indexOf('/') === 0 ? '' : '/') +
        window.location.origin +
        apiUrl
      );

    // define api async check
    let apiURL: string;
    const apiObserver = new Observable((subscriber: Subscriber<boolean>) => {
      if (
        _.isString(apiURL) &&
        apiURL.includes('localhost')
      ) {
        subscriber.next(false);
        subscriber.complete();
      } else {
        this.systemSettingsDataService
          .getAPIVersion(apiURL)
          .pipe(
            catchError((err) => {
              subscriber.next(false);
              subscriber.complete();
              return throwError(err);
            })
          )
          .subscribe((versionData: any) => {
            if (_.get(versionData, 'version')) {
              subscriber.next(true);
              subscriber.complete();
            } else {
              subscriber.next(false);
              subscriber.complete();
            }
          });
      }
    });

    // display export dialog
    this.dialogV2Service.showExportData({
      title: {
        get: () => 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_TITLE'
      },
      export: {
        url: 'system-settings/generate-file',
        async: false,
        method: ExportDataMethod.POST,
        fileName: this.i18nService.instant('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_FILE_NAME') +
          ' - ' +
          moment().format('YYYY-MM-DD'),
        // TODO: Next properties are missing in new design
        // fileExtension: 'png'
        // urlAsyncErrorMsg: 'LNG_FORM_VALIDATION_ERROR_FIELD_URL',
        allow: {
          types: [
            ExportDataExtension.QR
          ]
        },
        extraFormData: {
          append: {
            clientId: clientApplication.credentials.clientId,
            clientSecret: clientApplication.credentials.clientSecret
          }
        },
        inputs: {
          append: [
            {
              type: V2SideDialogConfigInputType.TEXT,
              placeholder: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE_DIALOG_URL_LABEL',
              name: 'data[url]',
              value: apiUrl,
              validators: {
                required: () => true,
                async: (data): Observable<boolean> => {
                  apiURL = (data.map['data[url]'] as IV2SideDialogConfigInputText).value;
                  return apiObserver;
                }
              }
            }
          ]
        }
      }
    });
  }
}
