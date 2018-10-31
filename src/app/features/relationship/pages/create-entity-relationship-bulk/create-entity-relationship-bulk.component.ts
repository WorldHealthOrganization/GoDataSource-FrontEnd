import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbItemModel } from '../../../../shared/components/breadcrumbs/breadcrumb-item.model';
import { CaseModel } from '../../../../core/models/case.model';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';
import { ActivatedRoute, Router } from '@angular/router';
import { FormHelperService } from '../../../../core/services/helper/form-helper.service';
import { NgForm, NgModel } from '@angular/forms';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { OutbreakDataService } from '../../../../core/services/data/outbreak.data.service';
import { OutbreakModel } from '../../../../core/models/outbreak.model';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import * as _ from 'lodash';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import 'rxjs/add/operator/filter';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { RelationshipModel } from '../../../../core/models/relationship.model';
import 'rxjs/add/observable/forkJoin';
import { ConfirmOnFormChanges } from '../../../../core/services/guards/page-change-confirmation-guard.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';

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

    // selected outbreak ID
    outbreakId: string;
    // route params
    entityType: EntityType;
    entityId: string;

    relationship: RelationshipModel = new RelationshipModel();
    selectedSourceIds: string[] = [];
    selectedTargetIds: string[] = [];


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
            .subscribe((queryParams: { selectedSourceIds, selectedTargetIds }) => {
                // bulk insert of relationships
                if (!_.isEmpty(queryParams.selectedSourceIds) && !_.isEmpty(queryParams.selectedTargetIds)) {
                    // bulk insert
                    this.selectedSourceIds = JSON.parse(queryParams.selectedSourceIds);
                    this.selectedTargetIds = JSON.parse(queryParams.selectedTargetIds);
                } else {

                    this.snackbarService.showError('LNG_PAGE_CREATE_ENTITY_ERROR_NO_SELECTED_ENTITIES');

                    // No entities selected; navigate back to Available Entities list
                    this.disableDirtyConfirm();
                    this.router.navigate(['..', 'assign']);
                }
            });

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

                        // get entity data
                        this.entityDataService
                            .getEntity(this.entityType, this.outbreakId, this.entityId)
                            .catch((err) => {
                                this.snackbarService.showError(err.message);

                                // Entity not found; navigate back to Entities list
                                this.disableDirtyConfirm();
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
                                // add new breadcrumb: Entity Relationships list
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_LIST_ENTITY_SHARE_RELATIONSHIPS_TITLE',
                                        `/relationships/${this.entityType}/${this.entityId}/share`
                                    )
                                );
                                // add new breadcrumb: page title
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_TITLE', null, true)
                                );
                            });
                    });
            });
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
        // bulk insert relationships
        const relationshipsBulkData = {sources: [], targets: [], relationship: {}};
        relationshipsBulkData.sources = this.selectedSourceIds;
        relationshipsBulkData.targets = this.selectedTargetIds;
        relationshipsBulkData.relationship = this.relationship;
        this.relationshipDataService.createBulkRelationships(this.outbreakId, relationshipsBulkData)
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_CREATE_ENTITY_RELATIONSHIP_BULK_SUCCESS_MESSAGE');
                // navigate to listing page
                this.disableDirtyConfirm();
                this.router.navigate([`/relationships/${this.entityType}/${this.entityId}`]);
            });

    }

}
