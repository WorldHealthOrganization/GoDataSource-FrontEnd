import { Component, OnInit } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { ActivatedRoute, Router } from '@angular/router';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { Observable } from 'rxjs/index';
import { CaseModel } from '../../../../core/models/case.model';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { map, share, tap } from 'rxjs/internal/operators';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { FilterModel, FilterType } from '../../../../shared/components/side-filters/model';
import { Constants } from '../../../../core/models/constants';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import {
    ReferenceDataCategory, ReferenceDataCategoryModel,
    ReferenceDataEntryModel
} from '../../../../core/models/reference-data.model';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { EntityType } from '../../../../core/models/entity-type';

@Component({
    selector: 'app-available-entities-for-switch-list',
    templateUrl: './available-entities-for-switch-list.component.html',
    styleUrls: ['./available-entities-for-switch-list.component.less']
})
export class AvailableEntitiesForSwitchListComponent extends RelationshipsListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    entitiesList$: Observable<(CaseModel|ContactModel|EventModel)[]>;
    entitiesListCount$: Observable<any>;

    // available side filters
    availableSideFilters: FilterModel[];

    // saved filters type
    savedFiltersType = Constants.APP_PAGE.AVAILABLE_ENTITIES_FOR_RELATIONSHIPS.value;

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

    constructor(
        protected snackbarService: SnackbarService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private genericDataService: GenericDataService,
        private referenceDataDataService: ReferenceDataDataService,
    ) {
        super(
            snackbarService, router, route,
            authDataService, outbreakDataService, entityDataService
        );
    }

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
    }

    /**
     * @Overrides parent method
     */
    onDataInitialized() {
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

    private initializeBreadcrumbs() {
        if (
            this.relationshipType &&
            this.entity
        ) {
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
                new BreadcrumbItemModel('LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE', null, true)
            ];
        }
    }

    /**
     * Re(load) the available Entities list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: () => void) {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // retrieve the list of Relationships
            this.entitiesList$ = this.relationshipDataService
                .getEntityAvailablePeople(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                .pipe(
                    tap(this.checkEmptyList.bind(this)),
                    tap(() => {
                        finishCallback();
                    })
                );
        } else {
            finishCallback();
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
            this.entitiesListCount$ = this.relationshipDataService
                .getEntityAvailablePeopleCount(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                .pipe(share());
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
                fieldName: 'visualId',
                fieldLabel: 'LNG_ENTITY_FIELD_LABEL_VISUAL_ID',
                type: FilterType.TEXT
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

}
