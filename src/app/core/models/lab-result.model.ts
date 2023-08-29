import * as _ from 'lodash';
import { BaseModel } from './base.model';
import { CaseModel } from './case.model';
import { ContactModel } from './contact.model';
import { ContactOfContactModel } from './contact-of-contact.model';
import { EntityType } from './entity-type';
import { LabResultSequenceModel } from './lab-result-sequence.model';
import { OutbreakModel } from './outbreak.model';
import {
  IPermissionBasic,
  IPermissionBasicBulk,
  IPermissionExportable,
  IPermissionImportable,
  IPermissionRestorable
} from './permission.interface';
import { PERMISSION } from './permission.model';
import { IAnswerData } from './question.model';
import { UserModel } from './user.model';
import { Moment } from '../helperClasses/x-moment';
import { SafeHtml } from '@angular/platform-browser';
import { Constants } from './constants';

export class LabResultModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionRestorable,
    IPermissionBasicBulk,
    IPermissionImportable,
    IPermissionExportable {
  id: string;
  sampleIdentifier: string;
  dateSampleTaken: string | Moment;
  dateSampleDelivered: string | Moment;
  dateTesting: string | Moment;
  dateOfResult: string | Moment;
  labName: string;
  sampleType: string;
  testType: string;
  result: string;
  notes: string;
  status: string;
  quantitativeResult: string;
  questionnaireAnswers: {
    [variable: string]: IAnswerData[];
  };
  personId: string;
  personType: EntityType;
  person: CaseModel | ContactModel | ContactOfContactModel;
  testedFor: string;
  sequence: LabResultSequenceModel;

  // used by ui
  alerted: boolean = false;
  uiStatusForms: SafeHtml;

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_VIEW) : false); }
  static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_LIST) : false); }
  static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_CREATE) : false); }
  static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_VIEW, PERMISSION.LAB_RESULT_MODIFY) : false); }
  static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_DELETE) : false); }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(): boolean { return false; }
  static canBulkModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_BULK_MODIFY) : false); }
  static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_BULK_DELETE) : false); }
  static canBulkRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_BULK_RESTORE) : false); }

  /**
   * Static Permissions - IPermissionRestorable
   */
  static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.LAB_RESULT_RESTORE) : false; }

  /**
   * Static Permissions - IPermissionImportable
   */
  static canImport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_IMPORT) : false); }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.LAB_RESULT_EXPORT) : false); }

  /**
   * Constructor
   */
  constructor(data = null) {
    super(data);

    this.person = _.get(data, 'person');
    if (!_.isEmpty(this.person)) {
      switch (this.person.type) {
        case EntityType.CONTACT:
          this.person = new ContactModel(this.person);
          break;
        case EntityType.CONTACT_OF_CONTACT:
          this.person = new ContactOfContactModel(this.person);
          break;
        // case EntityType.CASE:
        default:
          this.person = new CaseModel(this.person);
          break;
      }
    }

    this.id = _.get(data, 'id');
    this.sampleIdentifier = _.get(data, 'sampleIdentifier', '');
    this.dateSampleTaken = _.get(data, 'dateSampleTaken');
    this.dateSampleDelivered = _.get(data, 'dateSampleDelivered');
    this.dateTesting = _.get(data, 'dateTesting');
    this.dateOfResult = _.get(data, 'dateOfResult');
    this.labName = _.get(data, 'labName');
    this.sampleType = _.get(data, 'sampleType');
    this.testType = _.get(data, 'testType');
    this.result = _.get(data, 'result');
    this.notes = _.get(data, 'notes');
    this.status = _.get(data, 'status', Constants.LAB_TEST_RESULT_STATUS.IN_PROGRESS);
    this.quantitativeResult = _.get(data, 'quantitativeResult');
    this.personId = _.get(data, 'personId');
    this.personType = _.get(data, 'personType');
    this.testedFor = _.get(data, 'testedFor');

    // sequence
    this.sequence = new LabResultSequenceModel(_.get(data, 'sequence'));

    this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
  }

  /**
     * Permissions - IPermissionBasic
     */
  canView(user: UserModel): boolean { return LabResultModel.canView(user); }
  canList(user: UserModel): boolean { return LabResultModel.canList(user); }
  canCreate(user: UserModel): boolean { return LabResultModel.canCreate(user); }
  canModify(user: UserModel): boolean { return LabResultModel.canModify(user); }
  canDelete(user: UserModel): boolean { return LabResultModel.canDelete(user); }

  /**
   * Permissions - IPermissionBasicBulk
   */
  canBulkCreate(): boolean { return LabResultModel.canBulkCreate(); }
  canBulkModify(user: UserModel): boolean { return LabResultModel.canBulkModify(user); }
  canBulkDelete(user: UserModel): boolean { return LabResultModel.canBulkDelete(user); }
  canBulkRestore(user: UserModel): boolean { return LabResultModel.canBulkRestore(user); }

  /**
     * Permissions - IPermissionRestorable
     */
  canRestore(user: UserModel): boolean { return LabResultModel.canRestore(user); }

  /**
     * Permissions - IPermissionImportable
     */
  canImport(user: UserModel): boolean { return LabResultModel.canImport(user); }

  /**
     * Permissions - IPermissionExportable
     */
  canExport(user: UserModel): boolean { return LabResultModel.canExport(user); }
}
