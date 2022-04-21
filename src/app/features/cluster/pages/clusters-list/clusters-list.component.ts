import { Component, OnDestroy, ViewEncapsulation } from '@angular/core';
import * as _ from 'lodash';
import { Observable, throwError } from 'rxjs';
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
import { V2AdvancedFilterType } from '../../../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { V2FilterTextType, V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';

@Component({
  selector: 'app-clusters-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './clusters-list.component.html',
  styleUrls: ['./clusters-list.component.less']
})
export class ClustersListComponent extends ListComponent implements OnDestroy {
  // list of existing clusters
  clustersList$: Observable<ClusterModel[]>;

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private dialogV2Service: DialogV2Service
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
              return this.authUser &&
                this.selectedOutbreak &&
                this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
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
                label: 'LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_CLUSTER',
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
                  return this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ClusterModel.canDelete(this.authUser);
                }
              },

              // Divider
              {
                visible: (): boolean => {
                  // visible only if at least one of the previous...
                  return this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ClusterModel.canDelete(this.authUser);
                }
              },

              // View People
              {
                label: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_PEOPLE',
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
      }
    ];
  }

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {
    // Cluster
    this.advancedFilters = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_CLUSTER_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_CLUSTER_FIELD_LABEL_DESCRIPTION',
        sortable: true
      }
    ];
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
        return ClusterModel.canCreate(this.authUser);
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
            ['/version']
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
      'icon'
    ];
  }

  /**
   * Re(load) the Clusters list, based on the applied filter, sort criterias
   */
  refreshList() {
    this.clustersList$ = this.clusterDataService
      .getClusterList(this.selectedOutbreak.id, this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

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
