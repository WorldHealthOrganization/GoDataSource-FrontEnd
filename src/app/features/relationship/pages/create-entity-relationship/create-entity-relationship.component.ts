import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm, NgModel } from '@angular/forms';
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
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { Observable } from 'rxjs';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components';
import { GroupBase } from '../../../../shared/xt-forms/core';
import { v4 as uuid } from 'uuid';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { ReferenceDataCategory } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ClusterDataService } from '../../../../core/services/data/cluster.data.service';
import { catchError, share } from 'rxjs/operators';
import { throwError, forkJoin } from 'rxjs';

@Component({
    selector: 'app-create-entity-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './create-entity-relationship.component.html',
    styleUrls: ['./create-entity-relationship.component.less']
})
export class CreateEntityRelationshipComponent extends ConfirmOnFormChanges implements OnInit {
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

    selectedEntityIds: string[];
    selectedEntities: (CaseModel | ContactModel | EventModel)[];

    relationships: RelationshipModel[] = [];
    relationshipsIds: string[] = [];

    // reference data
    certaintyLevelOptions$: Observable<any[]>;
    exposureTypeOptions$: Observable<any[]>;
    exposureFrequencyOptions$: Observable<any[]>;
    exposureDurationOptions$: Observable<any[]>;
    socialRelationshipOptions$: Observable<any[]>;
    clusterOptions$: Observable<any[]>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private dialogService: DialogService,
        private clusterDataService: ClusterDataService,
        private referenceDataDataService: ReferenceDataDataService
    ) {
        super();
    }

    ngOnInit() {
        // reference data
        this.certaintyLevelOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CERTAINTY_LEVEL).pipe(share());
        this.exposureTypeOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_TYPE).pipe(share());
        this.exposureFrequencyOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_FREQUENCY).pipe(share());
        this.exposureDurationOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.EXPOSURE_DURATION).pipe(share());
        this.socialRelationshipOptions$ = this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.CONTEXT_OF_TRANSMISSION).pipe(share());

        // get selected persons from query params
        this.route.queryParams
            .subscribe((queryParams: { selectedEntityIds }) => {
                if (_.isEmpty(queryParams.selectedEntityIds)) {
                    this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');

                    // No entities selected; navigate back to Available Entities list
                    this.disableDirtyConfirm();
                    this.router.navigate(['..', 'available-entities']);
                } else {
                    this.selectedEntityIds = JSON.parse(queryParams.selectedEntityIds);

                    this.refreshSelectedEntitiesList();
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

                // get clusters list
                this.clusterOptions$ = this.clusterDataService.getClusterList(this.selectedOutbreak.id).pipe(share());

                this.loadPerson();
            });
    }

    private loadPerson() {
        if (
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            this.refreshSelectedEntitiesList();

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
                    'LNG_PAGE_LIST_AVAILABLE_ENTITIES_FOR_RELATIONSHIP_TITLE',
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}/available-entities`
                ),
                new BreadcrumbItemModel('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_TITLE', null, true)
            ];
        }
    }

    get relationshipTypeRoutePath(): string {
        return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
    }

    /**
     * (Re)-Load the list of persons selected to be related with current entity
     */
    refreshSelectedEntitiesList() {
        if (!this.selectedOutbreak || _.isEmpty(this.selectedEntityIds)) {
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
            .getEntitiesList(this.selectedOutbreak.id, qb)
            .subscribe((entities) => {
                this.selectedEntities = entities;

                this.relationships = [];
                this.relationshipsIds = [];
                _.each(this.selectedEntities, () => {
                    this.relationships.push(new RelationshipModel());
                    this.relationshipsIds.push(uuid());
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
            const relatedEntityType = _.get(relationship, 'relatedEntityType');
            const relationshipData = _.get(relationship, 'relationship');

            // get the source and target persons
            let sourcePersonType = this.entityType;
            let sourcePersonId = this.entityId;
            let targetPersonId = relatedEntityId;

            if (this.relationshipType === RelationshipType.EXPOSURE) {
                // we are adding an exposure; swap source and target persons
                sourcePersonType = relatedEntityType;
                sourcePersonId = relatedEntityId;
                targetPersonId = this.entityId;
            }

            // add related entity ID
            relationshipData.persons.push({
                id: targetPersonId
            });

            // create observable
            createRelationships$.push(
                this.relationshipDataService
                    .createRelationship(
                        this.selectedOutbreak.id,
                        sourcePersonType,
                        sourcePersonId,
                        relationshipData
                    )
            );
        });

        return forkJoin(createRelationships$)
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    return throwError(err);
                })
            )
            .subscribe(() => {
                if (createRelationships$.length > 1) {
                    // multiple relationships
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_MULTIPLE_RELATIONSHIP_SUCCESS_MESSAGE');
                } else {
                    // single relationship
                    this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_ACTION_CREATE_RELATIONSHIP_SUCCESS_MESSAGE');
                }

                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate([`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`]);
            });
    }

    /**
     * Check if an object has empty values
     * @param object
     */
    private isEmptyObject(object): boolean {
        return _.every(
            object,
            (value) => {
                return _.isObject(value) ?
                    this.isEmptyObject(value) :
                    (!_.isNumber(value) && _.isEmpty(value));
            }
        );
    }

    /**
     * Copy value from current record to all the other records
     * @param property
     * @param sourceRelationship
     * @param form
     */
    copyValueToEmptyFields(
        property: string,
        sourceRelationship: RelationshipModel,
        form: NgForm
    ) {
        // handle remove item confirmation
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_COPY_VALUE')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // copy values
                    _.each(
                        this.relationships,
                        (relationship: RelationshipModel) => {
                            // if it is a number then it means that it has a value... ( we need to do this because _.isEmpty doesn't work for numbers )
                            // right now we don't have numbers, but we might in teh future..for example for ZIP codes etc which might break the code
                            const value: any = _.get(relationship, property);
                            if (
                                relationship !== sourceRelationship &&
                                !_.isNumber(value) && (
                                    _.isEmpty(value) || (
                                        _.isObject(value) &&
                                        this.isEmptyObject(value)
                                    )
                                )
                            ) {
                                // clone for arrays, because if we put the same object it will cause issues if we want to change something
                                // clone works for strings & numbers
                                _.set(relationship, property, _.cloneDeep(_.get(sourceRelationship, property)));
                            }
                        }
                    );

                    // validate groups
                    if (form) {
                        // wait for binding to take effect
                        setTimeout(() => {
                            const formDirectives = _.get(form, '_directives', []);
                            _.forEach(formDirectives, (ngModel: NgModel) => {
                                if (
                                    ngModel.valueAccessor &&
                                    ngModel.valueAccessor instanceof GroupBase
                                ) {
                                    ngModel.valueAccessor.validateGroup();
                                }
                            });
                        });
                    }
                }
            });
    }

    /**
     * Remove relationship
     * @param index
     */
    removeRelationship(index: number) {
        // handle remove item confirmation
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REMOVE_RELATIONSHIP')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.selectedEntities.splice(index, 1);
                    this.relationships.splice(index, 1);
                    this.relationshipsIds.splice(index, 1);
                }
            });
    }
}
