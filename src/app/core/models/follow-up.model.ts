import * as _ from 'lodash';
import { AddressModel } from './address.model';
import { ContactModel } from './contact.model';
import { DateDefaultPipe } from '../../shared/pipes/date-default-pipe/date-default.pipe';
import { IAnswerData, QuestionModel } from './question.model';
import { BaseModel } from './base.model';
import { FillLocationModel } from './fill-location.model';
import { IPermissionBasic } from './permission.interface';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';

export class FollowUpModel
    extends BaseModel
    implements
        IPermissionBasic {
    id: string;
    date: string;
    address: AddressModel;
    personId: string;
    contact: ContactModel;
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
                [answer_value: string]: boolean
            }
        } = QuestionModel.determineAlertAnswers(template);

        // map alert value to follow-ups
        return _.map(entities, (followUpData: FollowUpModel) => {
            // check if we need to mark follow-up as alerted because of questionnaire answers
            followUpData.alerted = false;
            _.each(followUpData.questionnaireAnswers, (
                answers: IAnswerData[],
                questionVariable: string
            ) => {
                // retrieve answer value
                // only the newest one is of interest, the old ones shouldn't trigger an alert
                // the first item should be the newest
                const answerKey = _.get(answers, '0.value', undefined);

                // there is no point in checking the value if there isn't one
                if (
                    _.isEmpty(answerKey) &&
                    !_.isNumber(answerKey)
                ) {
                    return;
                }

                // at least one alerted ?
                if (_.isArray(answerKey)) {
                    // go through all answers
                    _.each(answerKey, (childAnswerKey: string) => {
                        if (_.get(alertQuestionAnswers, `[${questionVariable}][${childAnswerKey}]`)) {
                            // alerted
                            followUpData.alerted = true;

                            // stop each
                            return false;
                        }
                    });

                    // stop ?
                    if (followUpData.alerted) {
                        // stop each
                        return false;
                    }
                } else {
                    if (_.get(alertQuestionAnswers, `[${questionVariable}][${answerKey}]`)) {
                        // alerted
                        followUpData.alerted = true;

                        // stop each
                        return false;
                    }
                }
            });

            // finished
            return followUpData;
        });
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
            this.contact = _.get(data, 'contact', {});
            this.contact = new ContactModel(this.contact);
        }

        this.teamId = _.get(data, 'teamId');
        this.index = _.get(data, 'index');

        this.questionnaireAnswers = _.get(data, 'questionnaireAnswers', {});
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
     * Get date formatted
     */
    get dateFormatted() {
        const pD = new DateDefaultPipe();
        return pD.transform(this.date);
    }
}
