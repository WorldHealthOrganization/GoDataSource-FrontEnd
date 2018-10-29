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
import { RelationshipModel } from '../../../../core/models/relationship.model';
import { RelationshipDataService } from '../../../../core/services/data/relationship.data.service';
import { EntityType } from '../../../../core/models/entity-type';
import { ContactModel } from '../../../../core/models/contact.model';
import { EventModel } from '../../../../core/models/event.model';
import { EntityDataService } from '../../../../core/services/data/entity.data.service';
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { PERMISSION } from '../../../../core/models/permission.model';

@Component({
    selector: 'app-modify-entity-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-entity-relationship.component.html',
    styleUrls: ['./modify-entity-relationship.component.less']
})
export class ModifyEntityRelationshipComponent extends ViewModifyComponent implements OnInit {

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
    relationshipId: string;
    authUser: UserModel;

    relationshipData: RelationshipModel = new RelationshipModel();

    constructor(
        private router: Router,
        protected route: ActivatedRoute,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private authDataService: AuthDataService
    ) {
        super(route);
    }

    ngOnInit() {
        this.authUser = this.authDataService.getAuthenticatedUser();

        this.route.params
            .subscribe((params: {entityType, entityId, relationshipId}) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;
                this.relationshipId = params.relationshipId;

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
                            .subscribe((entityData: CaseModel|ContactModel|EventModel) => {
                                // add new breadcrumb: Entity Modify page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        entityData.name,
                                        `${this.entityMap[this.entityType].link}/${this.entityId}/modify`
                                    )
                                );
                                // add new breadcrumb: Relationships list page
                                this.breadcrumbs.push(
                                    new BreadcrumbItemModel(
                                        'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_TITLE',
                                        `/relationships/${this.entityType}/${this.entityId}`
                                    )
                                );

                                // get relationship data
                                this.relationshipDataService
                                    .getEntityRelationship(this.outbreakId, this.entityType, this.entityId, this.relationshipId)
                                    .catch((err) => {
                                        this.snackbarService.showError(err.message);

                                        // Relationship not found; navigate back to Entity Relationships list
                                        this.disableDirtyConfirm();
                                        this.router.navigate([`/relationships/${this.entityType}/${this.entityId}`]);

                                        return ErrorObservable.create(err);
                                    })
                                    .subscribe((relationshipData) => {
                                        this.relationshipData = relationshipData;

                                        // get related entity
                                        const relatedEntityModel = _.get(relationshipData.relatedEntity(this.entityId), 'model', {});

                                        // add new breadcrumb: page title
                                        this.breadcrumbs.push(
                                            new BreadcrumbItemModel(
                                                this.viewOnly ? 'LNG_PAGE_VIEW_RELATIONSHIP_TITLE' : 'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE',
                                                null,
                                                true,
                                                {},
                                                relatedEntityModel
                                            )
                                        );
                                    });

                            });
                    });
            });
    }

    modifyRelationship(form: NgForm) {

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        if (!this.formHelper.validateForm(form)) {
            return;
        }

        // modify the relationship
        this.relationshipDataService
            .modifyRelationship(
                this.outbreakId,
                this.entityType,
                this.entityId,
                this.relationshipId,
                dirtyFields.relationship
            )
            .catch((err) => {
                this.snackbarService.showError(err.message);

                return ErrorObservable.create(err);
            })
            .subscribe(() => {
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

                // navigate back to Entity Relationships list
                this.disableDirtyConfirm();
                this.router.navigate([`/relationships/${this.entityType}/${this.entityId}`]);
            });
    }

    /**
     * Check if we have access to create a contact
     * @returns {boolean}
     */
    hasContactWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_CONTACT);
    }

}
