import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { UserModel } from '../../../../core/models/user.model';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-modify-cluster',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-cluster.component.html',
    styleUrls: ['./modify-cluster.component.less']
})
export class ModifyClusterComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // constants
    ClusterModel = ClusterModel;

    // authenticated user
    authUser: UserModel;

    selectedOutbreak: OutbreakModel = new OutbreakModel();
    clusterId: string;

    clusterData: ClusterModel = new ClusterModel();

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private clusterDataService: ClusterDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // show loading
        this.showLoadingDialog(false);

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

                            // update breadcrumbs
                            this.initializeBreadcrumbs();

                            // hide loading
                            this.hideLoadingDialog();
                        });
                });


        });
    }

    /**
     * Initialize breadcrumbs
     */
    initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ClusterModel.canList(this.authUser)) {
            this.breadcrumbs.push(
                new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '/clusters')
            );
        }

        // view / modify breadcrumb
        this.breadcrumbs.push(
            new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_CLUSTER_TITLE' : 'LNG_PAGE_MODIFY_CLUSTER_TITLE',
                '.',
                true,
                {},
                this.clusterData
            )
        );
    }

    /**
     * Modify Cluster
     */
    modifyCluster(form: NgForm) {
        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // show loading
        this.showLoadingDialog();

        // modify the Cluster
        this.clusterDataService
            .modifyCluster(this.selectedOutbreak.id, this.clusterId, dirtyFields)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((modifiedCluster: ClusterModel) => {
                // update model
                this.clusterData = modifiedCluster;

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_CLUSTER_ACTION_MODIFY_CLUSTER_SUCCESS_MESSAGE');

                // update breadcrumbs
                this.initializeBreadcrumbs();

                // hide loading
                this.hideLoadingDialog();
            });
    }
}
