import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClusterModel } from '../../../../core/models/cluster.model';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { EntityType } from '../../../../core/models/entity-type';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import * as _ from 'lodash';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { Constants } from '../../../../core/models/constants';
import { catchError, share, tap } from 'rxjs/operators';
import { HoverRowAction } from '../../../../shared/components';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-clusters-people-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './clusters-people-list.component.html',
    styleUrls: ['./clusters-people-list.component.less']
})
export class ClustersPeopleListComponent extends ListComponent implements OnInit, OnDestroy {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // authenticated user
    authUser: UserModel;
    // selected Outbreak
    selectedOutbreak: OutbreakModel;
    // present cluster
    cluster: ClusterModel;
    // cluster people list
    clusterPeopleList$: Observable<any>;
    clusterPeopleListCount$: Observable<IBasicCount>;

    // reference data
    genderList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    personTypesListMap: { [id: string]: ReferenceDataEntryModel };

    // constants
    EntityType = EntityType;
    ReferenceDataCategory = ReferenceDataCategory;
    Constants = Constants;

    fixedTableColumns: string[] = [
        'lastName',
        'firstName',
        'age',
        'gender',
        'riskLevel',
        'place',
        'address'
    ];

    recordActions: HoverRowAction[] = [
        // View Person
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_ACTION_VIEW',
            click: (item: CaseModel | ContactModel | EventModel) => {
                this.router.navigateByUrl(this.getItemRouterLink(item, 'view'));
            },
            visible: (item: CaseModel | ContactModel | EventModel): boolean => {
                return !item.deleted &&
                    item.canView(this.authUser);
            }
        }),

        // Modify Person
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_ACTION_MODIFY',
            click: (item: CaseModel | ContactModel | EventModel) => {
                this.router.navigateByUrl(this.getItemRouterLink(item, 'modify'));
            },
            visible: (item: CaseModel | ContactModel | EventModel): boolean => {
                return !item.deleted &&
                    this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    item.canModify(this.authUser);
            }
        })
    ];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        private router: Router,
        private route: ActivatedRoute,
        private outbreakDataService: OutbreakDataService,
        private clusterDataService: ClusterDataService,
        private authDataService: AuthDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(listHelperService);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // retrieve cluster info
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL);
        const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
        personTypes$.subscribe((personTypeCategory: ReferenceDataCategoryModel) => {
            this.personTypesListMap = _.transform(
                personTypeCategory.entries,
                (result, entry: ReferenceDataEntryModel) => {
                    // groupBy won't work here since groupBy will put an array instead of one value
                    result[entry.id] = entry;
                },
                {}
            );
        });

        // get cluster ID from route params
        this.route.params.subscribe((params: { clusterId }) => {
            // get selected outbreak
            this.outbreakDataService.getSelectedOutbreak()
                .subscribe((selectedOutbreak) => {
                    this.selectedOutbreak = selectedOutbreak;
                    if (selectedOutbreak && selectedOutbreak.id) {

                        // retrieve cluster info
                        this.clusterDataService.getCluster(selectedOutbreak.id, params.clusterId)
                            .subscribe((clusterData: ClusterModel) => {
                                this.cluster = clusterData;

                                // initialize breadcrumbs
                                this.initializeBreadcrumbs();

                                // initialize pagination
                                this.initPaginator();
                                // ...and load the list of items
                                this.needsRefreshList(true);
                            });
                    }
                });
        });

        // initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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

        // cluster breadcrumb
        if (
            this.cluster &&
            ClusterModel.canView(this.authUser)
        ) {
            this.breadcrumbs.push(new BreadcrumbItemModel(
                this.cluster.name,
                `/clusters/${this.cluster.id}/view`
            ));
        }

        // people breadcrumb
        this.breadcrumbs.push(new BreadcrumbItemModel('LNG_PAGE_VIEW_CLUSTERS_PEOPLE_TITLE', '.', true));
    }

    /**
     * Re(load) the Cluster people list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (this.selectedOutbreak) {
            this.clusterPeopleList$ = this.clusterDataService
                .getClusterPeople(this.selectedOutbreak.id, this.cluster.id, this.queryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        finishCallback([]);
                        return throwError(err);
                    }),
                    tap(this.checkEmptyList.bind(this)),
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
        // remove paginator from query builder
        const countQueryBuilder = _.cloneDeep(this.queryBuilder);
        countQueryBuilder.paginator.clear();
        countQueryBuilder.sort.clear();
        this.clusterPeopleListCount$ = this.clusterDataService
            .getClusterPeopleCount(this.selectedOutbreak.id, this.cluster.id, countQueryBuilder)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                }),
                share()
            );
    }

    /**
     * Get the link to redirect to view page depending on item type and action
     */
    getItemRouterLink (item, action: string): string {
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
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType: string) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }
}
