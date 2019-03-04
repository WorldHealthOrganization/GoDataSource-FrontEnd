import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs/Observable';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';
import { tap } from 'rxjs/operators';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityModel } from '../../../../core/models/entity.model';

@Component({
    selector: 'app-entity-relationships-list-share',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list-share.component.html',
    styleUrls: ['./entity-relationships-list-share.component.less']
})
export class EntityRelationshipsListShareComponent extends RelationshipsListComponent implements OnInit {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // list of relationships
    relationshipsList$: Observable<EntityModel[]>;
    relationshipsListCount$: Observable<any>;

    // reference data
    certaintyLevelList$: Observable<any>;
    exposureTypeList$: Observable<any>;
    exposuresFrequencyList$: Observable<any>;
    exposureDurationList$: Observable<any>;
    relationshipTypeList$: Observable<any>;

    personTypesListMap: { [id: string]: ReferenceDataEntryModel };

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;
    EntityModel = EntityModel;
    UserSettings = UserSettings;

    constructor(
        protected snackbarService: SnackbarService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(
            snackbarService, router, route,
            authDataService, outbreakDataService, entityDataService
        );
    }

    ngOnInit() {
        super.ngOnInit();

        this.certaintyLevelList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL);
        this.exposureTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE);
        this.exposuresFrequencyList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY);
        this.exposureDurationList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION);
        this.relationshipTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION);
        const personTypes$ = this.referenceDataDataService.getReferenceDataByCategory(ReferenceDataCategory.PERSON_TYPE).share();
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

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * @Overrides parent method
     */
    onDataInitialized() {
        // initialize breadcrumbs
        this.initializeBreadcrumbs();
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
                new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_SHARE_RELATIONSHIPS_TITLE', null, true)
            ];
        }
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
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME'
            }),
            new VisibleColumnModel({
                field: 'firstName',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'visualId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_VISUAL_ID'
            }),
            new VisibleColumnModel({
                field: 'contactDate',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_CONTACT_DATE'
            }),
            new VisibleColumnModel({
                field: 'certaintyLevelId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_CERTAINTY_LEVEL'
            }),
            new VisibleColumnModel({
                field: 'exposureTypeId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_TYPE'
            }),
            new VisibleColumnModel({
                field: 'exposureFrequencyId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'exposureDurationId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'socialRelationshipTypeId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION'
            })
        ];
    }

    /**
     * Re(load) the Relationships list, based on the applied filter, sort criterias
     */
    refreshList() {
        if (
            this.relationshipType &&
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            if (this.relationshipType === RelationshipType.EXPOSURE) {
                // retrieve the list of exposures
                this.relationshipsList$ = this.relationshipDataService.getEntityExposures(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                    .pipe(tap(this.checkEmptyList.bind(this)));
            } else {
                // retrieve the list of contacts
                this.relationshipsList$ = this.relationshipDataService.getEntityContacts(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                    .pipe(tap(this.checkEmptyList.bind(this)));
            }
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (
            this.relationshipType &&
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(this.queryBuilder);
            countQueryBuilder.paginator.clear();

            if (this.relationshipType === RelationshipType.EXPOSURE) {
                // count the exposures
                this.relationshipsListCount$ = this.relationshipDataService.getEntityExposuresCount(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    countQueryBuilder
                ).share();
            } else {
                // count the contacts
                this.relationshipsListCount$ = this.relationshipDataService.getEntityContactsCount(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    countQueryBuilder
                ).share();
            }
        }
    }

    /**
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    selectEntities(form: NgForm) {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/contacts/${this.relationshipTypeRoutePath}/assign-to`],
            {
                queryParams: {
                    selectedTargetIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

}
