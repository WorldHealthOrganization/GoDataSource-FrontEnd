import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { RequestQueryBuilder } from '../../../../core/helperClasses/request-query-builder';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import 'rxjs/add/operator/filter';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';

@Component({
    selector: 'app-create-entity-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-entity-relationship.component.html',
    styleUrls: ['./create-entity-relationship.component.less']
})
export class CreateEntityRelationshipComponent extends ConfirmOnFormChanges implements OnInit {

    breadcrumbs: BreadcrumbItemModel[] = [
        new BreadcrumbItemModel('LNG_PAGE_LIST_CASES_TITLE', '/cases'),
    ];

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

    selectedEntityIds: string[];
    selectedEntities: (CaseModel|ContactModel|EventModel)[];

    relationships: RelationshipModel[] = [];

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

        this.route.queryParams
            .subscribe((queryParams: {selectedEntityIds}) => {
                if (_.isEmpty(queryParams.selectedEntityIds)) {
                    this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');

                    // No entities selected; navigate back to Available Entities list
                    this.router.navigate(['..', 'available-entities']);
                } else {
                    this.selectedEntityIds = JSON.parse(queryParams.selectedEntityIds);

                    this.refreshSelectedEntitiesList();
                }
            });

        this.route.params
            .subscribe((params: {entityType, entityId}) => {
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

                        this.refreshSelectedEntitiesList();

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
                                    new BreadcrumbItemModel('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_TITLE', null, true)
                                );
                            });
                    });
            });
    }

    /**
     * (Re)-Load the list of persons selected to be related with current entity
     */
    refreshSelectedEntitiesList() {
        if (!this.outbreakId || _.isEmpty(this.selectedEntityIds)) {
            return;
        }

        // retrieve all selected entities
        const qb = new RequestQueryBuilder();
        qb.filter.where({
            id: {
                inq: this.selectedEntityIds
            }
        });

        this.entityDataService
            .getEntitiesList(this.outbreakId, qb)
            .subscribe((entities) => {
                this.selectedEntities = entities;

                this.relationships = [];
                _.each(this.selectedEntities, () => {
                    this.relationships.push(new RelationshipModel());
                });
            });
    }

    createNewRelationship(form: NgForm) {

        // get forms fields
        const fields = this.formHelper.getFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // create a separate observable for each Relationship that needs to be created
        // and execute all observables at once
        const createRelationships$: Observable<any>[] = [];

        _.each(fields.relationships, (relationship) => {
            const relatedEntityId = _.get(relationship, 'relatedEntityId');
            const relationshipData = _.get(relationship, 'relationship');

            // add related entity ID
            relationshipData.persons.push({
                id: relatedEntityId
            });

            // create observable
            createRelationships$.push(
                this.relationshipDataService
                    .createRelationship(
                        this.outbreakId,
                        this.entityType,
                        this.entityId,
                        relationshipData
                    )
            );
        });

        return Observable.forkJoin(createRelationships$)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                if (createRelationships$.length > 0) {
                    // multiple relationships
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_MULTIPLE_RELATIONSHIP_SUCCESS_MESSAGE');
                } else {
                    // single relationship
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');
                }

                // navigate to listing page
                this.router.navigate([`/relationships/${this.entityType}/${this.entityId}`]);
            });
    }

}
