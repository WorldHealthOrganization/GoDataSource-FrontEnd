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
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogAnswerButton } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import * as _ from 'lodash';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { tap } from 'rxjs/operators';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityModel } from '../../../../core/models/entity.model';

@Component({
    selector: 'app-entity-relationships-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list.component.html',
    styleUrls: ['./entity-relationships-list.component.less']
})
export class EntityRelationshipsListComponent extends ListComponent implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [];

    // Entities Map for specific data
    entityMap = {
        [EntityType.CASE]: {
            'label': 'LNG_PAGE_LIST_CASES_TITLE',
            'link': '/cases',
            'writePermission': PERMISSION.WRITE_CASE
        },
        [EntityType.CONTACT]: {
            'label': 'LNG_PAGE_LIST_CONTACTS_TITLE',
            'link': '/contacts',
            'writePermission': PERMISSION.WRITE_CONTACT
        },
        [EntityType.EVENT]: {
            'label': 'LNG_PAGE_LIST_EVENTS_TITLE',
            'link': '/events',
            'writePermission': PERMISSION.WRITE_EVENT
        }
    };

    // authenticated user
    authUser: UserModel;
    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // route params
    entityType: EntityType;
    entityId: string;
    entity: CaseModel | ContactModel | EventModel;
    // route data
    relationshipType: RelationshipType;

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
    UserSettings = UserSettings;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        protected snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // reference data
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

        // get relationship type
        this.route.data.subscribe((routeData) => {
            this.relationshipType = routeData.relationshipType;

            this.initializeBreadcrumbs();
            this.needsRefreshList(true);
        });

        // get person type and ID from route params
        this.route.params
            .subscribe((params: { entityType, entityId }) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;

                this.loadPerson();
            });

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadPerson();
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    private loadPerson() {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // initialize pagination
            this.initPaginator();
            // ...and (re)load the list when
            this.needsRefreshList(true);

            // get person data
            this.entityDataService
                .getEntity(this.entityType, this.selectedOutbreak.id, this.entityId)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    // Entity not found; navigate back to Entities list
                    this.router.navigate([this.entityMap[this.entityType].link]);

                    return ErrorObservable.create(err);
                })
                .subscribe((entityData: CaseModel | ContactModel | EventModel) => {
                    this.entity = entityData;

                    this.initializeBreadcrumbs();
                });
        }
    }

    private initializeBreadcrumbs() {
        if (
            this.relationshipType &&
            this.entity
        ) {
            // add new breadcrumb: page title
            const pageTitle = this.relationshipType === RelationshipType.EXPOSURE ?
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE';

            this.breadcrumbs = [
                new BreadcrumbItemModel(this.entityMap[this.entityType].label, this.entityMap[this.entityType].link),
                new BreadcrumbItemModel(
                    this.entity.name,
                    `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                ),
                new BreadcrumbItemModel(pageTitle, null, true)
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
            }),
            new VisibleColumnModel({
                field: 'actions',
                required: true,
                excludeFromSave: true
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

    get relationshipTypeRoutePath(): string {
        return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
    }

    hasEntityWriteAccess(): boolean {
        return this.authUser.hasPermissions(this.entityMap[this.entityType].writePermission);
    }

    /**
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    /**
     * Delete a relationship for current Entity
     * @param {EntityModel} relatedEntity
     */
    deleteRelationship(relatedEntity: EntityModel) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIP', relatedEntity.model)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete relationship
                    this.relationshipDataService
                        .deleteRelationship(this.selectedOutbreak.id, this.entityType, this.entityId, relatedEntity.relationship.id)
                        .catch((err) => {
                            this.snackbarService.showError(err.message);

                            return ErrorObservable.create(err);
                        })
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }
}
