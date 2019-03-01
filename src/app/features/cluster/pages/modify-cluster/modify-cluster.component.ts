import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { PERMISSION } from '../../../../core/models/permission.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';

@Component({
    selector: 'app-modify-cluster',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-cluster.component.html',
    styleUrls: ['./modify-cluster.component.less']
})
export class ModifyClusterComponent extends ViewModifyComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();
    clusterId: string;

    clusterData: ClusterModel = new ClusterModel();

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private clusterDataService: ClusterDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params.subscribe((params: { clusterId }) => {
            this.clusterId = params.clusterId;

            // get current outbreak
            this.outbreakDataService
                .getSelectedOutbreak()
                .subscribe((selectedOutbreak: OutbreakModel) => {
                    this.selectedOutbreak = selectedOutbreak;

                    // get cluster
                    this.clusterDataService
                        .getCluster(selectedOutbreak.id, this.clusterId)
                        .subscribe(clusterDataReturned => {
                            this.clusterData = new ClusterModel(clusterDataReturned);

                            // add breadcrumb for page title
                            this.createBreadcrumbs();
                        });
                });


        });
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

    modifyCluster(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the Cluster
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.clusterDataService
            .modifyCluster(this.selectedOutbreak.id, this.clusterId, dirtyFields)
            .catch((err) => {
                this.snackbarService.showError(err.message);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((modifiedCluster: ClusterModel) => {
                // update model
                this.clusterData = modifiedCluster;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CLUSTER_ACTION_MODIFY_CLUSTER_SUCCESS_MESSAGE');

                // update breadcrumb
                this.createBreadcrumbs();

                // hide dialog
                loadingDialog.close();
            });
    }
    /**
     * Create breadcrumbs
     */
    createBreadcrumbs() {
        this.breadcrumbs = [
            new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '/clusters'),
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CLUSTER_TITLE' : 'LNG_PAGE_MODIFY_CLUSTER_TITLE',
                null,
                true,
                {},
                this.clusterData
            )
        ];
    }
}
