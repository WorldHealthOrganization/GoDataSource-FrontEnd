import { Component, OnDestroy, Renderer2 } from '@angular/core';
import { CreateViewModifyComponent } from '../../../../core/helperClasses/create-view-modify-component';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { Observable, throwError } from 'rxjs';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { OutbreakTemplateModel } from '../../../../core/models/outbreak-template.model';
import {
  CreateViewModifyV2ActionType,
  CreateViewModifyV2MenuType,
  CreateViewModifyV2TabInputType, ICreateViewModifyV2Buttons, ICreateViewModifyV2CreateOrUpdate,
  ICreateViewModifyV2Tab
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/tab.model';
import { catchError, takeUntil } from 'rxjs/operators';
import {
  CreateViewModifyV2ExpandColumnType
} from '../../../../shared/components-v2/app-create-view-modify-v2/models/expand-column.model';
import { RequestFilterGenerator } from '../../../../core/helperClasses/request-query-builder';
import { MAT_ICONS } from '../../../../shared/forms-v2/core/mat-icons-v2';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { UserModel } from '../../../../core/models/user.model';
import { CreateViewModifyHelperService } from '../../../../core/services/helper/create-view-modify-helper.service';
import { OutbreakAndOutbreakTemplateHelperService } from '../../../../core/services/helper/outbreak-and-outbreak-template-helper.service';

/**
 * Component
 */
@Component({
  selector: 'app-cluster-create-view-modify',
  templateUrl: './cluster-create-view-modify.component.html'
})
export class ClusterCreateViewModifyComponent extends CreateViewModifyComponent<ClusterModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected authDataService: AuthDataService,
    protected activatedRoute: ActivatedRoute,
    protected renderer2: Renderer2,
    protected createViewModifyHelperService: CreateViewModifyHelperService,
    protected outbreakAndOutbreakTemplateHelperService: OutbreakAndOutbreakTemplateHelperService,
    private router: Router,
    private clusterDataService: ClusterDataService,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      authDataService,
      activatedRoute,
      renderer2,
      createViewModifyHelperService,
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
  protected createNewItem(): ClusterModel {
    return new ClusterModel();
  }

  /**
   * Retrieve item
   */
  protected retrieveItem(record?: ClusterModel): Observable<ClusterModel> {
    return this.clusterDataService.getCluster(
      this.selectedOutbreak.id,
      record ? record.id : this.activatedRoute.snapshot.params.clusterId
    );
  }

  /**
   * Data initialized
   */
  protected initializedData(): void { }

  /**
   * Initialize page title
   */
  protected initializePageTitle(): void {
    // add info accordingly to page type
    if (this.isCreate) {
      this.pageTitle = 'LNG_PAGE_CREATE_CLUSTER_TITLE';
      this.pageTitleData = undefined;
    } else if (this.isModify) {
      this.pageTitle = 'LNG_PAGE_MODIFY_CLUSTER_TITLE';
      this.pageTitleData = {
        name: this.itemData.name
      };
    } else {
      // view
      this.pageTitle = 'LNG_PAGE_VIEW_CLUSTER_TITLE';
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

    // case list page
    if (ClusterModel.canList(this.authUser)) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_LIST_CLUSTERS_TITLE',
        action: {
          link: ['/clusters']
        }
      });
    }

    // add info accordingly to page type
    if (this.isCreate) {
      this.breadcrumbs.push({
        label: 'LNG_PAGE_CREATE_CLUSTER_TITLE',
        action: null
      });
    } else if (this.isModify) {
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_MODIFY_CLUSTER_TITLE', {
            name: this.itemData.name
          }
        ),
        action: null
      });
    } else {
      // view
      this.breadcrumbs.push({
        label: this.createViewModifyHelperService.i18nService.instant(
          'LNG_PAGE_VIEW_CLUSTER_TITLE', {
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
        // Details
        this.initializeTabsDetails()
      ],

      // create details
      create: {
        finalStep: {
          buttonLabel: this.createViewModifyHelperService.i18nService.instant('LNG_PAGE_CREATE_CLUSTER_ACTION_CREATE_CLUSTER_BUTTON'),
          message: () => this.createViewModifyHelperService.i18nService.instant(
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
        data: OutbreakTemplateModel,
        extraQueryParams: Params
      ) => {
        // redirect to view
        this.router.navigate(
          [
            '/clusters',
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
    return {
      type: CreateViewModifyV2TabInputType.TAB,
      name: 'details',
      label: this.isCreate ?
        'LNG_PAGE_CREATE_CLUSTER_TAB_DETAILS_TITLE' :
        'LNG_PAGE_MODIFY_CLUSTER_TAB_DETAILS_TITLE',
      sections: [
        // Details
        {
          type: CreateViewModifyV2TabInputType.SECTION,
          label: this.isCreate ?
            'LNG_PAGE_CREATE_CLUSTER_TAB_DETAILS_TITLE' :
            'LNG_PAGE_MODIFY_CLUSTER_TAB_DETAILS_TITLE',
          inputs: [
            {
              type: CreateViewModifyV2TabInputType.TEXT,
              name: 'name',
              placeholder: () => 'LNG_CLUSTER_FIELD_LABEL_NAME',
              description: () => 'LNG_CLUSTER_FIELD_LABEL_NAME_DESCRIPTION',
              value: {
                get: () => this.itemData.name,
                set: (value) => {
                  this.itemData.name = value;
                }
              },
              validators: {
                required: () => true
              }
            },
            {
              type: CreateViewModifyV2TabInputType.COLOR,
              name: 'colorCode',
              placeholder: () => 'LNG_CLUSTER_FIELD_LABEL_COLOR',
              description: () => 'LNG_CLUSTER_FIELD_LABEL_COLOR_DESCRIPTION',
              value: {
                get: () => this.itemData.colorCode,
                set: (value) => {
                  this.itemData.colorCode = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.SELECT_SINGLE,
              name: 'icon',
              placeholder: () => 'LNG_CLUSTER_FIELD_LABEL_ICON',
              description: () => 'LNG_CLUSTER_FIELD_LABEL_ICON_DESCRIPTION',
              options: MAT_ICONS.map((icon) => ({
                label: icon,
                value: icon,
                icon
              })),
              value: {
                get: () => this.itemData.icon,
                set: (value) => {
                  this.itemData.icon = value;
                }
              }
            },
            {
              type: CreateViewModifyV2TabInputType.TEXTAREA,
              name: 'description',
              placeholder: () => 'LNG_CLUSTER_FIELD_LABEL_DESCRIPTION',
              description: () => 'LNG_CLUSTER_FIELD_LABEL_DESCRIPTION_DESCRIPTION',
              value: {
                get: () => this.itemData.description,
                set: (value) => {
                  this.itemData.description = value;
                }
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
      view: {
        link: {
          link: () => ['/clusters', this.itemData?.id, 'view']
        }
      },
      modify: {
        link: {
          link: () => ['/clusters', this.itemData?.id, 'modify']
        },
        visible: () => ClusterModel.canModify(this.authUser)
      },
      createCancel: {
        link: {
          link: () => ['/clusters']
        }
      },
      viewCancel: {
        link: {
          link: () => ['/clusters']
        }
      },
      modifyCancel: {
        link: {
          link: () => ['/clusters']
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
                  'LNG_COMMON_LABEL_DETAILS',
                  this.itemData,
                  this.activatedRoute.snapshot.data.user
                );
              }
            }
          },

          // Divider
          {
            type: CreateViewModifyV2MenuType.DIVIDER
          },

          // View People
          {
            type: CreateViewModifyV2MenuType.OPTION,
            label: 'LNG_PAGE_MODIFY_CLUSTER_ACTION_VIEW_PEOPLE',
            action: {
              link: () => ['/clusters', this.itemData.id, 'people']
            },
            visible: () => this.selectedOutbreakIsActive && ClusterModel.canListPeople(this.authUser) && ClusterModel.canModify(this.authUser)
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
      finished
    ) => {
      // finished
      (type === CreateViewModifyV2ActionType.CREATE ?
        this.clusterDataService.createCluster(
          this.selectedOutbreak.id,
          data
        ) :
        this.clusterDataService.modifyCluster(
          this.selectedOutbreak.id,
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
      ).subscribe((item: ClusterModel) => {
        // success creating / updating cluster
        this.createViewModifyHelperService.toastV2Service.success(
          type === CreateViewModifyV2ActionType.CREATE ?
            'LNG_PAGE_CREATE_CLUSTER_ACTION_CREATE_CLUSTER_SUCCESS_MESSAGE' :
            'LNG_PAGE_MODIFY_CLUSTER_ACTION_MODIFY_CLUSTER_SUCCESS_MESSAGE'
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
      link: (item: ClusterModel) => ['/clusters', item.id, 'view'],
      get: {
        text: (item: ClusterModel) => item.name
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
  protected initializeExpandListAdvancedFilters(): void {
    this.expandListAdvancedFilters = ClusterModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      }
    });
  }

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
    this.expandListRecords$ = this.clusterDataService
      .getClusterList(this.selectedOutbreak.id, data.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }
}
