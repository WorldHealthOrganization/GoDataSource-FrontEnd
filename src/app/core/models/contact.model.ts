import * as _ from 'lodash';
import { AddressModel, AddressType } from './address.model';
import { DocumentModel } from './document.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { AgeModel } from './age.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { VaccineModel } from './vaccine.model';
import { IPermissionModel } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export interface IFollowUpHistory {
    startDate: string;
    endDate: string;
    status: string;
}

export class ContactModel extends BaseModel implements IPermissionModel {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    gender: string;
    occupation: string;
    documents: DocumentModel[];
    addresses: AddressModel[];
    riskLevel: string;
    riskReason: string;
    type: EntityType = EntityType.CONTACT;
    dateOfReporting: string;
    dateOfLastContact: string;
    isDateOfReportingApproximate: boolean;
    outbreakId: string;
    dateBecomeContact: string;
    dateBecomeCase: string;
    wasCase: boolean;
    visualId: string;

    followUp: {
        originalStartDate: string,
        startDate: string,
        endDate: string,
        status: string
    };

    followUpHistory: IFollowUpHistory[];

    dob: string;
    age: AgeModel;

    vaccinesReceived: VaccineModel[];
    pregnancyStatus: string;

    inconsistencies: InconsistencyModel[];
    relationship: any;

    matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

    /**
     * Return contact id mask with data replaced
     * @param contactIdMask
     */
    static generateContactIDMask(contactIdMask: string): string {
        // validate
        if (_.isEmpty(contactIdMask)) {
            return '';
        }

        // !!!!!!!!!!!!!!!
        // format ( IMPORTANT - NOT CASE INSENSITIVE => so yyyy won't be replaced with year, only YYYY )
        // !!!!!!!!!!!!!!!
        return contactIdMask
            .replace(/YYYY/g, moment().format('YYYY'))
            .replace(/\*/g, '');
    }

    /**
     * Static Permissions
     */
    static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_VIEW) : false; }
    static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_LIST) : false; }
    static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_CREATE) : false; }
    static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY) : false; }
    static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_DELETE) : false; }
    static canBulkCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_BULK_CREATE) : false; }
    static canListRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_LIST_RELATIONSHIP_CONTACTS) : false; }
    static canViewRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_RELATIONSHIP_CONTACTS) : false; }
    static canCreateRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_RELATIONSHIP_CONTACTS) : false; }
    static canModifyRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY_RELATIONSHIP_CONTACTS) : false; }
    static canDeleteRelationshipContacts(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_DELETE_RELATIONSHIP_CONTACTS) : false; }
    static canListRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_LIST_RELATIONSHIP_EXPOSURES) : false; }
    static canViewRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_VIEW_RELATIONSHIP_EXPOSURES) : false; }
    static canCreateRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_CREATE_RELATIONSHIP_EXPOSURES) : false; }
    static canModifyRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_MODIFY_RELATIONSHIP_EXPOSURES) : false; }
    static canDeleteRelationshipExposures(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_DELETE_RELATIONSHIP_EXPOSURES) : false; }
    static canReverseRelationship(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_REVERSE_RELATIONSHIP) : false; }
    static canShareRelationship(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.CONTACT_SHARE_RELATIONSHIPS) : false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.firstName = _.get(data, 'firstName');
        this.middleName = _.get(data, 'middleName');
        this.lastName = _.get(data, 'lastName');
        this.gender = _.get(data, 'gender');
        this.occupation = _.get(data, 'occupation');
        this.outbreakId = _.get(data, 'outbreakId');
        this.documents = _.get(data, 'documents', []);
        this.dateBecomeCase = _.get(data, 'dateBecomeCase');
        this.wasCase = _.get(data, 'wasCase', false);

        this.dob = _.get(data, 'dob');
        this.age = new AgeModel(_.get(data, 'age'));

        const locationsList = _.get(data, 'locations', []);
        this.addresses = _.map(
            _.get(data, 'addresses', []),
            (addressData) => {
                return new AddressModel(addressData, locationsList);
            }
        );

        // vaccines received
        const vaccinesReceived = _.get(data, 'vaccinesReceived');
        this.vaccinesReceived = _.map(vaccinesReceived, (vaccineData) => {
            return new VaccineModel(vaccineData);
        });
        this.pregnancyStatus = _.get(data, 'pregnancyStatus');

        this.riskLevel = _.get(data, 'riskLevel');
        this.riskReason = _.get(data, 'riskReason');
        this.dateOfReporting = _.get(data, 'dateOfReporting');
        this.dateOfLastContact = _.get(data, 'dateOfLastContact');
        this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
        this.dateBecomeContact = _.get(data, 'dateBecomeContact');
        this.visualId = _.get(data, 'visualId', '');

        this.followUp = _.get(data, 'followUp', {});
        this.followUpHistory = _.get(data, 'followUpHistory', []);

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
    canView(user: UserModel): boolean { return ContactModel.canView(user); }
    canList(user: UserModel): boolean { return ContactModel.canList(user); }
    canCreate(user: UserModel): boolean { return ContactModel.canCreate(user); }
    canModify(user: UserModel): boolean { return ContactModel.canModify(user); }
    canDelete(user: UserModel): boolean { return ContactModel.canDelete(user); }
    canBulkCreate(user: UserModel): boolean { return ContactModel.canBulkCreate(user); }
    canListRelationshipContacts(user: UserModel): boolean { return ContactModel.canListRelationshipContacts(user); }
    canViewRelationshipContacts(user: UserModel): boolean { return ContactModel.canViewRelationshipContacts(user); }
    canCreateRelationshipContacts(user: UserModel): boolean { return ContactModel.canCreateRelationshipContacts(user); }
    canModifyRelationshipContacts(user: UserModel): boolean { return ContactModel.canModifyRelationshipContacts(user); }
    canDeleteRelationshipContacts(user: UserModel): boolean { return ContactModel.canDeleteRelationshipContacts(user); }
    canListRelationshipExposures(user: UserModel): boolean { return ContactModel.canListRelationshipExposures(user); }
    canViewRelationshipExposures(user: UserModel): boolean { return ContactModel.canViewRelationshipExposures(user); }
    canCreateRelationshipExposures(user: UserModel): boolean { return ContactModel.canCreateRelationshipExposures(user); }
    canModifyRelationshipExposures(user: UserModel): boolean { return ContactModel.canModifyRelationshipExposures(user); }
    canDeleteRelationshipExposures(user: UserModel): boolean { return ContactModel.canDeleteRelationshipExposures(user); }
    canReverseRelationship(user: UserModel): boolean { return ContactModel.canReverseRelationship(user); }
    canShareRelationship(user: UserModel): boolean { return ContactModel.canShareRelationship(user); }

    /**
     * Contact Name
     * @returns {string}
     */
    get name(): string {
        const firstName = this.firstName ? this.firstName : '';
        const lastName = this.lastName ? this.lastName : '';
        return _.trim(`${firstName} ${lastName}`);
    }

    /**
     * Get the main Address
     */
    get mainAddress(): AddressModel {
        // get main address
        const mainAddress = _.find(this.addresses, {'typeId': AddressType.CURRENT_ADDRESS});
        // do we have main address? Otherwise use any address
        const address = mainAddress ? mainAddress : this.addresses[0];

        return address ? address : new AddressModel();
    }

    /**
     * Get phone numbers
     */
    get phoneNumbers(): string[] {
        return this.addresses.reduce((acc: string[], address) => {
            if (!_.isEmpty(address.phoneNumber)) {
                acc.push(address.phoneNumber);
            }
            return acc;
        }, []);
    }
}
