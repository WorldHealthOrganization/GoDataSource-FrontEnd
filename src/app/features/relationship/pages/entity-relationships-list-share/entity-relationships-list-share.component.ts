import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { Observable } from 'rxjs/Observable';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { Constants } from '../../../../core/models/constants';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { EntityType } from '../../../../core/models/entity-type';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { UserModel, UserSettings } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { VisibleColumnModel } from '../../../../shared/components/side-columns/model';
import { NgForm } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'app-entity-relationships-list-share',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './entity-relationships-list-share.component.html',
    styleUrls: ['./entity-relationships-list-share.component.less']
})
export class EntityRelationshipsListShareComponent extends ListComponent implements OnInit {

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

    // selected outbreak ID
    outbreakId: string;

    // route params
    entityType: EntityType;
    entityId: string;

    // list of relationships
    relationshipsList$: Observable<RelationshipModel[]>;
    relationshipsListCount$: Observable<any>;

    // list of certainty levels
    certaintyLevelList$: Observable<any>;

    // list of exposure types
    exposureTypeList$: Observable<any>;

    // list of exposures frequency
    exposuresFrequencyList$: Observable<any>;

    // list of exposures durations
    exposureDurationList$: Observable<any>;

    // list of relationships
    relationshipTypeList$: Observable<any>;

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
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super(
            snackbarService
        );
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.certaintyLevelList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL);
        this.exposureTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE);
        this.exposuresFrequencyList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY);
        this.exposureDurationList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION);
        this.relationshipTypeList$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION);

        this.route.params
            .subscribe((params: { entityType, entityId }) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;

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
                        // ...and re-load the list when the Selected Outbreak is changed
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
                            .subscribe((entityData: CaseModel | ContactModel | EventModel) => {
                                // add new breadcrumb: Entity Modify page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        entityData.name,
                                        `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                                    )
                                );
                                // add new breadcrumb: page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_SHARE_RELATIONSHIPS_TITLE', null, true)
                                );
                            });
                    });
            });

        // initialize Side Table Columns
        this.initializeSideTableColumns();
    }

    /**
     * Initialize Side Table Columns
     */
    initializeSideTableColumns() {
        // default table columns
        this.tableColumns = [
            new VisibleColumnModel({
                field: 'checkbox',
                label: ''
            }),
            new VisibleColumnModel({
                field: 'people.firstName',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_FIRST_NAME'
            }),
            new VisibleColumnModel({
                field: 'people.lastName',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_PERSON_LAST_NAME'
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
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_FREQUENCY'
            }),
            new VisibleColumnModel({
                field: 'exposureDurationId',
                label: 'LNG_RELATIONSHIP_FIELD_LABEL_EXPOSURE_DURATION'
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
        if (this.outbreakId && this.entityType && this.entityId) {

            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.merge(this.queryBuilder);

            const peopleQueryBuilder = qb.include('people');
            peopleQueryBuilder.queryBuilder.filter.where({
                id: {
                    neq: this.entityId
                }
            }, true);

            // retrieve the list of Relationships
            this.relationshipsList$ = this.relationshipDataService.getEntityRelationships(
                this.outbreakId,
                this.entityType,
                this.entityId,
                qb
            );
        }
    }

    /**
     * Get total number of items, based on the applied filters
     */
    refreshListCount() {
        if (this.outbreakId && this.entityType && this.entityId) {

            // include related people in response
            const qb = new RequestQueryBuilder();
            qb.merge(this.queryBuilder);

            const peopleQueryBuilder = qb.include('people');
            peopleQueryBuilder.queryBuilder.filter.where({
                id: {
                    neq: this.entityId
                }
            }, true);

            // remove paginator from query builder
            const countQueryBuilder = _.cloneDeep(qb);
            countQueryBuilder.paginator.clear();
            this.relationshipsListCount$ = this.relationshipDataService.getEntityRelationshipsCount(
                this.outbreakId,
                this.entityType,
                this.entityId,
                countQueryBuilder
            );
        }
    }

    selectEntities(form: NgForm) {
        // get list of follow-ups that we want to modify
        const selectedRecords: false | string[] = this.validateCheckedRecords();
        if (!selectedRecords) {
            return;
        }

        // redirect to next step
        this.router.navigate(
            [`/relationships/${this.entityType}/${this.entityId}/assign`],
            {
                queryParams: {
                    selectedTargetIds: JSON.stringify(selectedRecords)
                }
            }
        );
    }

}