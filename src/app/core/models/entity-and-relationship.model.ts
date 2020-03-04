// tslint:disable:no-use-before-declare
import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { CaseModel } from './case.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';
import { LabelValuePair } from './label-value-pair';
import { AddressModel } from './address.model';
import { IAnswerData, QuestionModel } from './question.model';
import { Constants } from './constants';
import { moment } from '../helperClasses/x-moment';
import { BaseModel } from './base.model';
import { RelationshipPersonModel } from './relationship-person.model';
import { UserModel } from './user.model';
import { PERMISSION } from './permission.model';
import { OutbreakModel } from './outbreak.model';
import { IPermissionBasic, IPermissionBasicBulk, IPermissionExportable, IPermissionRelationship } from './permission.interface';
import { ContactOfContactModel } from './contact-of-contact.model';

export class RelationshipModel
    extends BaseModel
    implements
        IPermissionBasic,
        IPermissionRelationship,
        IPermissionExportable,
        IPermissionBasicBulk {
    id: string;
    persons: RelationshipPersonModel[];
    contactDate: string;
    contactDateEstimated: boolean;
    certaintyLevelId: string;
    exposureTypeId: string;
    exposureFrequencyId: string;
    exposureDurationId: string;
    socialRelationshipTypeId: string;
    socialRelationshipDetail: string;
    clusterId: string;
    comment: string;
    people: EntityModel[];

    /**
     * Static Permissions - IPermissionBasic
     */
    static canView(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_VIEW) : false); }
    static canList(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_LIST) : false); }
    static canCreate(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_CREATE) : false); }
    static canModify(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_VIEW, PERMISSION.RELATIONSHIP_MODIFY) : false); }
    static canDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_DELETE) : false); }

    /**
     * Static Permissions - IPermissionRelationship
     */
    static canReverse(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_REVERSE) : false); }
    static canShare(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_SHARE) : false); }

    /**
     * Static Permissions - IPermissionExportable
     */
    static canExport(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_EXPORT) : false); }

    /**
     * Static Permissions - IPermissionBasicBulk
     */
    static canBulkCreate(user: UserModel): boolean { return false; }
    static canBulkModify(user: UserModel): boolean { return false; }
    static canBulkDelete(user: UserModel): boolean { return OutbreakModel.canView(user) && (user ? user.hasPermissions(PERMISSION.RELATIONSHIP_BULK_DELETE) : false); }
    static canBulkRestore(user: UserModel): boolean { return false; }

    /**
     * Constructor
     */
    constructor(data = null) {
        super(data);

        this.id = _.get(data, 'id');
        this.persons = _.get(data, 'persons', []);
        this.contactDate = _.get(data, 'contactDate');
        this.contactDateEstimated = _.get(data, 'contactDateEstimated', false);
        this.certaintyLevelId = _.get(data, 'certaintyLevelId');
        this.exposureTypeId = _.get(data, 'exposureTypeId');
        this.exposureFrequencyId = _.get(data, 'exposureFrequencyId');
        this.exposureDurationId = _.get(data, 'exposureDurationId');
        this.socialRelationshipTypeId = _.get(data, 'socialRelationshipTypeId');
        this.socialRelationshipDetail = _.get(data, 'socialRelationshipDetail');
        this.clusterId = _.get(data, 'clusterId');
        this.comment = _.get(data, 'comment');

        const peopleData = _.get(data, 'people', []);
        this.people = _.map(peopleData, (entityData) => {
            return new EntityModel(entityData);
        });
    }

    /**
     * Permissions - IPermissionBasic
     */
    canView(user: UserModel): boolean { return RelationshipModel.canView(user); }
    canList(user: UserModel): boolean { return RelationshipModel.canList(user); }
    canCreate(user: UserModel): boolean { return RelationshipModel.canCreate(user); }
    canModify(user: UserModel): boolean { return RelationshipModel.canModify(user); }
    canDelete(user: UserModel): boolean { return RelationshipModel.canDelete(user); }

    /**
     * Permissions - IPermissionRelationship
     */
    canReverse(user: UserModel): boolean { return RelationshipModel.canReverse(user); }
    canShare(user: UserModel): boolean { return RelationshipModel.canShare(user); }

    /**
     * Permissions - IPermissionExportable
     */
    canExport(user: UserModel): boolean { return RelationshipModel.canExport(user); }

    /**
     * Permissions - IPermissionBasicBulk
     */
    canBulkCreate(user: UserModel): boolean { return RelationshipModel.canBulkCreate(user); }
    canBulkModify(user: UserModel): boolean { return RelationshipModel.canBulkModify(user); }
    canBulkDelete(user: UserModel): boolean { return RelationshipModel.canBulkDelete(user); }
    canBulkRestore(user: UserModel): boolean { return RelationshipModel.canBulkRestore(user); }

    /**
     * Get the related entity
     * @param {string} currentEntityId
     * @return {EntityModel}
     */
    relatedEntity(currentEntityId: string): EntityModel {
        return _.find(this.people, (entity: EntityModel) => {
            const entityId = _.get(entity, 'model.id');
            return entityId !== currentEntityId;
        });
    }

    /**
     * Source Person
     */
    get sourcePerson(): RelationshipPersonModel {
        const data = _.find(this.persons, { source: true });
        return data ? new RelationshipPersonModel(data) : data;
    }
}

export class ReportDifferenceOnsetRelationshipModel extends RelationshipModel {
    differenceBetweenDatesOfOnset: number;

    constructor(data = null) {
        super(data);

        this.differenceBetweenDatesOfOnset = _.get(data, 'differenceBetweenDatesOfOnset', 0);
    }
}

/**
 * Model representing a Case, a Contact or an Event
 */
export class EntityModel {
    type: EntityType;
    model: CaseModel | ContactModel | EventModel | ContactOfContactModel;
    relationship: RelationshipModel;

    /**
     * Link accordingly to type
     */
    static getLinkForEntityType(entityType: EntityType): string {
        switch (entityType) {
            case EntityType.CASE:
                return 'cases';
            case EntityType.CONTACT:
                return 'contacts';
            case EntityType.EVENT:
                return 'events';
            case EntityType.CONTACT_OF_CONTACT:
                return 'contacts-of-contacts';
        }

        // finished
        return '';
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    private static uniqueValueOptions(
        records: EntityModel[],
        path: string,
        valueParser: (value: any) => any,
        labelValueMap: (value: any) => LabelValuePair
    ): { options: LabelValuePair[], value: any } {
        // construct options
        const options: LabelValuePair[] = _.chain(records)
            .map((record: EntityModel) => path ? _.get(record.model, path) : record.model)
            .filter((value) => value !== '' && value !== undefined && value !== null)
            .uniqBy((value: any) => valueParser(value))
            .map((value) => labelValueMap(value))
            .filter((value: LabelValuePair) => value.label !== '' && value.value !== '' && value.value !== undefined && value.value !== null)
            .value();

        // finished
        return {
            options: options,
            value: options.length === 1 ?
                options[0].value : undefined
        };
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueStringOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            (value) => _.isString(value) ? value.toLowerCase() : value,
            (value) => new LabelValuePair(value, value)
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueDateOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value,
            (value) => new LabelValuePair(
                moment(value).isValid() ? moment(value).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) : value,
                value
            )
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueBooleanOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO',
            (value) => new LabelValuePair(value ? 'LNG_COMMON_LABEL_YES' : 'LNG_COMMON_LABEL_NO', value)
        );
    }

    /**
     * Unique values
     * @param records
     * @param path
     */
    static uniqueAddressOptions(
        records: EntityModel[],
        path: string
    ): { options: LabelValuePair[], value: any } {
        return EntityModel.uniqueValueOptions(
            records,
            path,
            // no need to do something custom
            (value) => value,
            (value) => new LabelValuePair((value as AddressModel).fullAddress, value)
        );
    }

    /**
     * Age String
     * @param age
     * @param yearsLabel
     * @param monthsLabel
     */
    static getAgeString(
        age,
        yearsLabel: string,
        monthsLabel: string
    ): string {
        return !age ?
            '' : (
                age.months > 0 ?
                    `${age.months} ${monthsLabel}` : (
                        age.years > 0 ?
                            `${age.years} ${yearsLabel}` :
                            ''
                    )
            );
    }

    /**
     * Get name + date or age
     * @param model
     */
    static getNameWithDOBAge(
        model: CaseModel | ContactModel | ContactOfContactModel,
        yearsLabel: string,
        monthsLabel: string
    ) {
        // initialize
        let name: string = model.name;

        // add dob / age
        if (model.dob) {
            name += ' ( ' + moment(model.dob).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) + ' )';
        } else if (
            model.age && (
                model.age.years > 0 ||
                model.age.months > 0
            )
        ) {
            name += ' ( ' + EntityModel.getAgeString(model.age, yearsLabel, monthsLabel) + ' )';
        }

        // finished
        return name;
    }

    /**
     * Unique values
     * @param records
     */
    static uniqueAgeDobOptions(
        records: EntityModel[],
        yearsLabel: string,
        monthsLabel: string
    ): { options: LabelValuePair[], value: any } {
        // convert dob to string
        const dobString = (dob): string => {
            return dob ?
                dob :
                '';
        };

        // convert age dob to string
        const ageDobString = (dob, age): string => {
            dob = dobString(dob);
            age = EntityModel.getAgeString(age, yearsLabel, monthsLabel);
            return `${dob} ${age}`.trim();
        };

        // return age / dob unique options
        return EntityModel.uniqueValueOptions(
            records,
            '',
            // no need to do something custom
            (value: CaseModel | ContactModel) => ageDobString(value.dob, value.age),
            (value) => new LabelValuePair(ageDobString(value.dob, value.age), value)
        );
    }

    /**
     * Determine alertness
     */
    static determineAlertness(
        template: QuestionModel[],
        entities: CaseModel[]
    ): CaseModel[] {
        // map alert question answers to object for easy find
        const alertQuestionAnswers: {
            [question_variable: string]: {
                [answer_value: string]: boolean
            }
        } = QuestionModel.determineAlertAnswers(template);

        // map alert value to cases
        return _.map(entities, (caseData: CaseModel) => {
            // check if we need to mark case as alerted because of questionnaire answers
            caseData.alerted = false;
            _.each(caseData.questionnaireAnswers, (
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
                            caseData.alerted = true;

                            // stop each
                            return false;
                        }
                    });

                    // stop ?
                    if (caseData.alerted) {
                        // stop each
                        return false;
                    }
                } else {
                    if (_.get(alertQuestionAnswers, `[${questionVariable}][${answerKey}]`)) {
                        // alerted
                        caseData.alerted = true;

                        // stop each
                        return false;
                    }
                }
            });

            // finished
            return caseData;
        });
    }

    /**
     * Generates view link for entity based on type
     * @param person
     * @returns {string}
     */
    static getPersonLink(person): string {
        return `/${EntityModel.getLinkForEntityType(person.type)}/${person.id}/view`;
    }

    /**
     * Constructor
     */
    constructor(data) {
        this.type = _.get(data, 'type');

        this.relationship = _.get(data, 'relationship');
        if (!_.isEmpty(this.relationship)) {
            this.relationship = this.relationship instanceof RelationshipModel ?
                this.relationship :
                new RelationshipModel(this.relationship);
        }

        switch (this.type) {
            case EntityType.CASE:
                this.model = new CaseModel(data);
                break;

            case EntityType.CONTACT:
                this.model = new ContactModel(data);
                break;

            case EntityType.EVENT:
                this.model = new EventModel(data);
                break;

            case EntityType.CONTACT_OF_CONTACT:
                this.model = new ContactOfContactModel(data);
                break;
        }
    }
}
