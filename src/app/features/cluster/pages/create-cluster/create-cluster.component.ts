import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import * as _ from 'lodash';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';

@Component({
    selector: 'app-create-cluster',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-cluster.component.html',
    styleUrls: ['./create-cluster.component.less']
})
export class CreateClusterComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '/clusters'),
        new BreadcrumbItemModel('LNG_PAGE_CREATE_CLUSTER_TITLE', null, true)
    ];

    clusterData: ClusterModel = new ClusterModel();

    selectedOutbreak: OutbreakModel = new OutbreakModel();

    constructor(
        private router: Router,
        private clusterDataService: ClusterDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService
    ) {
        super();
    }

    ngOnInit() {
        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;
            });
    }

    createNewCluster(stepForms: NgForm[]) {

        // get forms fields
        const dirtyFields: any = this.formHelper.mergeFields(stepForms);

        if (
            this.formHelper.isFormsSetValid(stepForms) &&
            !_.isEmpty(dirtyFields)
        ) {
            // add the new Cluster
            this.clusterDataService
                .createCluster(this.selectedOutbreak.id, dirtyFields)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    return ErrorObservable.create(err);
                })
                .subscribe(() => {
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_CLUSTER_ACTION_CREATE_CLUSTER_SUCCESS_MESSAGE');

                    // navigate to listing page
                    this.router.navigate(['/clusters']);
                });
        }
    }

}
