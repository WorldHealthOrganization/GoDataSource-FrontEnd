import * as _ from 'lodash';
import { ContactModel } from './contact.model';
import { CaseModel } from './case.model';
import { EventModel } from './event.model';
import { EntityType } from './entity-type';
import { LabelValuePair } from './label-value-pair';
import { AddressModel } from './address.model';
import { QuestionModel } from './question.model';
import { Constants } from './constants';
import * as moment from 'moment';

/**
 * Model representing a Case, a Contact or an Event
 */
export class EntityModel {
    type: EntityType;
    model: CaseModel | ContactModel | EventModel;

    constructor(data) {
        this.type = _.get(data, 'type');

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
        }
    }

    static getLinkForEntityType(entityType: EntityType): string {
        let entityTypeLink = '';
        switch (entityType) {
            case EntityType.CASE:
                entityTypeLink = 'cases';
                break;
            case EntityType.CONTACT:
                entityTypeLink = 'contacts';
                break;
            case EntityType.EVENT:
                entityTypeLink = 'events';
                break;
        }

        return entityTypeLink;
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
        labelValueMap: (value: any) => LabelValuePair,
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
        model: CaseModel | ContactModel,
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
            _.each(caseData.questionnaireAnswers, (answerKey: string, questionVariable: string) => {
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
    static getPersonLink(person) {
        let entityTypeLink = '';
        if (person instanceof CaseModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.CASE);
        } else if (person instanceof ContactModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.CONTACT);
        } else if (person instanceof EventModel) {
            entityTypeLink = EntityModel.getLinkForEntityType(EntityType.EVENT);
        }

        return `/${entityTypeLink}/${person.id}/view`;
    }
}
