import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute } from '@angular/router';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';

@Component({
    selector: 'app-clusters-people-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './clusters-people-list.component.html',
    styleUrls: ['./clusters-people-list.component.less']
})
export class ClustersPeopleListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_VIEW_CLUSTERS_PEOPLE_TITLE', '/clusters'),
    ];

    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // present cluster
    cluster: ClusterModel;
    // cluster people list
    clusterPeopleList$: Observable<any>;


    ReferenceDataCategory = ReferenceDataCategory;


    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private clusterDataService: ClusterDataService
    ) {
        super();
    }

    ngOnInit() {
        // retrieve cluster info
        this.route.params.subscribe((params: { clusterId }) => {
            // get selecteed outbreak
            this.outbreakDataService.getSelectedOutbreak()
                .subscribe((selectedOutbreak) => {
                this.selectedOutbreak = selectedOutbreak;
                    if (selectedOutbreak && selectedOutbreak.id) {
                        this.clusterDataService.getCluster(selectedOutbreak.id, params.clusterId)
                            .subscribe((clusterData: ClusterModel) => {
                                this.cluster = clusterData;
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(clusterData.name),
                                    new BreadcrumbItemModel('LNG_PAGE_VIEW_CLUSTERS_PEOPLE_VIEW_PEOPLE_TITLE')
                                );
                                // retrieve cluster data
                                this.refreshList();
                            });
                    }
                });
        });
    }

    /**
     * Re(load) the Cluster people list, based on the applied filter, sort criterias
     */
    refreshList() {
        this.clusterPeopleList$ = this.clusterDataService.getClusterPeople(this.selectedOutbreak.id, this.cluster.id)
            .subscribe((data) => {
            console.log(data);
            })
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'firstName', 'lastName', 'gender', 'classification'
            // 'lastName', 'age', 'gender', 'risk',
            // 'lastFollowUp', 'place', 'address'
        ];

        return columns;
    }

}
