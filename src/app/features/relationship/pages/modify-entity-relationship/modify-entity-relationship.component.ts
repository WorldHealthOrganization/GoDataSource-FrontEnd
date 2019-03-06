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
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';

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
    relationshipId: string;
    relationship: RelationshipModel = new RelationshipModel();
    // route data
    relationshipType: RelationshipType;

    constructor(
        protected route: ActivatedRoute,
        private router: Router,
        private entityDataService: EntityDataService,
        private outbreakDataService: OutbreakDataService,
        private genericDataService: GenericDataService,
        private snackbarService: SnackbarService,
        private formHelper: FormHelperService,
        private relationshipDataService: RelationshipDataService,
        private authDataService: AuthDataService,
        private dialogService: DialogService
    ) {
        super(route);
    }

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get relationship type
        this.route.data.subscribe((routeData) => {
            this.relationshipType = routeData.relationshipType;

            this.initializeBreadcrumbs();
        });

        // get person type and ID from route params
        this.route.params
            .subscribe((params: { entityType, entityId, relationshipId }) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;
                this.relationshipId = params.relationshipId;

                this.loadPerson();
                this.loadRelationship();
            });

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.loadPerson();
                this.loadRelationship();
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

    private loadRelationship() {
        if (
            this.entityType &&
            this.entityId &&
            this.relationshipId &&
            this.selectedOutbreak
        ) {
            // get relationship data
            this.relationshipDataService
                .getEntityRelationship(this.selectedOutbreak.id, this.entityType, this.entityId, this.relationshipId)
                .catch((err) => {
                    this.snackbarService.showError(err.message);

                    // Relationship not found; navigate back to Entity Relationships list
                    this.disableDirtyConfirm();
                    this.router.navigate([`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`]);

                    return ErrorObservable.create(err);
                })
                .subscribe((relationshipData) => {
                    this.relationship = relationshipData;

                    this.initializeBreadcrumbs();
                });
        }
    }

    private initializeBreadcrumbs() {
        if (
            this.relationshipType &&
            this.entity &&
            this.relationship
        ) {
            // add new breadcrumb: page title
            const relationshipsListPageTitle = this.relationshipType === RelationshipType.EXPOSURE ?
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
                'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE';

            // get related person
            const relatedPerson = _.get(this.relationship.relatedEntity(this.entityId), 'model', {});

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
                    this.viewOnly ? 'LNG_PAGE_VIEW_RELATIONSHIP_TITLE' : 'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE',
                    null,
                    true,
                    {},
                    relatedPerson
                )
            ];
        }
    }

    get relationshipTypeRoutePath(): string {
        return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
    }

    modifyRelationship(form: NgForm) {
        if (!this.formHelper.validateForm(form)) {
            return;
        }

        const dirtyFields: any = this.formHelper.getDirtyFields(form);

        // modify the relationship
        const loadingDialog = this.dialogService.showLoadingDialog();
        this.relationshipDataService
            .modifyRelationship(
                this.selectedOutbreak.id,
                this.entityType,
                this.entityId,
                this.relationshipId,
                dirtyFields.relationship
            )
            .catch((err) => {
                this.snackbarService.showError(err.message);
                loadingDialog.close();
                return ErrorObservable.create(err);
            })
            .subscribe((relationshipData) => {
                // update model
                this.loadRelationship();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

                // hide dialog
                loadingDialog.close();
            });
    }

    /**
     * Check if the authenticated user has WRITE access for the current person type
     */
    hasEntityWriteAccess(): boolean {
        return this.authUser.hasPermissions(this.entityMap[this.entityType].writePermission);
    }

}
