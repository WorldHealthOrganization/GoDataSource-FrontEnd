import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import * as _ from 'lodash';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-clusters-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './clusters-list.component.html',
    styleUrls: ['./clusters-list.component.less']
})
export class ClustersListComponent extends ListComponent implements OnInit, OnDestroy {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '.', true)
    ];

    outbreakSubscriber: Subscription;

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // list of existing clusters
    clustersList$: Observable<ClusterModel[]>;
    clustersListCount$: Observable<any>;

    recordActions: HoverRowAction[] = [
        // View Cluster
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_CLUSTER',
            click: (item: ClusterModel) => {
                this.router.navigate(['/clusters', item.id, 'view']);
            }
        }),

        // Modify Cluster
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_CLUSTERS_ACTION_MODIFY_CLUSTER',
            click: (item: ClusterModel) => {
                this.router.navigate(['/clusters', item.id, 'modify']);
            },
            visible: (): boolean => {
                return this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    this.hasOutbreakWriteAccess();
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
                            this.hasOutbreakWriteAccess();
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
                            this.hasOutbreakWriteAccess();
                    }
                }),

                // View People
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_CLUSTERS_ACTION_VIEW_PEOPLE',
                    click: (item: ClusterModel) => {
                        this.router.navigate(['/clusters', item.id, 'people']);
                    },
                    visible: (): boolean => {
                        return this.hasCaseReadAccess() ||
                            this.hasContactReadAccess();
                    }
                })
            ]
        })
    ];

    constructor(
        private router: Router,
        private clusterDataService: ClusterDataService,
        private authDataService: AuthDataService,
        protected snackbarService: SnackbarService,
        private outbreakDataService: OutbreakDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

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

    ngOnDestroy() {
        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * Re(load) the Clusters list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: () => void) {
        if (this.selectedOutbreak) {
            this.clustersList$ = this.clusterDataService
                .getClusterList(this.selectedOutbreak.id, this.queryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback();
                        return throwError(err);
                    }),
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
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
            this.clustersListCount$ = this.clusterDataService.getClustersCount(this.selectedOutbreak.id, countQueryBuilder).pipe(share());
        }
    }

    /**
     * Check if we have write access to Outbreak
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
    }

    /**
     * Check if we have access to View cluster's cases
     * @returns {boolean}
     */
    hasCaseReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CASE);
    }

    /**
     * Check if we have access to View cluster's contacts
     * @returns {boolean}
     */
    hasContactReadAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.READ_CONTACT);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        return [
            'name',
            'description'
        ];
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
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
