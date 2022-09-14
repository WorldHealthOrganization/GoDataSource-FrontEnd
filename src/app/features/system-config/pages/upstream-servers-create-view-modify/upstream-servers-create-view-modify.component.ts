import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { TranslateService } from '@ngx-translate/core';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { SystemUpstreamServerModel } from '../../../../core/models/system-upstream-server.model';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { catchError } from 'rxjs/operators';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';

/**
 * Component
 */
@Component({
  selector: 'app-upstream-servers-create-view-modify',
  templateUrl: './upstream-servers-create-view-modify.component.html'
})
export class UpstreamServersCreateViewModifyComponent extends CreateViewModifyComponent<SystemUpstreamServerModel> implements OnDestroy {
  // upstream servers map
  private _upstreamServersMap: {
    [url: string]: true
  } = {};

  /**
   * Constructor
   */
  constructor(
    protected systemSettingsDataService: SystemSettingsDataService,
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected translateService: TranslateService,
    protected router: Router,
    authDataService: AuthDataService,
    renderer2: Renderer2,
    redirectService: RedirectService
  ) {
    // parent
    super(
      toastV2Service,
      renderer2,
      redirectService,
      activatedRoute,
      authDataService
    );

    // map upstream servers
    const upstreamServers: SystemUpstreamServerModel[] = activatedRoute.snapshot.data.upstreamServers;
    upstreamServers.forEach((upstreamServer) => {
      this._upstreamServersMap[upstreamServer.url.toLowerCase()] = true;
    });
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();
  }

  /**
   * Create new item model if needed
   */
  protected createNewItem(): SystemUpstreamServerModel {
    return new SystemUpstreamServerModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<SystemUpstreamServerModel> {
    return null;
  }

  /**
   * Data initialized
   */
  protected initializedData(): void {}

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    this.pageTitle = 'LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TITLE';
    this.pageTitleData = undefined;
  }

  /**
   * Initialize breadcrumbs
   */
  protected initializeBreadcrumbs() {
    // reset breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }
    ];

    // list page
    if (SystemUpstreamServerModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_SYSTEM_UPSTREAM_SERVERS_TITLE',
        action: {
          link: ['/system-config/upstream-servers']
        }
      });
    }

    // add info accordingly to page type
    this.breadcrumbs.push({
      label: 'LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TITLE',
      action: null
    });
  }

  /**
   * Initialize tabs
   */
  protected initializeTabs(): void {
    this.tabData = {
      // tabs
      tabs: [
        // Personal
        this.initializeTabsDetails()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.translateService.instant('LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_ACTION_CREATE_UPSTREAM_SERVER_BUTTON'),
          message: () => this.translateService.instant(
            'LNG_STEPPER_FINAL_STEP_TEXT_GENERAL',
            this.itemData
          )
        }
      },

      // buttons
      buttons: this.initializeButtons(),

      // create or update
      createOrUpdate: this.initializeProcessData(),
      redirectAfterCreateUpdate: () => {
        // redirect to list
        this.router.navigate([
          '/system-config/upstream-servers'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Personal
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_NAME',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  // set data
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'timeout',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_TIMEOUT',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_TIMEOUT_DESCRIPTION',
              value: {
                get: () => this.itemData.timeout,
                set: (value) => {
                  // set data
                  this.itemData.timeout = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'url',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_URL',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_URL_DESCRIPTION',
              value: {
                get: () => this.itemData.url,
                set: (value) => {
                  // set data
                  this.itemData.url = value;
                }
              },
              validators: {
                required: () => true,
                notInObject: () => ({
                  values: this._upstreamServersMap,
                  err: 'LNG_FORM_VALIDATION_ERROR_DUPLICATE_VALUE'
                })
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'syncEnabled',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ENABLED',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ENABLED_DESCRIPTION',
              value: {
                get: () => this.itemData.syncEnabled,
                set: (value) => {
                  // set data
                  this.itemData.syncEnabled = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.NUMBER,
              name: 'syncInterval',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_INTERVAL',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_INTERVAL_DESCRIPTION',
              value: {
                get: () => this.itemData.syncInterval,
                set: (value) => {
                  // set data
                  this.itemData.syncInterval = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'syncOnEveryChange',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ON_EVERY_CHANGE',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_SYNC_ON_EVERY_CHANGE_DESCRIPTION',
              value: {
                get: () => this.itemData.syncOnEveryChange,
                set: (value) => {
                  // set data
                  this.itemData.syncOnEveryChange = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'credentials[clientId]',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS_CLIENT_ID',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS_CLIENT_ID_DESCRIPTION',
              value: {
                get: () => this.itemData.credentials.clientId,
                set: (value) => {
                  // set data
                  this.itemData.credentials.clientId = value;
                }
              },
              validators: {
                required: () => true
              }
            }, {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'credentials[clientSecret]',
              placeholder: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS_CLIENT_SECRET',
              description: () => 'LNG_UPSTREAM_SERVER_FIELD_LABEL_CREDENTIALS_CLIENT_SECRET_DESCRIPTION',
              value: {
                get: () => this.itemData.credentials.clientSecret,
                set: (value) => {
                  // set data
                  this.itemData.credentials.clientSecret = value;
                }
              },
              validators: {
                required: () => true
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: undefined,
      modify: undefined,
      createCancel: {
        link: {
          link: () => ['/system-config/upstream-servers']
        }
      },
      viewCancel: undefined,
      modifyCancel: undefined,
      quickActions: undefined
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      _type,
      data,
      finished,
      _loading,
      _forms
    ) => {
      // always create
      this.systemSettingsDataService
        .getSystemSettings()
        .pipe(
          catchError((err) => {
            // show error
            finished(err, undefined);

            // finished
            return throwError(err);
          })
        )
        .subscribe((settings: SystemSettingsModel) => {
          // add the new upstream server
          settings.upstreamServers = settings.upstreamServers || [];
          settings.upstreamServers.push(data);

          // save upstream servers
          this.systemSettingsDataService
            .modifySystemSettings({
              upstreamServers: settings.upstreamServers
            })
            .pipe(
              catchError((err) => {
                // show error
                finished(err, undefined);

                // finished
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.toastV2Service.success('LNG_PAGE_CREATE_SYSTEM_UPSTREAM_SERVER_ACTION_CREATE_UPSTREAM_SERVER_SUCCESS_MESSAGE');

              // hide loading & redirect
              finished(undefined, settings);
            });
        });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {}

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {}

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(_data): void {}
}
