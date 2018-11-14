import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Observable } from 'rxjs/Observable';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { UserModel } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton } from '../../../../shared/components';
import { PERMISSION } from '../../../../core/models/permission.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-clusters-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './clusters-list.component.html',
    styleUrls: ['./clusters-list.component.less']
})
export class ClustersListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '.', true)
    ];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // list of existing clusters
    clustersList$: Observable<ClusterModel[]>;
    clustersListCount$: Observable<any>;

    constructor(
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
        this.outbreakDataService
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
     * Re(load) the Clusters list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.selectedOutbreak) {
            this.clustersList$ = this.clusterDataService.getClusterList(this.selectedOutbreak.id, this.queryBuilder);
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
            this.clustersListCount$ = this.clusterDataService.getClustersCount(this.selectedOutbreak.id, countQueryBuilder).share();
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
        const columns = [
            'name',
            'description',
            'actions'
        ];

        return columns;
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
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_CLUSTERS_ACTION_DELETE_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
