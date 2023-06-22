import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';
import { IAnswerData, QuestionModel } from './question.model';
import { BaseModel } from './base.model';
import { FillLocationModel } from './fill-location.model';
import { IPermissionBasic, IPermissionBasicBulk, IPermissionExportable, IPermissionFollowUp, IPermissionRestorable } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import { EntityType } from './entity-type';
import { CaseModel } from './case.model';
import { Moment } from '../helperClasses/x-moment';
import { IV2ColumnStatusFormType, V2ColumnStatusForm } from '../../shared/components-v2/app-list-table-v2/models/column.model';
import { SafeHtml } from '@angular/platform-browser';
import { IResolverV2ResponseModel } from '../services/resolvers/data/models/resolver-response.model';
import { ReferenceDataEntryModel } from './reference-data.model';
import { I18nService } from '../services/helper/i18n.service';

export class FollowUpModel
  extends BaseModel
  implements
    IPermissionBasic,
    IPermissionRestorable,
    IPermissionBasicBulk,
    IPermissionExportable,
    IPermissionFollowUp {
  id: string;
  date: string | Moment;
  address: AddressModel;
  personId: string;
  person: ContactModel | CaseModel;
  targeted: boolean;
  questionnaireAnswers: {
    [variable: string]: IAnswerData[];
  };
  outbreakId: string;
  statusId: string;
  teamId: string;
  index: number;

  alerted: boolean = false;

  fillLocation: FillLocationModel;

  responsibleUserId: string;
  responsibleUser: UserModel;

  // used by ui
  uiStatusForms: SafeHtml;

  /**
   * Determine alertness
   */
  static determineAlertness(
    template: QuestionModel[],
    entities: FollowUpModel[]
  ): FollowUpModel[] {
    // map alert question answers to object for easy find
    const alertQuestionAnswers: {
      [question_variable: string]: {
        [answer_value: string]: true
      }
    } = QuestionModel.determineAlertAnswers(template);

    // map alert value to follow-ups
    entities.forEach((followUpData: FollowUpModel) => {
      // check if we need to mark follow-up as alerted because of questionnaire answers
      followUpData.alerted = false;
      if (followUpData.questionnaireAnswers) {
        const props: string[] = Object.keys(followUpData.questionnaireAnswers);
        for (let propIndex: number = 0; propIndex < props.length; propIndex++) {
          // get answer data
          const questionVariable: string = props[propIndex];
          const answers: IAnswerData[] = followUpData.questionnaireAnswers[questionVariable];

          // retrieve answer value
          // only the newest one is of interest, the old ones shouldn't trigger an alert
          // the first item should be the newest
          const answerKey = answers?.length > 0 ?
            answers[0].value :
            undefined;

          // there is no point in checking the value if there isn't one
          if (
            !answerKey &&
            typeof answerKey !== 'number'
          ) {
            continue;
          }

          // at least one alerted ?
          if (Array.isArray(answerKey)) {
            // go through all answers
            for (let answerKeyIndex: number = 0; answerKeyIndex < answerKey.length; answerKeyIndex++) {
              if (
                alertQuestionAnswers[questionVariable] &&
                alertQuestionAnswers[questionVariable][answerKey[answerKeyIndex]]
              ) {
                // alerted
                followUpData.alerted = true;

                // stop
                break;
              }
            }

            // stop ?
            if (followUpData.alerted) {
              // stop
              break;
            }
          } else if (
            alertQuestionAnswers[questionVariable] &&
            alertQuestionAnswers[questionVariable][answerKey]
          ) {
            // alerted
            followUpData.alerted = true;

            // stop
            break;
          }
        }
      }
    });

    // finished
    return entities;
  }

  /**
   * Retrieve statuses forms
   */
  static getStatusForms(
    info: {
      // required
      item: FollowUpModel,
      i18nService: I18nService,
      dailyFollowUpStatus: IResolverV2ResponseModel<ReferenceDataEntryModel>
    }
  ): V2ColumnStatusForm[] {
    // construct list of forms that we need to display
    const forms: V2ColumnStatusForm[] = [];

    // status
    if (
      info.item.statusId &&
      info.dailyFollowUpStatus.map[info.item.statusId]
    ) {
      forms.push({
        type: IV2ColumnStatusFormType.CIRCLE,
        color: info.dailyFollowUpStatus.map[info.item.statusId].getColorCode(),
        tooltip: info.i18nService.instant(info.item.statusId)
      });
    }

    // alerted
    if (info.item.alerted) {
      forms.push({
        type: IV2ColumnStatusFormType.STAR,
        color: 'var(--gd-danger)',
        tooltip: info.i18nService.instant('LNG_COMMON_LABEL_STATUSES_ALERTED')
      });
    }

    // finished
    return forms;
  }

  /**
   * Static Permissions - IPermissionBasic
   */
  static canView(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_VIEW) : false; }
  static canList(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_LIST) : false; }
  static canCreate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_CREATE) : false; }
  static canModify(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_VIEW, PERMISSION.FOLLOW_UP_MODIFY) : false; }
  static canDelete(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_DELETE) : false; }

  /**
   * Static Permissions - IPermissionRestorable
   */
  static canRestore(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_RESTORE) : false; }

  /**
   * Static Permissions - IPermissionBasicBulk
   */
  static canBulkCreate(): boolean { return false; }
  static canBulkModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.FOLLOW_UP_BULK_MODIFY) : false); }
  static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.FOLLOW_UP_BULK_DELETE) : false); }
  static canBulkRestore(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.FOLLOW_UP_BULK_RESTORE) : false); }

  /**
   * Static Permissions - IPermissionExportable
   */
  static canExport(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_EXPORT) : false; }

  /**
   * Static Permissions - IPermissionFollowUp
   */
  static canListDashboard(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_LIST_RANGE) : false; }
  static canGenerate(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_GENERATE) : false; }
  static canExportRange(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_EXPORT_RANGE) : false; }
  static canExportDailyForm(user: UserModel): boolean { return user ? user.hasPermissions(PERMISSION.FOLLOW_UP_EXPORT_DAILY_FORM) : false; }

  /**
   * Constructor
   */
  constructor(
    data = null,
    includeContact: boolean = true
  ) {
    super(data);

    this.id = _.get(data, 'id');
    this.date = _.get(data, 'date');
    this.personId = _.get(data, 'personId');
    this.targeted = _.get(data, 'targeted', true);
    this.statusId = _.get(data, 'statusId');
    this.outbreakId = _.get(data, 'outbreakId');

    this.address = new AddressModel(_.get(data, 'address'));

    this.fillLocation = _.get(data, 'fillLocation');
    this.fillLocation = _.isEmpty(this.fillLocation) ? undefined : new FillLocationModel(this.fillLocation);

    if (includeContact) {
      // get person based on the received object
      const person = _.get(
        data,
        (data instanceof FollowUpModel) ? 'person' : 'contact',
        {}
      );

      if (person.type === EntityType.CASE) {
        this.person = new CaseModel(person);
      } else {
        this.person = new ContactModel(person);
      }
    }

    this.teamId = _.get(data, 'teamId');
    this.index = _.get(data, 'index');

    this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});

    this.responsibleUserId = _.get(data, 'responsibleUserId');
    this.responsibleUser = _.get(data, 'responsibleUser');
    if (this.responsibleUser) {
      this.responsibleUser = new UserModel(this.responsibleUser);
    }
  }

  /**
   * Permissions - IPermissionBasic
   */
  canView(user: UserModel): boolean { return FollowUpModel.canView(user); }
  canList(user: UserModel): boolean { return FollowUpModel.canList(user); }
  canCreate(user: UserModel): boolean { return FollowUpModel.canCreate(user); }
  canModify(user: UserModel): boolean { return FollowUpModel.canModify(user); }
  canDelete(user: UserModel): boolean { return FollowUpModel.canDelete(user); }

  /**
   * Permissions - IPermissionRestorable
   */
  canRestore(user: UserModel): boolean { return FollowUpModel.canRestore(user); }

  /**
   * Permissions - IPermissionBasicBulk
   */
  canBulkCreate(): boolean { return FollowUpModel.canBulkCreate(); }
  canBulkModify(user: UserModel): boolean { return FollowUpModel.canBulkModify(user); }
  canBulkDelete(user: UserModel): boolean { return FollowUpModel.canBulkDelete(user); }
  canBulkRestore(user: UserModel): boolean { return FollowUpModel.canBulkRestore(user); }

  /**
   * Permissions - IPermissionExportable
   */
  canExport(user: UserModel): boolean { return FollowUpModel.canExport(user); }

  /**
   * Permissions - IPermissionFollowUp
   */
  canListDashboard(user: UserModel): boolean { return FollowUpModel.canListDashboard(user); }
  canGenerate(user: UserModel): boolean { return FollowUpModel.canGenerate(user); }
  canExportRange(user: UserModel): boolean { return FollowUpModel.canExportRange(user); }
  canExportDailyForm(user: UserModel): boolean { return FollowUpModel.canExportDailyForm(user); }
}
