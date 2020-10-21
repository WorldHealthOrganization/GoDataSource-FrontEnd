import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CreateConfirmOnChanges } from '../../../../core/helperClasses/create-confirm-on-changes';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { RedirectService } from '../../../../core/services/helper/redirect.service';
import { IconModel } from '../../../../core/models/icon.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';

@Component({
    selector: 'app-create-cluster',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-cluster.component.html',
    styleUrls: ['./create-cluster.component.less']
})
export class CreateClusterComponent
    extends CreateConfirmOnChanges
    implements OnInit {

    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // change icon ?
    changeIcon: boolean = false;
    iconsList$: Observable<IconModel[]>;

    // authenticated user details
    authUser: UserModel;

    clusterData: ClusterModel = new ClusterModel();

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    /**
     * Constructor
     */
    constructor(
        private router: Router,
        private clusterDataService: ClusterDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private dialogService: DialogService,
        private authDataService: AuthDataService,
        private redirectService: RedirectService,
        private iconDataService: IconDataService
    ) {
        super();
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // icons data
        this.iconsList$ = this.iconDataService.getIconsList();

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
            });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Initialize breadcrumbs
     */
    private initializeBreadcrumbs() {
        // reset
        this.breadcrumbs = [];

        // add list breadcrumb only if we have permission
        if (ClusterModel.canList(this.authUser)) {
            this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '/clusters'));
        }

        // create breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_CREATE_CLUSTER_TITLE', '.', true));
    }

    /**
     * Create new cluster
     */
    createNewCluster(stepForms: NgForm[]) {
        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Cluster
            const loadingDialog = this.dialogService.showLoadingDialog();
            this.clusterDataService
                .createCluster(this.selectedOutbreak.id, dirtyFields)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        loadingDialog.close();
                        return throwError(err);
                    })
                )
                .subscribe((newCluser: ClusterModel) => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CLUSTER_ACTION_CREATE_CLUSTER_SUCCESS_MESSAGE');

                    // hide dialog
                    loadingDialog.close();

                    // navigate to proper page
                    // method handles disableDirtyConfirm too...
                    this.redirectToProperPageAfterCreate(
                        this.router,
                        this.redirectService,
                        this.authUser,
                        ClusterModel,
                        'clusters',
                        newCluser.id
                    );
                });
        }
    }

}
