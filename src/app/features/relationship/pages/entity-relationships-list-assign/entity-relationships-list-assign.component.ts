import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import * as _ from 'lodash';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { catchError, map, share, tap } from 'rxjs/operators';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { UserSettings } from '../../../../core/models/user.model';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
    selector: 'app-entity-relationships-list-assign',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list-assign.component.html',
    styleUrls: ['./entity-relationships-list-assign.component.less']
})
export class EntityRelationshipsListAssignComponent extends RelationshipsListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // entities list relationships
    entitiesList$: Observable<(CaseModel | ContactModel | EventModel)[]>;
    entitiesListCount$: Observable<IBasicCount>;

    // available side filters
    availableSideFilters: FilterModel[];
    // values for side filter
    savedFiltersType = Constants.APP_PAGE.PEOPLE_TO_SHARE_RELATIONSHIPS_WITH.value;

    // constants
    UserSettings = UserSettings;

    // reference data
    genderList$: Observable<any[]>;
    personTypesList$: Observable<any[]>;
    personTypesListMap: { [id: string]: ReferenceDataEntryModel };
    riskLevelsList$: Observable<any[]>;
    caseClassificationsList$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;

    selectedTargetIds: string[] = [];

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService,
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(
            listHelperService, router, route,
            authDataService, outbreakDataService, entityDataService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        super.ngOnInit();

        // reference data
        this.genderList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.GENDER).pipe(share());
        this.riskLevelsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.RISK_LEVEL).pipe(share());
        this.caseClassificationsList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CASE_CLASSIFICATION).pipe(share());
        const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).pipe(share());
        this.personTypesList$ = personTypes$
            .pipe(
                map((data: ReferenceDataCategoryModel) => {
                    return _.map(data.entries, (entry: ReferenceDataEntryModel) =>
                        new LabelValuePair(entry.value, entry.id)
                    );
                })
            );
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

        // side filters
        this.generateSideFilters();

        if (_.isEmpty(this.route.snapshot.queryParams.selectedTargetIds)) {
            this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');
            this.router.navigate(['..']);
        } else {
            this.selectedTargetIds = JSON.parse(this.route.snapshot.queryParams.selectedTargetIds);

            this.onDataInitialized();
        }

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'checkbox',
                required: true,
                excludeFromSave: true
            }),
            new VisibleColumnModel({
                field: 'lastName',
                label: 'LNG_ENTITY_FIELD_LABEL_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_ENTITY_FIELD_LABEL_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'age',
                label: 'LNG_ENTITY_FIELD_LABEL_AGE'
            }),
            new VisibleColumnModel({
                field: 'gender',
                label: 'LNG_ENTITY_FIELD_LABEL_GENDER'
            }),
            new VisibleColumnModel({
                field: 'riskLevel',
                label: 'LNG_ENTITY_FIELD_LABEL_RISK'
            }),
            new VisibleColumnModel({
                field: 'classification',
                label: 'LNG_ENTITY_FIELD_LABEL_CLASSIFICATION'
            }),
            new VisibleColumnModel({
                field: 'dateOfOnset',
                label: 'LNG_ENTITY_FIELD_LABEL_DATE_OF_ONSET'
            }),
            new VisibleColumnModel({
                field: 'place',
                label: 'LNG_ENTITY_FIELD_LABEL_PLACE'
            }),
            new VisibleColumnModel({
                field: 'address',
                label: 'LNG_ENTITY_FIELD_LABEL_ADDRESS'
            })
        ];
    }

    /**
     * @Overrides parent method
     */
    onDataInitialized() {
        if (
            !this.selectedTargetIds ||
            !this.entityType ||
            !this.entityId ||
            !this.selectedOutbreak ||
            !this.relationshipType
        ) {
            return;
        }

        // initialize breadcrumbs
        this.initializeBreadcrumbs();

        // initialize query builder
        this.clearQueryBuilder();

        // initialize pagination
        this.initPaginator();
        // ...and (re)load the list
        this.needsRefreshList(true);
    }

    /**
     * @Overrides parent method
     */
    onPersonLoaded() {
        // (re)initialize breadcrumbs
        this.initializeBreadcrumbs();
    }

    /**
     * @Overrides parent method
     */
    clearQueryBuilder() {
        // clear query builder
        this.queryBuilder.clear();

        // apply default criterias
        // exclude root person and selected exposures from the list
        const excludeEntityIds = [this.entityId, ...this.selectedTargetIds];
        this.queryBuilder.filter.where({
            id: {
                'nin': excludeEntityIds
            }
        });

        // get available entities
        const availableTypes: EntityType[] = this.genericDataService
            .getAvailableRelatedEntityTypes(
                this.entityType,
                this.relationshipType,
                Constants.APP_PAGE.PEOPLE_TO_SHARE_RELATIONSHIPS_WITH.value
            );

        this.queryBuilder.filter.where({
            type: {
                'inq': availableTypes
            }
        });
    }

    private initializeBreadcrumbs() {
        if (
            this.relationshipType &&
            this.entity
        ) {
            const assignRelationshipsPageTitle = this.relationshipType === RelationshipType.EXPOSURE ?
                'LNG_PAGE_LIST_ENTITY_ASSIGN_EXPOSURES_TITLE' :
                'LNG_PAGE_LIST_ENTITY_ASSIGN_CONTACTS_TITLE';

            this.breadcrumbs = [
                new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
                new BreadcrumbItemModel(
                    this.entity.name,
                    `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                ),
                new BreadcrumbItemModel(
                    this.relationshipsListPageTitle,
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
                ),
                new BreadcrumbItemModel(assignRelationshipsPageTitle, null, true)
            ];
        }
    }

    /**
     * Re(load) the available Entities list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // retrieve the list of Relationships
            this.entitiesList$ = this.entityDataService
                .getEntitiesList(
                    this.selectedOutbreak.id,
                    this.queryBuilder
                )
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
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();
            countQueryBuilder.sort.clear();
            this.entitiesListCount$ = this.entityDataService
                .getEntitiesCount(this.selectedOutbreak.id, countQueryBuilder)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);
                        return throwError(err);
                    }),
                    share()
                );
        }
    }

    private generateSideFilters() {
        this.availableSideFilters = [
            new FilterModel({
                fieldName: 'type',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_TYPE',
                type: FilterType.MULTISELECT,
                options$: this.personTypesList$,
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
                type: FilterType.ADDRESS,
                addressFieldIsArray: true
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
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType: string) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    selectEntities() {
        // get list of selected ids
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/share/create-bulk`],
            {
                queryParams: {
                    selectedSourceIds: JSON.stringify(selectedRecords),
                    selectedTargetIds: JSON.stringify(this.selectedTargetIds)
                }
            }
        );
    }
}
