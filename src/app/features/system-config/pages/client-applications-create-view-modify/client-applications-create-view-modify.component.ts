import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import {
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { SystemSettingsDataService } from '../../../../core/services/data/system-settings.data.service';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { catchError } from 'rxjs/operators';
import { SystemSettingsModel } from '../../../../core/models/system-settings.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

/**
 * Component
 */
@Component({
  selector: 'app-client-applications-create-view-modify',
  templateUrl: './client-applications-create-view-modify.component.html'
})
export class ClientApplicationsCreateViewModifyComponent extends CreateViewModifyComponent<SystemClientApplicationModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected systemSettingsDataService: SystemSettingsDataService,
    protected activatedRoute: ActivatedRoute,
    protected toastV2Service: ToastV2Service,
    protected i18nService: I18nService,
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
  protected createNewItem(): SystemClientApplicationModel {
    return new SystemClientApplicationModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(): Observable<SystemClientApplicationModel> {
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
    this.pageTitle = 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TITLE';
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
    if (SystemClientApplicationModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_SYSTEM_CLIENT_APPLICATIONS_TITLE',
        action: {
          link: ['/system-config/client-applications']
        }
      });
    }

    // add info accordingly to page type
    this.breadcrumbs.push({
      label: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TITLE',
      action: null
    });
  }

  /**
   * Initialize breadcrumb infos
   */
  protected initializeBreadcrumbInfos(): void {}

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
          buttonLabel: this.i18nService.instant('LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_ACTION_CREATE_UPSTREAM_SERVER_BUTTON'),
          message: () => this.i18nService.instant(
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
          '/system-config/client-applications'
        ]);
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME',
              description: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_NAME_DESCRIPTION',
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
              type: CreateViewModifyV2TabInputType.TOGGLE_CHECKBOX,
              name: 'active',
              placeholder: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ACTIVE',
              description: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ACTIVE_DESCRIPTION',
              value: {
                get: () => this.itemData.active,
                set: (value) => {
                  // set data
                  this.itemData.active = value;
                }
              }
            }, {
              type: CreateViewModifyV2TabInputType.SELECT_MULTIPLE,
              name: 'outbreakIDs',
              placeholder: () => this.itemData.outbreakIDs?.length > 0 ? 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS' : 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_ALL_OUTBREAKS',
              description: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_OUTBREAKS_DESCRIPTION',
              value: {
                get: () => this.itemData.outbreakIDs,
                set: (value) => {
                  // set data
                  this.itemData.outbreakIDs = value;
                }
              },
              options: (this.activatedRoute.snapshot.data.outbreak as IResolverV2ResponseModel<ReferenceDataEntryModel>).options
            }, {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'credentials[clientId]',
              placeholder: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CLIENT_ID',
              description: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CLIENT_ID_DESCRIPTION',
              value: {
                get: () => this.itemData.credentials.clientId,
                set: (value) => {
                  // set data
                  this.itemData.credentials.clientId = value;
                }
              },
              validators: {
                required: () => true
              },
              suffixIconButtons: [{
                icon: 'shuffle',
                tooltip: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_GENERATE_KEY_BUTTON',
                clickAction: () => {
                  // generate string
                  this.itemData.credentials.clientId = Constants.randomString(Constants.DEFAULT_RANDOM_KEY_LENGTH);
                }
              }]
            }, {
              type: CreateViewModifyV2TabInputType.PASSWORD,
              name: 'credentials[clientSecret]',
              placeholder: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CLIENT_SECRET',
              description: () => 'LNG_SYSTEM_CLIENT_APPLICATION_FIELD_LABEL_CLIENT_SECRET_DESCRIPTION',
              value: {
                get: () => this.itemData.credentials.clientSecret,
                set: (value) => {
                  // set data
                  this.itemData.credentials.clientSecret = value;
                }
              },
              validators: {
                required: () => true
              },
              suffixIconButtons: [{
                icon: 'shuffle',
                tooltip: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_GENERATE_KEY_BUTTON',
                clickAction: () => {
                  // generate string
                  this.itemData.credentials.clientSecret = Constants.randomString(Constants.DEFAULT_RANDOM_KEY_LENGTH);
                }
              }]
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
          link: () => ['/system-config/client-applications']
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
          settings.clientApplications = settings.clientApplications || [];
          settings.clientApplications.push(data);

          // save upstream servers
          this.systemSettingsDataService
            .modifySystemSettings({
              clientApplications: settings.clientApplications
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
              this.toastV2Service.success('LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_ACTION_CREATE_CLIENT_APPLICATION_SUCCESS_MESSAGE');

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
