import { ListComponent } from '../../../core/helperClasses/list-component';
import { OnDestroy, OnInit } from '@angular/core';
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
import { ListHelperService } from '../../../core/services/helper/list-helper.service';
import { ContactOfContactModel } from '../../../core/models/contact-of-contact.model';

export abstract class RelationshipsListComponent extends ListComponent implements OnInit, OnDestroy {
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
                    delete: (UserModel) => boolean,
                    share: (UserModel) => boolean,
                    changeSource: (UserModel) => boolean,
                    bulkDelete: (UserModel) => boolean
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
                    delete: CaseModel.canDeleteRelationshipContacts,
                    share: CaseModel.canShareRelationship,
                    changeSource: CaseModel.canChangeSource,
                    bulkDelete: CaseModel.canBulkDeleteRelationshipContacts
                },
                exposures: {
                    view: CaseModel.canViewRelationshipExposures,
                    create: CaseModel.canCreateRelationshipExposures,
                    modify: CaseModel.canModifyRelationshipExposures,
                    delete: CaseModel.canDeleteRelationshipExposures,
                    share: CaseModel.canShareRelationship,
                    changeSource: () => false,
                    bulkDelete: CaseModel.canBulkDeleteRelationshipExposures
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
                    delete: ContactModel.canDeleteRelationshipContacts,
                    share: ContactModel.canShareRelationship,
                    changeSource: ContactModel.canChangeSource,
                    bulkDelete: ContactModel.canBulkDeleteRelationshipContacts
                },
                exposures: {
                    view: ContactModel.canViewRelationshipExposures,
                    create: ContactModel.canCreateRelationshipExposures,
                    modify: ContactModel.canModifyRelationshipExposures,
                    delete: ContactModel.canDeleteRelationshipExposures,
                    share: ContactModel.canShareRelationship,
                    changeSource: ContactModel.canChangeSource,
                    bulkDelete: ContactModel.canBulkDeleteRelationshipExposures
                }
            }
        },
        [EntityType.CONTACT_OF_CONTACT]: {
            label: 'LNG_PAGE_LIST_CONTACTS_OF_CONTACTS_TITLE',
            link: '/contacts-of-contacts',
            can: {
                exposures: {
                    view: ContactOfContactModel.canViewRelationshipExposures,
                    create: ContactOfContactModel.canCreateRelationshipExposures,
                    modify: ContactOfContactModel.canModifyRelationshipExposures,
                    delete: ContactOfContactModel.canDeleteRelationshipExposures,
                    share: ContactOfContactModel.canShareRelationship,
                    changeSource: ContactOfContactModel.canChangeSource,
                    bulkDelete: ContactOfContactModel.canBulkDeleteRelationshipExposures
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
                    delete: EventModel.canDeleteRelationshipContacts,
                    share: EventModel.canShareRelationship,
                    changeSource: EventModel.canChangeSource,
                    bulkDelete: EventModel.canBulkDeleteRelationshipContacts
                },
                exposures: {
                    view: EventModel.canViewRelationshipExposures,
                    create: EventModel.canCreateRelationshipExposures,
                    modify: EventModel.canModifyRelationshipExposures,
                    delete: EventModel.canDeleteRelationshipExposures,
                    share: EventModel.canShareRelationship,
                    changeSource: () => false,
                    bulkDelete: EventModel.canBulkDeleteRelationshipExposures
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

    /**
     * Constructor
     */
    constructor(
        protected listHelperService: ListHelperService,
        protected router: Router,
        protected route: ActivatedRoute,
        protected authDataService: AuthDataService,
        protected outbreakDataService: OutbreakDataService,
        protected entityDataService: EntityDataService
    ) {
        super(listHelperService);
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

    /**
     * Component initialized
     */
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
     * Release resources
     */
    ngOnDestroy() {
        // release parent resources
        super.ngOnDestroy();
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
                    this.listHelperService.snackbarService.showApiError(err);

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
        switch (this.relationshipType) {
            case RelationshipType.EXPOSURE:
                return 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_EXPOSURES_TITLE';
            case RelationshipType.CONTACT:
                return 'LNG_PAGE_LIST_ENTITY_RELATIONSHIPS_CONTACTS_TITLE';
        }
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

    /**
     * Check if we're allowed to share event / case / contact relationships'
     */
    get entityCanShare(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].share(this.authUser);
    }

    /**
     * Check if we're allowed to change person source of a relationship
     */
    get entityCanChangeSource(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].changeSource(this.authUser);
    }

    /**
     * Check if we're allowed to bulk delete relationships
     */
    get entityCanBulkDelete(): boolean {
        return this.entityType && this.entityMap[this.entityType] && this.entityMap[this.entityType].can[this.relationshipTypeRoutePath].bulkDelete(this.authUser);
    }
}
