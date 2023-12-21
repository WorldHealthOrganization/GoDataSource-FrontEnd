import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import {
  CreateViewModifyV2ActionType, CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType,
  ICreateViewModifyV2Buttons,
  ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { SystemClientApplicationModel } from '../../../../core/models/system-client-application.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { Constants } from '../../../../core/models/constants';
import { catchError, takeUntil } from 'rxjs/operators';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ClientApplicationDataService } from '../../../../core/services/data/client-application.data.service';
import { CreateViewModifyV2ExpandColumnType } from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ClientApplicationHelperService } from '../../../../core/services/helper/client-application-helper.service';

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
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected redirectService: RedirectService,
    protected toastV2Service: ToastV2Service,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    private i18nService: I18nService,
    private clientApplicationDataService: ClientApplicationDataService,
    private router: Router,
    private dialogV2Service: DialogV2Service,
    private clientApplicationHelperService: ClientApplicationHelperService
  ) {
    // parent
    super(
      authDataService,
      activatedRoute,
      renderer2,
      redirectService,
      toastV2Service,
      outbreakAndOutbreakTemplateHelperService
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
  protected retrieveItem(record?: SystemClientApplicationModel): Observable<SystemClientApplicationModel> {
    return this.clientApplicationDataService
      .getClientApplication(
        record ?
          record.id :
          this.activatedRoute.snapshot.params.clientApplicationId
      );
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
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_SYSTEM_CLIENT_APPLICATION_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_SYSTEM_CLIENT_APPLICATION_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    }
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
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_MODIFY_SYSTEM_CLIENT_APPLICATION_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.i18nService.instant(
          'LNG_PAGE_VIEW_SYSTEM_CLIENT_APPLICATION_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    }
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
      redirectAfterCreateUpdate: (
        data: SystemClientApplicationModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/system-config/client-applications',
            data.id,
            'view'
          ], {
            queryParams: extraQueryParams
          }
        );
      }
    };
  }

  /**
   * Initialize tabs - Details
   */
  private initializeTabsDetails(): ICreateViewModifyV2Tab {
    // create tab
    const tab: ICreateViewModifyV2Tab = {
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

                  // mark as dirty
                  tab.form?.controls['credentials[clientSecret]']?.markAsDirty();
                }
              },
              validators: {
                required: () => true
              },
              suffixIconButtons: [{
                icon: 'shuffle',
                tooltip: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_GENERATE_KEY_BUTTON',
                clickAction: (input) => {
                  // generate string
                  this.itemData.credentials.clientId = Constants.randomString(Constants.DEFAULT_RANDOM_KEY_LENGTH);

                  // mark as dirty
                  input.control?.markAsDirty();
                  tab.form?.controls['credentials[clientSecret]']?.markAsDirty();
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

                  // mark as dirty
                  tab.form?.controls['credentials[clientId]']?.markAsDirty();
                }
              },
              validators: {
                required: () => true
              },
              suffixIconButtons: [{
                icon: 'shuffle',
                tooltip: 'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_GENERATE_KEY_BUTTON',
                clickAction: (input) => {
                  // generate string
                  this.itemData.credentials.clientSecret = Constants.randomString(Constants.DEFAULT_RANDOM_KEY_LENGTH);

                  // mark as dirty
                  input.control?.markAsDirty();
                  tab.form?.controls['credentials[clientId]']?.markAsDirty();
                }
              }]
            }
          ]
        }
      ]
    };

    // finished
    return tab;
  }

  /**
   * Initialize buttons
   */
  private initializeButtons(): ICreateViewModifyV2Buttons {
    return {
      view: {
        link: {
          link: () => ['/system-config/client-applications', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/system-config/client-applications', this.itemData?.id, 'modify']
        },
        visible: () => SystemClientApplicationModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/system-config/client-applications']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/system-config/client-applications']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/system-config/client-applications']
        }
      },
      quickActions: {
        options: [
          // Record details
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_COMMON_LABEL_DETAILS',
            action: {
              click: () => {
                // show record details dialog
                this.dialogV2Service.showRecordDetailsDialog(
                  this.authUser,
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user,
                  this.activatedRoute.snapshot.data.deletedUser
                );
              }
            }
          },

          // Download client application config file
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_SYSTEM_CLIENT_APPLICATIONS_ACTION_DOWNLOAD_CONF_FILE',
            action: {
              click: () => {
                this.clientApplicationHelperService.downloadConfFile(this.itemData);
              }
            },
            visible: () => !this.isCreate &&
              this.itemData?.active &&
              SystemClientApplicationModel.canDownloadConfFile(this.authUser)
          }
        ]
      }
    };
  }

  /**
   * Initialize process data
   */
  private initializeProcessData(): ICreateViewModifyV2CreateOrUpdate {
    return (
      type,
      data,
      finished,
      _loading,
      _forms
    ) => {
      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.clientApplicationDataService.createClientApplication(
          data
        ) :
        this.clientApplicationDataService.modifyClientApplication(
          this.itemData.id,
          data
        )
      ).pipe(
        // handle error
        catchError((err) => {
          // show error
          finished(err, undefined);

          // finished
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      ).subscribe((item: SystemClientApplicationModel) => {
        // success creating / updating
        this.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_SYSTEM_CLIENT_APPLICATION_ACTION_CREATE_CLIENT_APPLICATION_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_SYSTEM_CLIENT_APPLICATION_ACTION_MODIFY_CLIENT_APPLICATION_SUCCESS_MESSAGE'
        );

        // finished with success
        finished(undefined, item);
      });
    };
  }

  /**
   * Initialize expand list column renderer fields
   */
  protected initializeExpandListColumnRenderer(): void {
    this.expandListColumnRenderer = {
      type: CreateViewModifyV2ExpandColumnType.TEXT,
      link: (item: SystemClientApplicationModel) => ['/system-config/client-applications', item.id, 'view'],
      get: {
        text: (item: SystemClientApplicationModel) => item.name
      }
    };
  }

  /**
   * Initialize expand list query fields
   */
  protected initializeExpandListQueryFields(): void {
    this.expandListQueryFields = [
      'id',
      'name'
    ];
  }

  /**
   * Initialize expand list advanced filters
   */
  protected initializeExpandListAdvancedFilters(): void {}

  /**
   * Refresh expand list
   */
  refreshExpandList(data): void {
    // append / remove search
    if (data.searchBy) {
      data.queryBuilder.filter.where({
        name: RequestFilterGenerator.textContains(
          data.searchBy
        )
      });
    }

    // retrieve data
    this.expandListRecords$ = this.clientApplicationDataService
      .getClientApplicationsList(data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
