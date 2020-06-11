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
import { ViewModifyComponent } from '../../../../core/helperClasses/view-modify-component';
import { UserModel } from '../../../../core/models/user.model';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { RelationshipType } from '../../../../core/enums/relationship-type.enum';
import { EntityModel, RelationshipModel } from '../../../../core/models/entity-and-relationship.model';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';

@Component({
    selector: 'app-modify-entity-relationship',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './modify-entity-relationship.component.html',
    styleUrls: ['./modify-entity-relationship.component.less']
})
export class ModifyEntityRelationshipComponent extends ViewModifyComponent implements OnInit {
    // breadcrumbs
    breadcrumbs: BreadcrumbItemModel[] = [];

    // Entities Map for specific data
    entityMap: {
        [entityType: string]: {
            label: string,
            link: string,
            canList: (UserModel) => boolean,
            canView: (UserModel) => boolean,
            can: {
                [type: string]: {
                    modify: (UserModel) => boolean,
                    reverse: (UserModel) => boolean,
                    list: (UserModel) => boolean
                }
            }
        }
    } = {
        [EntityType.CASE]: {
            label: 'LNG_PAGE_LIST_CASES_TITLE',
            link: '/cases',
            canList: CaseModel.canList,
            canView: CaseModel.canView,
            can: {
                contacts: {
                    modify: CaseModel.canModifyRelationshipContacts,
                    reverse: CaseModel.canReverseRelationship,
                    list: CaseModel.canListRelationshipContacts
                },
                exposures: {
                    modify: CaseModel.canModifyRelationshipExposures,
                    reverse: CaseModel.canReverseRelationship,
                    list: CaseModel.canListRelationshipExposures
                }
            }
        },
        [EntityType.CONTACT]: {
            label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
            link: '/contacts',
            canList: ContactModel.canList,
            canView: ContactModel.canView,
            can: {
                contacts: {
                    modify: ContactModel.canModifyRelationshipContacts,
                    reverse: ContactModel.canReverseRelationship,
                    list: ContactModel.canListRelationshipContacts
                },
                exposures: {
                    modify: ContactModel.canModifyRelationshipExposures,
                    reverse: ContactModel.canReverseRelationship,
                    list: ContactModel.canListRelationshipExposures
                }
            }
        },
        [EntityType.EVENT]: {
            label: 'LNG_PAGE_LIST_EVENTS_TITLE',
            link: '/events',
            canList: EventModel.canList,
            canView: EventModel.canView,
            can: {
                contacts: {
                    modify: EventModel.canModifyRelationshipContacts,
                    reverse: EventModel.canReverseRelationship,
                    list: EventModel.canListRelationshipContacts
                },
                exposures: {
                    modify: EventModel.canModifyRelationshipExposures,
                    reverse: EventModel.canReverseRelationship,
                    list: EventModel.canListRelationshipExposures
                }
            }
        }
    };

    // authenticated user
    authUser: UserModel;
    RelationshipModel = RelationshipModel;
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
    canReverseRelation: boolean;

    // provide constants to template
    EntityModel = EntityModel;

    /**
     * Constructor
     */
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
        protected dialogService: DialogService
    ) {
        super(
            route,
            dialogService
        );
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get relationship type
        this.route.data.subscribe((routeData) => {
            this.relationshipType = routeData.relationshipType;

            this.initializeBreadcrumbs();
        });

        // show loading
        this.showLoadingDialog(false);

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
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

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

    private loadRelationship() {
        if (
            this.entityType &&
            this.entityId &&
            this.relationshipId &&
            this.selectedOutbreak
        ) {
            // show loading
            this.showLoadingDialog(false);

            // get relationship data
            this.relationshipDataService
                .getEntityRelationship(this.selectedOutbreak.id, this.entityType, this.entityId, this.relationshipId)
                .pipe(
                    catchError((err) => {
                        this.snackbarService.showApiError(err);

                        // Relationship not found; navigate back to Entity Relationships list
                        this.disableDirtyConfirm();
                        this.router.navigate([`/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`]);

                        return throwError(err);
                    })
                )
                .subscribe((relationshipData) => {
                    this.relationship = relationshipData;

                    this.canReverseRelation = !_.find(this.relationship.persons, { type : EntityType.CONTACT });

                    this.initializeBreadcrumbs();

                    // hide loading
                    this.hideLoadingDialog();
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

            // reset value
            this.breadcrumbs = [];

            // case / contact / event list page breadcrumb
            if (this.entityMap[this.entityType].canList(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    this.entityMap[this.entityType].label,
                    this.entityMap[this.entityType].link
                ));
            }

            // case / contact / event view page breadcrumb
            if (this.entityMap[this.entityType].canView(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    this.entity.name,
                    `${this.entityMap[this.entityType].link}/${this.entityId}/view`
                ));
            }

            // exposure / contacts list page
            if (this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].list(this.authUser)) {
                this.breadcrumbs.push(new BreadcrumbItemModel(
                    relationshipsListPageTitle,
                    `/relationships/${this.entityType}/${this.entityId}/${this.relationshipTypeRoutePath}`
                ));
            }

            // page breadcrumb
            this.breadcrumbs.push(new BreadcrumbItemModel(
                this.viewOnly ? 'LNG_PAGE_VIEW_RELATIONSHIP_TITLE' : 'LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_TITLE',
                null,
                true,
                {},
                relatedPerson
            ));
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

        // show loading
        this.showLoadingDialog();

        // modify the relationship
        this.relationshipDataService
            .modifyRelationship(
                this.selectedOutbreak.id,
                this.entityType,
                this.entityId,
                this.relationshipId,
                dirtyFields.relationship
            )
            .pipe(
                catchError((err) => {
                    this.snackbarService.showApiError(err);
                    // hide loading
                    this.hideLoadingDialog();
                    return throwError(err);
                })
            )
            .subscribe((relationshipData) => {
                // update model
                this.loadRelationship();

                // mark form as pristine
                form.form.markAsPristine();

                // display message
                this.snackbarService.showSuccess('LNG_PAGE_MODIFY_ENTITY_RELATIONSHIP_ACTION_MODIFY_RELATIONSHIP_SUCCESS_MESSAGE');

                // hide loading
                this.hideLoadingDialog();
            });
    }

    /**
     * Reverse relation persons(source person became target person and vice-versa)
     */
    reverseExistingRelationship() {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REVERSE_PERSONS')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    const relationshipPersons = {
                        sourceId: _.find(this.relationship.persons, {target: true}).id,
                        targetId: this.relationship.sourcePerson.id
                    };
                    this.relationshipDataService
                        .reverseExistingRelationship(
                            this.selectedOutbreak.id,
                            this.relationshipId,
                            relationshipPersons.sourceId,
                            relationshipPersons.targetId
                        )
                        .subscribe((relationshipData: RelationshipModel) => {
                            const sourcePerson = _.find(relationshipData.persons, {source: true});
                            this.router.navigate([`/relationships/${sourcePerson.type}/${sourcePerson.id}/${this.relationshipTypeRoutePath}/${relationshipData.id}/modify`]);
                        });
                }
            });
    }

    /**
     * Check if we're allowed to modify event / case / contact relationships
     */
    get entityCanModify(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].modify(this.authUser);
    }

    /**
     * Check if we're allowed to reverse relationships persons
     */
    get entityCanReverse(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].reverse(this.authUser);
    }
}
