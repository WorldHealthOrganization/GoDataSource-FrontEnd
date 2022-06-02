import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { Moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import { IPermissionBasic, IPermissionExportable, IPermissionImportable, IPermissionRelatedContact, IPermissionRelatedContactBulk, IPermissionRelatedRelationship, IPermissionRestorable } from './permission.interface';
import { V2AdvancedFilter, V2AdvancedFilterType } from '../../shared/components-v2/app-list-table-v2/models/advanced-filter.model';
import { ILabelValuePairModel } from '../../shared/forms-v2/core/label-value-pair.model';

export class EventModel
  extends BaseModel
  implements
        IPermissionBasic,
        IPermissionRelatedRelationship,
        IPermissionRestorable,
        IPermissionImportable,
        IPermissionExportable,
        IPermissionRelatedContact,
        IPermissionRelatedContactBulk {
  id: string;
  name: string;
  date: string | Moment;
  dateApproximate: boolean;
  description: string;
  address: AddressModel;
  type: EntityType = EntityType.EVENT;
  dateOfReporting: string | Moment;
  isDateOfReportingApproximate: boolean;
  outbreakId: string;

  numberOfContacts: number;
  numberOfExposures: number;

  inconsistencies: InconsistencyModel[];
  relationship: any;

  matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

  responsibleUserId: string;
  responsibleUser: UserModel;

  /**
   * Advanced filters
   */
  static generateAdvancedFilters(data: {
    options: {
      user: ILabelValuePairModel[]
    }
  }): V2AdvancedFilter[] {
    // initialize
    const advancedFilters: V2AdvancedFilter[] = [
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'name',
        label: 'LNG_EVENT_FIELD_LABEL_NAME',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'date',
        label: 'LNG_EVENT_FIELD_LABEL_DATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.TEXT,
        field: 'description',
        label: 'LNG_EVENT_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.ADDRESS,
        field: 'address',
        label: 'LNG_ADDRESS_FIELD_LABEL_ADDRESS_LINE_1',
        isArray: false
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'dateOfReporting',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING'
      },
      {
        type: V2AdvancedFilterType.RANGE_DATE,
        field: 'isDateOfReportingApproximate',
        label: 'LNG_EVENT_FIELD_LABEL_DATE_OF_REPORTING_APPROXIMATE',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfContacts',
        label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_CONTACTS',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.RANGE_NUMBER,
        field: 'numberOfExposures',
        label: 'LNG_EVENT_FIELD_LABEL_NUMBER_OF_EXPOSURES',
        sortable: true
      },
      {
        type: V2AdvancedFilterType.MULTISELECT,
        field: 'responsibleUserId',
        label: 'LNG_EVENT_FIELD_LABEL_RESPONSIBLE_USER_ID',
        options: data.options.user
      }
    ];

    // finished
    return advancedFilters;
  }

  /**
     * Static Permissions - IPermissionBasic
     */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW, PERMISSION.EVENT_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_DELETE) : false); }

  /**
     * Static Permissions - IPermissionRestorable
     */
  static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_RESTORE) : false); }

  /**
     * Static Permissions - IPermissionImportable
     */
  static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_IMPORT) : false); }

  /**
     * Static Permissions - IPermissionExportable
     */
  static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_EXPORT) : false); }

  /**
     * Static Permissions - IPermissionRelatedContact
     */
  static canCreateContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE_CONTACT) : false); }

  /**
     * Static Permissions - IPermissionRelatedContactBulk
     */
  static canBulkCreateContact(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE_BULK_CONTACT) : false); }

  /**
     * Static Permissions - IPermissionRelatedRelationship
     */
  static canListRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_LIST_RELATIONSHIP_CONTACTS) : false); }
  static canViewRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW_RELATIONSHIP_CONTACTS) : false); }
  static canCreateRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE_RELATIONSHIP_CONTACTS) : false); }
  static canModifyRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_MODIFY_RELATIONSHIP_CONTACTS) : false); }
  static canDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_DELETE_RELATIONSHIP_CONTACTS) : false); }
  static canListRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_LIST_RELATIONSHIP_EXPOSURES) : false); }
  static canViewRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW_RELATIONSHIP_EXPOSURES) : false); }
  static canCreateRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE_RELATIONSHIP_EXPOSURES) : false); }
  static canModifyRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_MODIFY_RELATIONSHIP_EXPOSURES) : false); }
  static canDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_DELETE_RELATIONSHIP_EXPOSURES) : false); }
  static canReverseRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_REVERSE_RELATIONSHIP) : false); }
  static canListPersonsWithoutRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_WITHOUT_RELATIONSHIPS) : false); }
  static canExportRelationships(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_EXPORT_RELATIONSHIPS) : false); }
  static canShareRelationship(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_SHARE_RELATIONSHIPS) : false); }
  static canChangeSource(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CHANGE_SOURCE_RELATIONSHIP) : false); }
  static canBulkDeleteRelationshipExposures(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_BULK_DELETE_RELATIONSHIP_EXPOSURES) : false); }
  static canBulkDeleteRelationshipContacts(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_BULK_DELETE_RELATIONSHIP_CONTACTS) : false); }

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

    this.numberOfContacts = _.get(data, 'numberOfContacts');
    this.numberOfExposures = _.get(data, 'numberOfExposures');

    // we need the object to use the custom getter that constructs the address from all fields
    const location = _.get(data, 'location');
    this.address = new AddressModel(
      _.get(data, 'address'),
      location ? {
        [location.id]: location
      } : undefined
    );

    this.inconsistencies = _.get(data, 'inconsistencies', []);
    _.each(this.inconsistencies, (inconsistency, index) => {
      this.inconsistencies[index] = new InconsistencyModel(inconsistency);
    });

    this.relationship = _.get(data, 'relationship');

    this.matchedDuplicateRelationships = _.get(data, 'matchedDuplicateRelationships', []);
    _.each(this.matchedDuplicateRelationships, (matchedRelationship, index) => {
      this.matchedDuplicateRelationships[index] = new EntityMatchedRelationshipModel(matchedRelationship);
    });

    this.responsibleUserId = _.get(data, 'responsibleUserId');
    this.responsibleUser = _.get(data, 'responsibleUser');
    if (this.responsibleUser) {
      this.responsibleUser = new UserModel(this.responsibleUser);
    }
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return EventModel.canView(user); }
  canList(user: UserModel): boolean { return EventModel.canList(user); }
  canCreate(user: UserModel): boolean { return EventModel.canCreate(user); }
  canModify(user: UserModel): boolean { return EventModel.canModify(user); }
  canDelete(user: UserModel): boolean { return EventModel.canDelete(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return EventModel.canRestore(user); }

  /**
     * Permissions - IPermissionImportable
     */
  canImport(user: UserModel): boolean { return EventModel.canImport(user); }

  /**
     * Permissions - IPermissionExportable
     */
  canExport(user: UserModel): boolean { return EventModel.canExport(user); }

  /**
     * Permissions - IPermissionRelatedContact
     */
  canCreateContact(user: UserModel): boolean { return EventModel.canCreateContact(user); }

  /**
     * Permissions - IPermissionRelatedContactBulk
     */
  canBulkCreateContact(user: UserModel): boolean { return EventModel.canBulkCreateContact(user); }

  /**
     * Permissions - IPermissionRelatedRelationship
     */
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
  canShareRelationship(user: UserModel): boolean { return EventModel.canShareRelationship(user); }
  canChangeSource(user: UserModel): boolean { return EventModel.canChangeSource(user); }
  canBulkDeleteRelationshipExposures(user: UserModel): boolean { return EventModel.canBulkDeleteRelationshipExposures(user); }
  canBulkDeleteRelationshipContacts(user: UserModel): boolean { return EventModel.canBulkDeleteRelationshipContacts(user); }

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
