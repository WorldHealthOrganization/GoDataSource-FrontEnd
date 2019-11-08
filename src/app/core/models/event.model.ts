import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { IPermissionModel } from './permission.interface';

export class EventModel extends BaseModel implements IPermissionModel {
    id: string;
    name: string;
    date: string;
    dateApproximate: boolean;
    description: string;
    address: AddressModel;
    type: EntityType = EntityType.EVENT;
    dateOfReporting: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    /**
     * Static Permissions
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_DELETE) : false; }
    static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_RESTORE) : false; }
    static canCreateContact(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_CREATE_CONTACT) : false; }
    static canBulkCreateContact(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_CREATE_BULK_CONTACT) : false; }
    static canListRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_LIST_RELATIONSHIP_CONTACTS) : false; }
    static canViewRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_VIEW_RELATIONSHIP_CONTACTS) : false; }
    static canCreateRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_CREATE_RELATIONSHIP_CONTACTS) : false; }
    static canModifyRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_MODIFY_RELATIONSHIP_CONTACTS) : false; }
    static canDeleteRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_DELETE_RELATIONSHIP_CONTACTS) : false; }
    static canListRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_LIST_RELATIONSHIP_EXPOSURES) : false; }
    static canViewRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_VIEW_RELATIONSHIP_EXPOSURES) : false; }
    static canCreateRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_CREATE_RELATIONSHIP_EXPOSURES) : false; }
    static canModifyRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_MODIFY_RELATIONSHIP_EXPOSURES) : false; }
    static canDeleteRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_DELETE_RELATIONSHIP_EXPOSURES) : false; }
    static canReverseRelationship(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_REVERSE_RELATIONSHIP) : false; }
    static canListPersonsWithoutRelationships(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_WITHOUT_RELATIONSHIPS) : false; }
    static canExportRelationships(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.EVENT_EXPORT_RELATIONSHIPS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.name = _.get(data, 'name');
        this.date = _.get(data, 'date');
        this.dateApproximate = _.get(data, 'dateApproximate');
        this.description = _.get(data, 'description');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.outbreakId = _.get(data, 'outbreakId');

        // we need the object to use the custom getter that constructs the address from all fields
        const location = _.get(data, 'location');
        this.address = new AddressModel(_.get(data, 'address'), [location]);

        this.inconsistencies = _.get(data, 'inconsistencies', []);
        _.each(this.inconsistencies, (inconsistency, index) => {
            this.inconsistencies[index] = new InconsistencyModel(inconsistency);
        });

        this.relationship = _.get(data, 'relationship');

        this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
        _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
            this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
        });
    }

    /**
     * Permissions
     */
    canView(user: UserModel): boolean { return EventModel.canView(user); }
    canList(user: UserModel): boolean { return EventModel.canList(user); }
    canCreate(user: UserModel): boolean { return EventModel.canCreate(user); }
    canModify(user: UserModel): boolean { return EventModel.canModify(user); }
    canDelete(user: UserModel): boolean { return EventModel.canDelete(user); }
    canRestore(user: UserModel): boolean { return EventModel.canRestore(user); }
    canCreateContact(user: UserModel): boolean { return EventModel.canCreateContact(user); }
    canBulkCreateContact(user: UserModel): boolean { return EventModel.canBulkCreateContact(user); }
    canListRelationshipContacts(user: UserModel): boolean { return EventModel.canListRelationshipContacts(user); }
    canViewRelationshipContacts(user: UserModel): boolean { return EventModel.canViewRelationshipContacts(user); }
    canCreateRelationshipContacts(user: UserModel): boolean { return EventModel.canCreateRelationshipContacts(user); }
    canModifyRelationshipContacts(user: UserModel): boolean { return EventModel.canModifyRelationshipContacts(user); }
    canDeleteRelationshipContacts(user: UserModel): boolean { return EventModel.canDeleteRelationshipContacts(user); }
    canListRelationshipExposures(user: UserModel): boolean { return EventModel.canListRelationshipExposures(user); }
    canViewRelationshipExposures(user: UserModel): boolean { return EventModel.canViewRelationshipExposures(user); }
    canCreateRelationshipExposures(user: UserModel): boolean { return EventModel.canCreateRelationshipExposures(user); }
    canModifyRelationshipExposures(user: UserModel): boolean { return EventModel.canModifyRelationshipExposures(user); }
    canDeleteRelationshipExposures(user: UserModel): boolean { return EventModel.canDeleteRelationshipExposures(user); }
    canReverseRelationship(user: UserModel): boolean { return EventModel.canReverseRelationship(user); }
    canListPersonsWithoutRelationships(user: UserModel): boolean { return EventModel.canListPersonsWithoutRelationships(user); }
    canExportRelationships(user: UserModel): boolean { return EventModel.canExportRelationships(user); }

    get firstName(): string {
        return this.name;
    }

    get lastName(): string {
        return '';
    }

    /**
     * Get the main Address
     */
    get mainAddress(): AddressModel {
        return this.address;
    }
}
