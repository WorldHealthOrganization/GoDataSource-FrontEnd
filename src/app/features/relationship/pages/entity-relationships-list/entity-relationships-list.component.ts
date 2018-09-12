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
import { UserModel } from '../../../../core/models/user.model';
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

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private authDataService: AuthDataService,
        private entityDataService: EntityDataService,
        private relationshipDataService: RelationshipDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private referenceDataDataService: ReferenceDataDataService,
        private dialogService: DialogService
    ) {
        super();
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
                                        `${this.entityMap[this.entityType].link}/${this.entityId}/modify`
                                    )
                                );
                                // add new breadcrumb: page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE', null, true)
                                );
                            });
                    });
            });
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

    hasEntityWriteAccess(): boolean {
        return this.authUser.hasPermissions(this.entityMap[this.entityType].writePermission);
    }

    /**
     * Get the list of table columns to be displayed
     * @returns {string[]}
     */
    getTableColumns(): string[] {
        const columns = [
            'firstName', 'lastName', 'contactDate', 'certaintyLevelId', 'exposureTypeId',
            'exposureFrequencyId', 'exposureDurationId', 'socialRelationshipTypeId', 'actions'
        ];

        return columns;
    }

    /**
     * Delete a relationship for current Entity
     * @param {RelationshipModel} relationshipModel
     */
    deleteRelationship(relationshipModel: RelationshipModel) {
        // get related entity
        const relatedEntityModel = _.get(relationshipModel.relatedEntity(this.entityId), 'model', {});
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_RELATIONSHIP', relatedEntityModel)
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete relationship
                    this.relationshipDataService
                        .deleteRelationship(this.outbreakId, this.entityType, this.entityId, relationshipModel.id)
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
