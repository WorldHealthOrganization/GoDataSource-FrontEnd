import { Component, OnDestroy, OnInit } from '@angular/core';
import { UserSettings } from '../../../../core/models/user.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import * as _ from 'lodash';
import { DialogAnswer, DialogAnswerButton, DialogField, DialogFieldType, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService, ExportDataExtension } from '../../../../core/services/helper/dialog.service';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable, Subscriber } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { environment } from '../../../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { throwError, of, forkJoin } from 'rxjs';
import { HoverRowActionsDirective } from '../../../../shared/directives/hover-row-actions/hover-row-actions.directive';
import { moment } from '../../../../core/helperClasses/x-moment';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-client-applications-list',
  templateUrl: './client-applications-list.component.html'
})
export class ClientApplicationsListComponent
  extends ListComponent
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE', '.', true)
  // ];

  // client applications servers
  clientApplicationsServerList: SystemClientApplicationModel[] = [];
  clientApplicationsServerListCount: IBasicCount;
  clientApplicationsServerListAll: SystemClientApplicationModel[];

  // settings
  settings: SystemSettingsModel;

  // constants
  UserSettings = UserSettings;
  SystemClientApplicationModel = SystemClientApplicationModel;

  recordActions: HoverRowAction[] = [
    // Download Client Application Conf File
    new HoverRowAction({
      icon: 'fileCopy',
      iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE',
      click: (item: SystemClientApplicationModel) => {
        this.downloadConfFile(item);
      },
      visible: (item: SystemClientApplicationModel): boolean => {
        return SystemClientApplicationModel.canDownloadConfFile(this.authUser) && item.active;
      }
    }),

    // Disable Client Application
    new HoverRowAction({
      icon: 'visibilityOf',
      iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DISABLE',
      click: (item: SystemClientApplicationModel, handler: HoverRowActionsDirective) => {
        this.toggleActiveFlag(
          item,
          false,
          () => {
            handler.redraw();
          }
        );
      },
      visible: (item: SystemClientApplicationModel): boolean => {
        return item.active &&
                    SystemClientApplicationModel.canDisable(this.authUser);
      }
    }),

    // Enable Client Application
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_ENABLE',
      click: (item: SystemClientApplicationModel, handler: HoverRowActionsDirective) => {
        this.toggleActiveFlag(
          item,
          true,
          () => {
            handler.redraw();
          }
        );
      },
      visible: (item: SystemClientApplicationModel): boolean => {
        return !item.active &&
                    SystemClientApplicationModel.canEnable(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Client Application
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DELETE',
          click: (item: SystemClientApplicationModel) => {
            this.deleteClientApplication(item);
          },
          visible: (): boolean => {
            return SystemClientApplicationModel.canDelete(this.authUser);
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
    private systemSettingsDataService: SystemSettingsDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private outbreakDataService: OutbreakDataService,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // initialize Side Table Columns
    this.initializeTableColumns();

    // initialize pagination
    this.initPaginator();

    // retrieve backups
    this.needsRefreshList(true);
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
    //     field: 'name',
    //     label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'credentials',
    //     label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CREDENTIALS'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'active',
    //     label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ACTIVE'
    //   })
    // ];
    //
    // // outbreaks
    // if (OutbreakModel.canList(this.authUser)) {
    //   this.tableColumns.push(
    //     new VisibleColumnModel({
    //       field: 'outbreaks',
    //       label: 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS'
    //     })
    //   );
    // }
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
    this.clientApplicationsServerList = [];
    this.clientApplicationsServerListAll = undefined;
    this.refreshListCount();

    const outbreaksList$: Observable<OutbreakModel[]> = OutbreakModel.canList(this.authUser) ?
      this.outbreakDataService.getOutbreaksListReduced() :
      of([]);

    forkJoin([
      outbreaksList$,
      this.systemSettingsDataService.getSystemSettings()
    ])
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          finishCallback([]);
          return throwError(err);
        })
      )
      .subscribe(([outbreaksList, systemSettings]: [OutbreakModel[], SystemSettingsModel]) => {
        // map outbreaks
        const mappedOutbreaks = _.groupBy(outbreaksList, 'id');

        // get settings
        this.settings = systemSettings;
        let clientApplications = _.get(this.settings, 'clientApplications');
        clientApplications = clientApplications ? clientApplications : [];
        this.clientApplicationsServerListAll = _.map(
          clientApplications,
          (item: SystemClientApplicationModel) => {
            // set outbreak
            item.outbreaks = _.transform(
              item.outbreakIDs,
              (result, outbreakID: string) => {
                // outbreak not deleted ?
                if (!_.isEmpty(mappedOutbreaks[outbreakID])) {
                  result.push(mappedOutbreaks[outbreakID][0]);
                }
              },
              []
            );

            // finished
            return item;
          });

        // display only items from this page
        if (this.queryBuilder.paginator) {
          this.clientApplicationsServerList = this.clientApplicationsServerListAll.slice(
            this.queryBuilder.paginator.skip,
            this.queryBuilder.paginator.skip + this.queryBuilder.paginator.limit
          );
        }

        // refresh the total count
        this.refreshListCount();

        // finished
        finishCallback(this.clientApplicationsServerList);
      });
  }

  /**
     * Get total number of items
     */
  refreshListCount() {
    this.clientApplicationsServerListCount = {
      count: this.clientApplicationsServerListAll !== undefined ?
        this.clientApplicationsServerListAll.length :
        null
    };
  }

  /**
     * Delete record
     * @param item
     */
  deleteClientApplication(clientApplication: SystemClientApplicationModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CLIENT_APPLICATION', clientApplication)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.systemSettingsDataService
            .getSystemSettings()
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe((settings: SystemSettingsModel) => {
              // filter client applications and remove client application
              const filteredClientApplications = settings.clientApplications.filter((clientApp: SystemClientApplicationModel) => {
                return clientApp.id !== clientApplication.id;
              });

              // save upstream servers
              this.systemSettingsDataService
                .modifySystemSettings({
                  clientApplications: filteredClientApplications
                })
                .pipe(
                  catchError((err) => {
                    this.toastV2Service.error(err);
                    return throwError(err);
                  })
                )
                .subscribe(() => {
                  // display success message
                  this.toastV2Service.success('LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_ACTION_DELETE_SUCCESS_MESSAGE');

                  // refresh
                  this.needsRefreshList(true);
                });
            });
        }
      });
  }

  /**
     * Toggle active flag
     */
  toggleActiveFlag(
    clientApplication: SystemClientApplicationModel,
    newValue: boolean,
    finishCallback: () => void
  ) {
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
              finishCallback();
            });
        } else {
          // no client application found - must refresh page
          this.needsRefreshList(true);
        }
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
      fileExtension: 'png',
      exportStart: () => {
        this.showLoadingDialog();
      },
      exportFinished: () => {
        this.closeLoadingDialog();
      }
    });
  }
}
