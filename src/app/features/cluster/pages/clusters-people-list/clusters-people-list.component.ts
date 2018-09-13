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
import { EntityType } from '../../../../core/models/entity-type';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';

@Component({
    selector: 'app-clusters-people-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './clusters-people-list.component.html',
    styleUrls: ['./clusters-people-list.component.less']
})
export class ClustersPeopleListComponent extends ListComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CLUSTERS_TITLE', '/clusters'),
    ];
    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // present cluster
    cluster: ClusterModel;
    // cluster people list
    clusterPeopleList$: Observable<any>;
    // gender list
    genderList$: Observable<any[]>;

    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;

    constructor(
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private clusterDataService: ClusterDataService,
        private genericDataService: GenericDataService,
        private authDataService: AuthDataService
    ) {
        super();
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();
        // reference data
        this.genderList$ = this.genericDataService.getGenderList().share();
        // retrieve cluster info
        this.route.params.subscribe((params: { clusterId }) => {
            // get selected outbreak
            this.outbreakDataService.getSelectedOutbreak()
                .subscribe((selectedOutbreak) => {
                this.selectedOutbreak = selectedOutbreak;
                    if (selectedOutbreak && selectedOutbreak.id) {
                        this.clusterDataService.getCluster(selectedOutbreak.id, params.clusterId)
                            .subscribe((clusterData: ClusterModel) => {
                                this.cluster = clusterData;
                                // pushing the new breadcrumbs
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(clusterData.name),
                                    new BreadcrumbItemModel('LNG_PAGE_VIEW_CLUSTERS_PEOPLE_TITLE', '.', true)
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
        this.clusterPeopleList$ = this.clusterDataService.getClusterPeople(this.selectedOutbreak.id, this.cluster.id, this.queryBuilder);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'firstName', 'lastName', 'age', 'gender', 'risk',
            'lastFollowUp', 'place', 'address', 'actions'
        ];
        return columns;
    }

    /**
     * Get the link to redirect to view page depending on item type and action
     * @param {Object} item
     * @param {string} action
     * @returns {string}
     */
    getItemRouterLink (item, action: string) {
        switch (item.type) {
            case EntityType.CASE:
                return `/cases/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.CONTACT:
                return `/contacts/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
            case EntityType.EVENT:
                return `/events/${item.id}/${action === 'view' ? 'view' : 'modify'}`;
        }
    }

    /**
     * Get the permission for different type of item
     * @param {Object} item
     * @returns {boolean}
     */
    getAccessPermissions(item) {
        switch (item.type) {
            case EntityType.CASE:
                return this.hasCaseWriteAccess();
            case EntityType.CONTACT:
                return this.hasContactWriteAccess();
            case EntityType.EVENT:
                return this.hasEventWriteAccess();
        }
    }

    /**
     * Check if we have access to write cluster's cases
     * @returns {boolean}
     */
    hasCaseWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CASE);
    }

    /**
     * Check if we have access to write cluster's contacts
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

    /**
     * Check if we have access to write cluster's event
     * @returns {boolean}
     */
    hasEventWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_EVENT);
    }
}
