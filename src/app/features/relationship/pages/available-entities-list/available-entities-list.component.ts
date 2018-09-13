import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';

@Component({
    selector: 'app-available-entities-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './available-entities-list.component.html',
    styleUrls: ['./available-entities-list.component.less']
})
export class AvailableEntitiesListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // Entities Map for specific data
    entityMap = {
        [EntityType.CASE]: {
            'label': 'LNG_PAGE_LIST_CASES_TITLE',
            'link': '/cases'
        },
        [EntityType.CONTACT]: {
            'label': 'LNG_PAGE_LIST_CONTACTS_TITLE',
            'link': '/contacts'
        },
        [EntityType.EVENT]: {
            'label': 'LNG_PAGE_LIST_EVENTS_TITLE',
            'link': '/events'
        }
    };

    // selected outbreak ID
    outbreakId: string;
    // route params
    entityType: EntityType;
    entityId: string;
    // entities list relationships
    entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;
    entitiesListCount$: Observable<any>;

    genderList$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER);

        this.route.params
            .subscribe((params: {entityType, entityId}) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;

                // exclude current Entity from the list
                this.queryBuilder.filter.where({
                    id: {
                        'neq': this.entityId
                    }
                });
                // retrieve only available entity types
                const availableTypes: EntityType[] = this.genericDataService.getAvailableRelatedEntityTypes(this.entityType);
                this.queryBuilder.filter.where({
                    type: {
                        'inq': availableTypes
                    }
                });

                // add new breadcrumb: Entity List page
                this.breadcrumbs.push(
                    new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
                );

                // get selected outbreak
                this.outbreakDataService
                    .getSelectedOutbreak()
                    .subscribe((selectedOutbreak: OutbreakModel) => {
                        this.outbreakId = selectedOutbreak.id;

                        // initialize pagination
                        this.initPaginator();
                        // ...and load the list of items
                        this.needsRefreshList(true);

                        // get entity data
                        this.entityDataService
                            .getEntity(this.entityType, this.outbreakId, this.entityId)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);

                                // Entity not found; navigate back to Entities list
                                this.router.navigate([this.entityMap[this.entityType].link]);

                                return ErrorObservable.create(err);
                            })
                            .subscribe((entityData: CaseModel|ContactModel|EventModel) => {
                                // add new breadcrumb: Entity Modify page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        entityData.name,
                                        `${this.entityMap[this.entityType].link}/${this.entityId}/modify`
                                    )
                                );
                                // add new breadcrumb: Entity Relationships list
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE',
                                        `/relationships/${this.entityType}/${this.entityId}`
                                    )
                                );
                                // add new breadcrumb: page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE', null, true)
                                );
                            });
                    });
            });
    }

    /**
     * Re(load) the available Entities list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (this.outbreakId && this.entityType && this.entityId) {
            // retrieve the list of Relationships
            this.entitiesList$ = this.entityDataService.getEntitiesList(
                this.outbreakId,
                this.queryBuilder
            );
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.outbreakId && this.entityType && this.entityId) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            this.entitiesListCount$ = this.entityDataService.getEntitiesCount(this.outbreakId, countQueryBuilder);
        }
    }

    /**
     * @Overrides parent method
     *
     * @param data
     */
    public sortBy(data) {
        const property = _.get(data, 'active');
        const direction = _.get(data, 'direction');

        if (
            property === 'firstName' &&
            direction
        ) {
            // need to sort by firstName ASC, name ASC (so we sort Events aswell)

            // remove previous sort columns, we can sort only by one column at a time
            this.queryBuilder.sort.clear();

            // retrieve Side filters
            let queryBuilder;
            if (
                this.sideFilter &&
                (queryBuilder = this.sideFilter.getQueryBuilder())
            ) {
                this.queryBuilder.sort.merge(queryBuilder.sort);
            }

            // apply sort
            this.queryBuilder.sort.by('firstName', direction);
            this.queryBuilder.sort.by('name', direction);

            // refresh list
            this.needsRefreshList(false, false);
        } else {
            // call method from parent class
            super.sortBy(data);
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'checkbox', 'firstName', 'lastName', 'age', 'gender', 'riskLevel',
            'lastFollowUp', 'place', 'address'
        ];

        return columns;
    }

    selectEntities(form: NgForm) {
        // get list
        const selectedRecords: string[] = this.checkedRecords;
        if (selectedRecords.length < 1) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/create`],
            {
                queryParams: {
                    selectedEntityIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }
}
