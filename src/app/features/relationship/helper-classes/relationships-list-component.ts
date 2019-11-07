import { ListComponent } from '../../../core/helperClasses/list-component';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { OnInit } from '@angular/core';
import { EntityType } from '../../../core/models/entity-type';
import { UserModel } from '../../../core/models/user.model';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { CaseModel } from '../../../core/models/case.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EventModel } from '../../../core/models/event.model';
import { RelationshipType } from '../../../core/enums/relationship-type.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { EntityDataService } from '../../../core/services/data/entity.data.service';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export abstract class RelationshipsListComponent extends ListComponent implements OnInit {
    // Entities Map for specific data
    entityMap: {
        [entityType: string]: {
            label: string,
            link: string,
            can: {
                [type: string]: {
                    view: (UserModel) => boolean,
                    create: (UserModel) => boolean,
                    modify: (UserModel) => boolean,
                    delete: (UserModel) => boolean
                }
            }
        }
    } = {
        [EntityType.CASE]: {
            label: 'LNG_PAGE_LIST_CASES_TITLE',
            link: '/cases',
            can: {
                contacts: {
                    view: CaseModel.canViewRelationshipContacts,
                    create: CaseModel.canCreateRelationshipContacts,
                    modify: CaseModel.canModifyRelationshipContacts,
                    delete: CaseModel.canDeleteRelationshipContacts
                },
                exposures: {
                    view: CaseModel.canViewRelationshipExposures,
                    create: CaseModel.canCreateRelationshipExposures,
                    modify: CaseModel.canModifyRelationshipExposures,
                    delete: CaseModel.canDeleteRelationshipExposures
                }
            }
        },
        [EntityType.CONTACT]: {
            label: 'LNG_PAGE_LIST_CONTACTS_TITLE',
            link: '/contacts',
            can: {
                contacts: {
                    view: ContactModel.canViewRelationshipContacts,
                    create: ContactModel.canCreateRelationshipContacts,
                    modify: ContactModel.canModifyRelationshipContacts,
                    delete: ContactModel.canDeleteRelationshipContacts
                },
                exposures: {
                    view: ContactModel.canViewRelationshipExposures,
                    create: ContactModel.canCreateRelationshipExposures,
                    modify: ContactModel.canModifyRelationshipExposures,
                    delete: ContactModel.canDeleteRelationshipExposures
                }
            }
        },
        [EntityType.EVENT]: {
            label: 'LNG_PAGE_LIST_EVENTS_TITLE',
            link: '/events',
            can: {
                contacts: {
                    view: EventModel.canViewRelationshipContacts,
                    create: EventModel.canCreateRelationshipContacts,
                    modify: EventModel.canModifyRelationshipContacts,
                    delete: EventModel.canDeleteRelationshipContacts
                },
                exposures: {
                    view: EventModel.canViewRelationshipExposures,
                    create: EventModel.canCreateRelationshipExposures,
                    modify: EventModel.canModifyRelationshipExposures,
                    delete: EventModel.canDeleteRelationshipExposures
                }
            }
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
    // route data
    relationshipType: RelationshipType;

    constructor(
        protected snackbarService: SnackbarService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService
    ) {
        super(
            snackbarService
        );
    }

    /**
     * Called when the following data is loaded:
     *      this.relationshipType
     *      this.entityType
     *      this.entityId
     *      this.selectedOutbreak
     */
    abstract onDataInitialized();

    /**
     * Called when person data is loaded (in addition to the initial data):
     *      this.entity
     */
    abstract onPersonLoaded();

    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // get relationship type
        this.route.data.subscribe((routeData) => {
            this.relationshipType = routeData.relationshipType;

            this.checkInitData();
        });

        // get person type and ID from route params
        this.route.params
            .subscribe((params: { entityType, entityId }) => {
                this.entityType = params.entityType;
                this.entityId = params.entityId;

                this.checkInitData();
            });

        // get selected outbreak
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                this.selectedOutbreak = selectedOutbreak;

                this.checkInitData();
            });
    }

    /**
     * Check if all the necessary data was loaded
     */
    private checkInitData() {
        if (
            this.relationshipType &&
            this.entityType &&
            this.entityId &&
            this.selectedOutbreak
        ) {
            // all data is loaded; let component do its job
            this.onDataInitialized();

            // load person
            this.loadPerson();
        }
    }

    /**
     * Load person data
     */
    private loadPerson() {
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

                // person data is loaded; let component do its job
                this.onPersonLoaded();
            });
    }

    /**
     * Relationships list page title, based on relationship type (Exposures or Contacts?)
     */
    get relationshipsListPageTitle(): string {
        return this.relationshipType === RelationshipType.EXPOSURE ?
            'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE' :
            'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE';
    }

    /**
     * Route path for specific relationships type (exposures or contacts)
     */
    get relationshipTypeRoutePath(): string {
        return this.relationshipType === RelationshipType.CONTACT ? 'contacts' : 'exposures';
    }

    /**
     * Check if we're allowed to view event / case / contact relationships'
     */
    get entityCanView(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].view(this.authUser);
    }

    /**
     * Check if we're allowed to create event / case / contact relationships'
     */
    get entityCanCreate(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].create(this.authUser);
    }

    /**
     * Check if we're allowed to modify event / case / contact relationships'
     */
    get entityCanModify(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].modify(this.authUser);
    }

    /**
     * Check if we're allowed to delete event / case / contact relationships'
     */
    get entityCanDelete(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].delete(this.authUser);
    }
}
