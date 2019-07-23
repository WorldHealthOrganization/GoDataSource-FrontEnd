import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { RelationshipModel } from '../../../../core/models/entity-and-relationship.model';

@Component({
    selector: 'app-create-entity-relationship-bulk',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-entity-relationship-bulk.component.html',
    styleUrls: ['./create-entity-relationship-bulk.component.less']
})
export class CreateEntityRelationshipBulkComponent extends ConfirmOnFormChanges implements OnInit {

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

    // selected outbreak
    selectedOutbreak: OutbreakModel;
    // route params
    entityType: EntityType;
    entityId: string;
    entity: CaseModel | ContactModel | EventModel;
    // route data
    relationshipType: RelationshipType;

    selectedSourceIds: string[] = [];
    selectedTargetIds: string[] = [];

    relationship: RelationshipModel = new RelationshipModel();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService
    ) {
        super();
    }

    ngOnInit() {
        // get source and target persons from query params
        this.route.queryParams
            .subscribe((queryParams: { selectedSourceIds, selectedTargetIds }) => {
                if (_.isEmpty(queryParams.selectedSourceIds) || _.isEmpty(queryParams.selectedTargetIds)) {
                    this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');

                    // No source or target entities selected; navigate back to exposures list
                    this.disableDirtyConfirm();
                    this.router.navigate(['../..']);
                } else {
                    this.selectedSourceIds = JSON.parse(queryParams.selectedSourceIds);
                    this.selectedTargetIds = JSON.parse(queryParams.selectedTargetIds);
                }
            });

        // get relationship type
        this.route.data.subscribe((routeData) => {
            this.relationshipType = routeData.relationshipType;

            this.initializeBreadcrumbs();
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
    }

    private loadPerson() {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // get person data
            this.entityDataService
                .getEntity(this.entityType, this.selectedOutbreak.id, this.entityId)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showError(err.message);

                        // Entity not found; navigate back to Entities list
                        this.router.navigate([this.entityMap[this.entityType].link]);

                        return throwError(err);
                    })
                )
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
            const relationshipsListPageTitle = this.relationshipType === RelationshipType.EXPOSURE ?
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE';

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
                    relationshipsListPageTitle,
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
                ),
                new BreadcrumbItemModel(
                    assignRelationshipsPageTitle,
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/share`,
                    false,
                    {
                        selectedTargetIds: JSON.stringify(this.selectedTargetIds)
                    }
                ),
                new BreadcrumbItemModel('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_TITLE', null, true)
            ];
        }
    }

    get relationshipTypeRoutePath(): string {
        return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
    }

    /**
     * craete relationships between all the entities from sources and all entities from targets
     * the relationships will have the same data
     * @param {NgForm} form
     */
    createNewRelationships(form: NgForm) {
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // which are sources and which are targets (based on relationship type) ?
        let relationshipSources = this.selectedSourceIds;
        let relationshipTargets = this.selectedTargetIds;
        if (this.relationshipType === RelationshipType.EXPOSURE) {
            relationshipTargets = this.selectedSourceIds;
            relationshipSources = this.selectedTargetIds;
        }

        // bulk insert relationships
        const relationshipsBulkData = {
            sources: relationshipSources,
            targets: relationshipTargets,
            relationship: this.relationship
        };
        this.relationshipDataService.createBulkRelationships(this.selectedOutbreak.id, relationshipsBulkData)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showError(err.message);

                    return throwError(err);
                })
            )
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_SUCCESS_MESSAGE');

                // navigate back to root person's relationships list
                this.disableDirtyConfirm();
                this.router.navigate([`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`]);
            });

    }

}
