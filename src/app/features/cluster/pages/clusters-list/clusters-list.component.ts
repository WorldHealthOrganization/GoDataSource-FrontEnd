import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2Column, IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { UserModel } from '../../../../core/models/user.model';
import { ActivatedRoute } from '@angular/router';
import { ILabelValuePairModel } from '../../../../shared/forms-v2/core/label-value-pair.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-clusters-list',
  templateUrl: './clusters-list.component.html'
})
export class ClustersListComponent extends ListComponent<ClusterModel, IV2Column> implements OnDestroy {
  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
   * Component destroyed
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
  * Selected outbreak was changed
  */
  selectedOutbreakChanged(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
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
        // View Cluster
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_CLUSTER',
          action: {
            link: (item: OutbreakModel): string[] => {
              return ['/clusters', item.id, 'view'];
            }
          },
          visible: (): boolean => {
            return ClusterModel.canView(this.authUser);
          }
        },

        // Modify Cluster
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_MODIFY_CLUSTER',
          action: {
            link: (item: OutbreakModel): string[] => {
              return ['/clusters', item.id, 'modify'];
            }
          },
          visible: (): boolean => {
            return this.selectedOutbreakIsActive &&
              ClusterModel.canModify(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete Cluster
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_CLUSTER'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: OutbreakModel): void => {
                  // show confirm dialog
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: item.name
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_CLUSTER',
                        data: () => ({
                          name: item.name
                        })
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

                    // delete cluster
                    this.clusterDataService
                      .deleteCluster(this.selectedOutbreak.id, item.id)
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
                        this.toastV2Service.success('LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (): boolean => {
                return this.selectedOutbreakIsActive &&
                  ClusterModel.canDelete(this.authUser);
              }
            },

            // Divider
            {
              visible: (): boolean => {
                // visible only if at least one of the previous...
                return this.selectedOutbreakIsActive &&
                  ClusterModel.canDelete(this.authUser);
              }
            },

            // View People
            {
              label: {
                get: () => 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_PEOPLE'
              },
              action: {
                link: (item: OutbreakModel): string[] => {
                  return ['/clusters', item.id, 'people'];
                }
              },
              visible: (): boolean => {
                return ClusterModel.canListPeople(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_CLUSTER_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'description',
        label: 'LNG_CLUSTER_FIELD_LABEL_DESCRIPTION',
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'icon',
        label: 'LNG_CLUSTER_FIELD_LABEL_ICON',
        noIconLabel: 'LNG_PAGE_LIST_CLUSTERS_LABEL_NO_ICON',
        format: {
          type: V2ColumnFormat.ICON_MATERIAL
        }
      },
      {
        field: 'colorCode',
        label: 'LNG_CLUSTER_FIELD_LABEL_COLOR',
        noColorLabel: 'LNG_PAGE_LIST_CLUSTERS_LABEL_NO_COLOR',
        format: {
          type: V2ColumnFormat.COLOR
        },
        sortable: true,
        filter: {
          type: V2FilterType.TEXT,
          textType: V2FilterTextType.STARTS_WITH
        }
      },
      {
        field: 'createdOn',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_ON',
        notVisible: true,
        format: {
          type: (item) => item.createdOn ?
            this.i18nService.instant(`LNG_PLATFORM_LABEL_${item.createdOn}`) :
            item.createdOn
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
          includeNoValue: true
        },
        sortable: true
      },
      {
        field: 'createdBy',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: 'createdByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.createdBy && UserModel.canView(this.authUser) && !data.createdByUser?.deleted ?
            `/users/${data.createdBy}/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_CLUSTER_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
      },
      {
        field: 'updatedBy',
        label: 'LNG_CLUSTER_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: 'updatedByUser.nameAndEmail'
        },
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options,
          includeNoValue: true
        },
        link: (data) => {
          return data.updatedBy && UserModel.canView(this.authUser) && !data.updatedByUser?.deleted ?
            `/users/${data.updatedBy}/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_CLUSTER_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        },
        filter: {
          type: V2FilterType.DATE_RANGE
        },
        sortable: true
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
  protected initializeTableAdvancedFilters(): void {
    // Cluster
    this.advancedFilters = ClusterModel.generateAdvancedFilters({
      authUser: this.authUser,
      options: {
        createdOn: (this.activatedRoute.snapshot.data.createdOn as IResolverV2ResponseModel<ILabelValuePairModel>).options,
        user: (this.activatedRoute.snapshot.data.user as IResolverV2ResponseModel<UserModel>).options
      }
    });
  }

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
        link: (): string[] => ['/clusters', 'create']
      },
      visible: (): boolean => {
        return ClusterModel.canCreate(this.authUser) &&
          this.selectedOutbreakIsActive;
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
        label: 'LNG_PAGE_LIST_CLUSTERS_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'colorCode',
      'icon',
      'createdOn',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Clusters list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve the list of clusters
    this.records$ = this.clusterDataService
      .getClusterList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    if (this.selectedOutbreak) {
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
      this.clusterDataService
        .getClustersCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),

          // should be the last pipe
          takeUntil(this.destroyed$)
        ).subscribe((response) => {
          this.pageCount = response;
        });
    }
  }
}
