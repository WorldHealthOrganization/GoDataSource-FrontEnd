import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { EntityType } from './entity-type';
import { InconsistencyModel } from './inconsistency.model';
import { EntityMatchedRelationshipModel } from './entity-matched-relationship.model';
import { BaseModel } from './base.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import {
  IPermissionBasic,
  IPermissionBasicBulk,
  IPermissionExportable,
  IPermissionImportable,
  IPermissionRelatedContact,
  IPermissionRelatedContactBulk,
  IPermissionRelatedRelationship,
  IPermissionRestorable
} from './permission.interface';
import { IAnswerData } from './question.model';
import { SafeHtml } from '@angular/platform-browser';
import { Moment } from '../helperClasses/localization-helper';

export class EventModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionRelatedRelationship,
    IPermissionRestorable,
    IPermissionBasicBulk,
    IPermissionImportable,
    IPermissionExportable,
    IPermissionRelatedContact,
    IPermissionRelatedContactBulk {
  id: string;
  name: string;
  date: string | Moment;
  dateApproximate: boolean;
  eventCategory: string;
  description: string;
  address: AddressModel;
  type: EntityType = EntityType.EVENT;
  dateOfReporting: string | Moment;
  isDateOfReportingApproximate: boolean;
  outbreakId: string;
  endDate: string | Moment;
  questionnaireAnswers: {
    [variable: string]: IAnswerData[];
  };

  numberOfContacts: number;
  numberOfExposures: number;

  inconsistencies: InconsistencyModel[];
  relationship: any;

  matchedDuplicateRelationships: EntityMatchedRelationshipModel[];

  // visual id
  visualId: string;

  responsibleUserId: string;
  responsibleUser: UserModel;

  // used by ui
  uiStatusForms: SafeHtml;
  alerted: boolean = false;

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_VIEW, PERMISSION.EVENT_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_DELETE) : false); }

  /**
   * Static Permissions - IPermissionEvent
   */
  static canGenerateVisualId(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_GENERATE_VISUAL_ID) : false); }

  /**
   * Static Permissions - IPermissionRestorable
   */
  static canRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_RESTORE) : false); }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(): boolean { return false; }
  static canBulkModify(): boolean { return false; }
  static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_BULK_DELETE) : false); }
  static canBulkRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.EVENT_BULK_RESTORE) : false); }

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
    this.visualId = _.get(data, 'visualId');
    this.name = _.get(data, 'name');
    this.date = _.get(data, 'date');
    this.dateApproximate = _.get(data, 'dateApproximate');
    this.eventCategory = _.get(data, 'eventCategory');
    this.description = _.get(data, 'description');
    this.dateOfReporting = _.get(data, 'dateOfReporting');
    this.isDateOfReportingApproximate = _.get(data, 'isDateOfReportingApproximate');
    this.outbreakId = _.get(data, 'outbreakId');
    this.endDate = _.get(data, 'endDate');

    this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

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
   * Permissions - IPermissionEvent
   */
  canGenerateVisualId(user: UserModel): boolean { return EventModel.canGenerateVisualId(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return EventModel.canRestore(user); }

  /**
   * Permissions - IPermissionBasicBulk
   */
  canBulkCreate(): boolean { return EventModel.canBulkCreate(); }
  canBulkModify(): boolean { return EventModel.canBulkModify(); }
  canBulkDelete(user: UserModel): boolean { return EventModel.canBulkDelete(user); }
  canBulkRestore(user: UserModel): boolean { return EventModel.canBulkRestore(user); }

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
