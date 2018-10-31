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
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import * as _ from 'lodash';

@Component({
    selector: 'app-entity-relationships-list-assign',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list-assign.component.html',
    styleUrls: ['./entity-relationships-list-assign.component.less']
})
export class EntityRelationshipsListAssignComponent extends ListComponent implements OnInit {

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

    // available side filters
    availableSideFilters: FilterModel[];

    // reference data
    genderList$: Observable<any[]>;
    entityTypesList$: Observable<any[]>;
    riskLevelsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    selectedTargetIds: string[] = [];
    selectedSourceIds: string[] = [];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        protected snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).share();
        this.entityTypesList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.PERSON_TYPE).share();
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).share();
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION).share();

        // side filters
        this.generateSideFilters();

        this.route.queryParams
            .subscribe((queryParams: {selectedTargetIds}) => {
                if (_.isEmpty(queryParams.selectedTargetIds)) {
                    this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');
                    this.router.navigate(['..', 'share']);
                } else {
                    this.selectedTargetIds = JSON.parse(queryParams.selectedTargetIds);
                }
            });

        this.route.params
            .subscribe((params: {entityType, entityId}) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;
                const excludeEntityIds = [...[this.entityId], ...this.selectedTargetIds];

                // exclude current Entity from the list
                this.queryBuilder.filter.where({
                    id: {
                        'nin': excludeEntityIds
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
                                        `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                                    )
                                );
                                // add new breadcrumb: Entity Relationships list
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_LIST_ENTITY_SHARE_RELATIONSHIPS_TITLE',
                                        `/relationships/${this.entityType}/${this.entityId}/share`
                                    )
                                );
                                // add new breadcrumb: page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_ASSIGN_RELATIONSHIPS_TITLE', null, true)
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

    private generateSideFilters() {
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'type',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_TYPE',
                type: FilterType.MULTISELECT,
                options$: this.entityTypesList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'firstName',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'lastName',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME',
                type: FilterType.TEXT,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'gender',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_GENDER',
                type: FilterType.MULTISELECT,
                options$: this.genderList$,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'age',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_AGE',
                type: FilterType.RANGE_AGE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'addresses',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_ADDRESS',
                type: FilterType.ADDRESS
            }),
            new FilterModel({
                fieldName: 'dob',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_DOB',
                type: FilterType.RANGE_DATE,
                sortable: true
            }),
            new FilterModel({
                fieldName: 'riskLevel',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_RISK',
                type: FilterType.MULTISELECT,
                options$: this.riskLevelsList$,
                sortable: true
            }),

        ];
    }

    /**
     * @Overrides parent method
     *
     * @param data
     */
    public sortBy(
        data: any,
        objectDetailsSort?: {
            [property: string]: string[]
        }
    ) {
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
            super.sortBy(data, objectDetailsSort);
        }
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'checkbox', 'lastName', 'firstName', 'age', 'gender', 'riskLevel', 'classification',
            'place', 'address'
        ];

        return columns;
    }

    selectEntities(form: NgForm) {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/createBulk`],
            {
                queryParams: {
                    selectedSourceIds: JSON.stringify(selectedRecords),
                    selectedTargetIds: JSON.stringify(this.selectedTargetIds)
                }
            }
        );
    }
}
