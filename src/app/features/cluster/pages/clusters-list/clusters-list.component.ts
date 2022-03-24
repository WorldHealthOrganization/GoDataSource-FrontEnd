import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import * as _ from 'lodash';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-clusters-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './clusters-list.component.html',
  styleUrls: ['./clusters-list.component.less']
})
export class ClustersListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '.', true)
  // ];

  // constants
  ClusterModel = ClusterModel;

  outbreakSubscriber: Subscription;

  // list of existing clusters
  clustersList$: Observable<ClusterModel[]>;
  clustersListCount$: Observable<IBasicCount>;

  fixedTableColumns: string[] = [
    'name',
    'description',
    'icon',
    'color'
  ];

  recordActions: HoverRowAction[] = [
    // View Cluster
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_CLUSTER',
      linkGenerator: (item: ClusterModel): string[] => {
        return ['/clusters', item.id, 'view'];
      },
      visible: (): boolean => {
        return ClusterModel.canView(this.authUser);
      }
    }),

    // Modify Cluster
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_MODIFY_CLUSTER',
      linkGenerator: (item: ClusterModel): string[] => {
        return ['/clusters', item.id, 'modify'];
      },
      visible: (): boolean => {
        return this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    ClusterModel.canModify(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Cluster
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_CLUSTER',
          click: (item: ClusterModel) => {
            this.deleteCluster(item);
          },
          visible: (): boolean => {
            return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ClusterModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        }),

        // Divider
        new HoverRowAction({
          type: HoverRowActionType.DIVIDER,
          visible: (): boolean => {
            // visible only if at least one of the previous...
            return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            ClusterModel.canDelete(this.authUser);
          }
        }),

        // View People
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_PEOPLE',
          click: (item: ClusterModel) => {
            this.router.navigate(['/clusters', item.id, 'people']);
          },
          visible: (): boolean => {
            return ClusterModel.canListPeople(this.authUser);
          }
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private clusterDataService: ClusterDataService,
    private toastV2Service: ToastV2Service,
    private outbreakDataService: OutbreakDataService,
    private dialogService: DialogService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // subscribe to the Selected Outbreak Subject stream
    this.outbreakSubscriber = this.outbreakDataService
      .getSelectedOutbreakSubject()
      .subscribe((selectedOutbreak: OutbreakModel) => {
        this.selectedOutbreak = selectedOutbreak;

        // initialize pagination
        this.initPaginator();
        // ...and re-load the list when the Selected Outbreak is changed
        this.needsRefreshList(true);
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();

    // outbreak subscriber
    if (this.outbreakSubscriber) {
      this.outbreakSubscriber.unsubscribe();
      this.outbreakSubscriber = null;
    }
  }

  /**
   * Initialize side table columns
   */
  protected initializeTableColumns(): void {}

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
   * Re(load) the Clusters list, based on the applied filter, sort criterias
   */
  refreshList(finishCallback: (records: any[]) => void) {
    if (this.selectedOutbreak) {
      this.clustersList$ = this.clusterDataService
        .getClusterList(this.selectedOutbreak.id, this.queryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            finishCallback([]);
            return throwError(err);
          }),
          tap((data: any[]) => {
            finishCallback(data);
          })
        );
    } else {
      finishCallback([]);
    }
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    if (this.selectedOutbreak) {
      // remove paginator from query builder
      const countQueryBuilder = _.cloneDeep(this.queryBuilder);
      countQueryBuilder.paginator.clear();
      countQueryBuilder.sort.clear();
      this.clustersListCount$ = this.clusterDataService
        .getClustersCount(this.selectedOutbreak.id, countQueryBuilder)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          share()
        );
    }
  }

  /**
     * Delete specific Cluster from the selected outbreak
     * @param {ClusterModel} clusterModel
     */
  deleteCluster(clusterModel: ClusterModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_CLUSTER', clusterModel)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete cluster
          this.clusterDataService
            .deleteCluster(this.selectedOutbreak.id, clusterModel.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }
}
