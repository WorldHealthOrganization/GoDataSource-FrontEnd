import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { Observable } from 'rxjs';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { EntityType } from '../../../../core/models/entity-type';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import * as _ from 'lodash';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { catchError, share, tap } from 'rxjs/operators';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { RelationshipsListComponent } from '../../helper-classes/relationships-list-component';
import { throwError } from 'rxjs';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder/request-query-builder';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { RelationshipPersonModel } from '../../../../core/models/relationship-person.model';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ClusterModel } from '../../../../core/models/cluster.model';

@Component({
    selector: 'app-entity-relationships-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list.component.html',
    styleUrls: ['./entity-relationships-list.component.less']
})
export class EntityRelationshipsListComponent extends RelationshipsListComponent implements OnInit, OnDestroy {
    breadcrumbs: BreadcrumbItemModel[] = [];

    // list of relationships
    relationshipsList$: Observable<EntityModel[]>;
    relationshipsListRecordsMap: {
        [idRelationship: string]: EntityModel
    } = {};
    relationshipsListCount$: Observable<IBasicCount>;

    outbreakSubscriber: Subscription;

    // user list
    userList$: Observable<UserModel[]>;

    // reference data
    certaintyLevelList$: Observable<any>;
    exposureTypeList$: Observable<any>;
    exposuresFrequencyList$: Observable<any>;
    exposureDurationList$: Observable<any>;
    relationshipTypeList$: Observable<any>;
    personTypesListMap: { [id: string]: ReferenceDataEntryModel };
    clusterOptions$: Observable<any[]>;

    // provide constants to template
    Constants = Constants;
    ReferenceDataCategory = ReferenceDataCategory;
    EntityType = EntityType;
    UserSettings = UserSettings;
    RelationshipType = RelationshipType;
    RelationshipModel = RelationshipModel;

    recordActions: HoverRowAction[] = [
        // View Relationship
        new HoverRowAction({
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_VIEW_RELATIONSHIP',
            linkGenerator: (item: EntityModel): string[] => {
                return ['/relationships', this.entityType, this.entityId, this.relationshipTypeRoutePath, item.relationship.id, 'view'];
            },
            visible: (item: EntityModel) => {
                return !item.relationship.deleted &&
                    RelationshipModel.canView(this.authUser) &&
                    this.entityCanView;
            }
        }),

        // Modify Relationship
        new HoverRowAction({
            icon: 'settings',
            iconTooltip: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_MODIFY_RELATIONSHIP',
            linkGenerator: (item: EntityModel): string[] => {
                return ['/relationships', this.entityType, this.entityId, this.relationshipTypeRoutePath, item.relationship.id, 'modify'];
            },
            visible: (): boolean => {
                return this.authUser &&
                    this.selectedOutbreak &&
                    this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                    RelationshipModel.canModify(this.authUser) &&
                    this.entityCanModify;
            }
        }),

        // Other actions
        new HoverRowAction({
            type: HoverRowActionType.MENU,
            icon: 'moreVertical',
            menuOptions: [
                // Delete Relationship
                new HoverRowAction({
                    menuOptionLabel: 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP',
                    click: (item: EntityModel) => {
                        this.deleteRelationship(item);
                    },
                    visible: (): boolean => {
                        return this.authUser &&
                            this.selectedOutbreak &&
                            this.authUser.activeOutbreakId === this.selectedOutbreak.id &&
                            RelationshipModel.canDelete(this.authUser) &&
                            this.entityCanDelete;
                    },
                    class: 'mat-menu-item-delete'
                })
            ]
        })
    ];

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
        private relationshipDataService: RelationshipDataService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService,
        private clusterDataService: ClusterDataService,
        private userDataService: UserDataService
    ) {
        // parent
        super(
            listHelperService, router, route,
            authDataService, outbreakDataService, entityDataService
        );
        // set checkbox key ( id ) path for current list component
        this.checkedKeyPath = 'relationship.id';
    }

    ngOnInit() {
        super.ngOnInit();

        // retrieve users
        this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

        this.outbreakSubscriber = this.outbreakDataService
            .getSelectedOutbreakSubject()
            .subscribe((outbreak: OutbreakModel) => {
                if (
                    outbreak &&
                    ClusterModel.canList(this.authUser)
                ) {
                    // update the selected outbreak
                    this.clusterOptions$ = this.clusterDataService.getClusterListAsLabelValue(outbreak.id).pipe(share());
                }
            });

        // reference data
        this.certaintyLevelList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL);
        this.exposureTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE);
        this.exposuresFrequencyList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY);
        this.exposureDurationList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION);
        this.relationshipTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION);

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

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Component destroyed
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();

        // outbreak subscriber
        if (this.outbreakSubscriber) {
            this.outbreakSubscriber.unsubscribe();
            this.outbreakSubscriber = null;
        }
    }

    /**
     * @Overrides parent method
     */
    onDataInitialized() {
        // initialize breadcrumbs
        this.initializeBreadcrumbs();
        // initialize pagination
        this.initPaginator();
        // refresh items list
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
                new BreadcrumbItemModel(this.relationshipsListPageTitle, null, true)
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
            }),
            new VisibleColumnModel({
                field: 'socialRelationshipDetail',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_RELATION_DETAIL',
                visible: false
            })
        ];

        if (ClusterModel.canList(this.authUser)) {
            this.tableColumns.push(
                new VisibleColumnModel({
                    field: 'clusterId',
                    label: 'LNG_RELATIONSHIP_FIELD_LABEL_CLUSTER',
                    visible: false
                })
            );
        }

        this.tableColumns.push(
            new VisibleColumnModel({
                field: 'createdBy',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'createdAt',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_CREATED_AT',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedBy',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_BY',
                visible: false
            }),
            new VisibleColumnModel({
                field: 'updatedAt',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_UPDATED_AT',
                visible: false
            })
        );
    }

    /**
     * Re(load) the Relationships list, based on the applied filter, sort criterias
     */
    refreshList(finishCallback: (records: any[]) => void) {
        if (
            this.relationshipType &&
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // request data
            if (this.relationshipType === RelationshipType.EXPOSURE) {
                // retrieve the list of exposures
                this.relationshipsList$ = this.relationshipDataService
                    .getEntityExposures(
                        this.selectedOutbreak.id,
                        this.entityType,
                        this.entityId,
                        this.queryBuilder
                    )
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showApiError(err);
                            finishCallback([]);
                            return throwError(err);
                        }),
                        tap(this.checkEmptyList.bind(this)),
                        tap((entities: EntityModel[]) => {
                            // map models
                            this.relationshipsListRecordsMap = {};
                            (entities || []).forEach((entity) => {
                                this.relationshipsListRecordsMap[entity.relationship.id] = entity;
                            });

                            // finished
                            finishCallback(entities);
                        })
                    );
            } else {
                // retrieve the list of contacts
                this.relationshipsList$ = this.relationshipDataService.getEntityContacts(
                    this.selectedOutbreak.id,
                    this.entityType,
                    this.entityId,
                    this.queryBuilder
                )
                    .pipe(
                        tap(this.checkEmptyList.bind(this)),
                        tap((entities: EntityModel[]) => {
                            // map models
                            this.relationshipsListRecordsMap = {};
                            (entities || []).forEach((entity) => {
                                this.relationshipsListRecordsMap[entity.relationship.id] = entity;
                            });

                            // finished
                            finishCallback(entities);
                        })
                    );
            }
        } else {
            finishCallback([]);
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
            countQueryBuilder.sort.clear();

            if (this.relationshipType === RelationshipType.EXPOSURE) {
                // count the exposures
                this.relationshipsListCount$ = this.relationshipDataService
                    .getEntityExposuresCount(
                        this.selectedOutbreak.id,
                        this.entityType,
                        this.entityId,
                        countQueryBuilder
                    )
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showApiError(err);
                            return throwError(err);
                        }),
                        share()
                    );
            } else {
                // count the contacts
                this.relationshipsListCount$ = this.relationshipDataService
                    .getEntityContactsCount(
                        this.selectedOutbreak.id,
                        this.entityType,
                        this.entityId,
                        countQueryBuilder
                    )
                    .pipe(
                        catchError((err) => {
                            this.snackbarService.showApiError(err);
                            return throwError(err);
                        }),
                        share()
                    );
            }
        }
    }

    /**
     * Retrieve Person Type color
     */
    getPersonTypeColor(personType: string) {
        const personTypeData = _.get(this.personTypesListMap, personType);
        return _.get(personTypeData, 'colorCode', '');
    }

    get shareSelectedRelationshipsButtonLabel(): string {
        return this.relationshipType === RelationshipType.EXPOSURE ?
            'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_EXPOSURES' :
            'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_SHARE_SELECTED_CONTACTS';
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
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_ACTION_DELETE_RELATIONSHIP_SUCCESS_MESSAGE');

                            // reload data
                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Bulk delete selected relationships
     */
    deleteSelectedRelationships() {
        // get list of selected relationships
        const selectedRelationships: boolean | string[] = this.validateCheckedRecords();
        if (!selectedRelationships) {
            return;
        }
        const qb = new RequestQueryBuilder();

        qb.filter.where({
            'id': {
                'inq': selectedRelationships
            }
        });

        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIPS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.relationshipDataService
                        .deleteBulkRelationships(this.selectedOutbreak.id, qb)
                        .pipe(
                            catchError((err) => {
                                this.snackbarService.showApiError(err);
                                return throwError(err);
                            })
                        )
                        .subscribe(() => {
                            this.snackbarService.showSuccess('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_GROUP_ACTION_DELETE_SELECTED_RELATIONSHIPS_SUCCESS_MESSAGE');

                            this.needsRefreshList(true);
                        });
                }
            });
    }

    /**
     * Share selected relationships with other people
     */
    shareSelectedRelationships() {
        // get list of selected relationship ids
        const selectedRelationshipRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRelationshipRecords) {
            return;
        }

        // determine list of model ids
        const selectedRecords: string[] = _.map(selectedRelationshipRecords, (idRelationship: string) => this.relationshipsListRecordsMap[idRelationship].model.id)
            .filter((record, index, self) => {
                // keep only unique dates
                return self.indexOf(record) === index;
            });

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/share`],
            {
                queryParams: {
                    selectedTargetIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

    changeSourceForSelectedRelationships() {
        const selectedRecords: false | string [] = this.validateCheckedRecords();

        if (!selectedRecords) {
            return;
        }

        const selectedTargetPersons = {};
        // pass the selected target persons for not including them in available peoples
        _.forEach(this.relationshipsListRecordsMap, (model) => {
            const targetPerson: RelationshipPersonModel = _.find(model.relationship.persons, 'target');
            selectedTargetPersons[targetPerson.id] = true;
        });

        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/switch`],
            {
                queryParams: {
                    selectedTargetIds: JSON.stringify(selectedRecords),
                    selectedPersonsIds: JSON.stringify(Object.keys(selectedTargetPersons)),
                    entityType: JSON.stringify(this.entityType)
                }
            }
        );
    }
}
