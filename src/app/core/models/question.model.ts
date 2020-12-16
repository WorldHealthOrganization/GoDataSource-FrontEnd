// tslint:disable:no-use-before-declare
import * as _ from 'lodash';
import { Constants } from './constants';
import { Moment } from '../helperClasses/x-moment';
import { IModelArrayProperties, ImportableFilePropertiesModel, ImportableFilePropertyValuesModel, ImportDataExtension } from '../../features/import-export-data/components/import-data/model';

export interface IAnswerData {
    date?: string | Moment;
    value: any;
}

export class AnswerModel {
    label: string;
    value: string;
    alert: boolean;
    order: number = 1;
    additionalQuestions: QuestionModel[];

    // new flag - DON'T save this field
    new: boolean;
    clone: boolean;

    constructor(
        data = null,
        keepFlags: boolean = false
    ) {
        this.label = _.get(data, 'label');
        this.value = _.get(data, 'value');
        this.alert = _.get(data, 'alert');
        this.order = _.get(data, 'order');

        if (keepFlags) {
            this.new = _.get(data, 'new');
            this.clone = _.get(data, 'clone');
        }

        this.additionalQuestions = _.map(
            _.get(data, 'additionalQuestions', null),
            (lData: any) => {
                return new QuestionModel(lData, keepFlags);
            });
        if (_.isEmpty(this.additionalQuestions)) {
            this.additionalQuestions = null;
        }
    }

    get additionalQuestionsShow(): boolean {
        return this.additionalQuestions !== null;
    }
    set additionalQuestionsShow(value: boolean) {
        if (value) {
            if (_.isEmpty(this.additionalQuestions)) {
                this.additionalQuestions = [];
            }
        } else {
            this.additionalQuestions = null;
        }
    }
}

export class QuestionModel {
    text: string;
    variable: string;
    category: string;
    required: boolean;
    inactive: boolean;
    multiAnswer: boolean;
    order: number = 1;
    answerType: string;
    answersDisplay: string;
    answers: AnswerModel[];

    // new flag - DON'T save this field
    new: boolean;
    clone: boolean;
    uuid: string;
    // we use this just for displaying the order of questions
    displayOrder: number;

    constructor(
        data = null,
        keepFlags: boolean = false
    ) {
        this.text = _.get(data, 'text');
        this.variable = _.get(data, 'variable');
        this.category = _.get(data, 'category');
        this.required = _.get(data, 'required');
        this.inactive = _.get(data, 'inactive');
        this.multiAnswer = _.get(data, 'multiAnswer');
        this.order = _.get(data, 'order');
        this.answerType = _.get(data, 'answerType');
        this.answersDisplay = _.get(data, 'answersDisplay', Constants.ANSWERS_DISPLAY.VERTICAL.value);

        if (keepFlags) {
            this.new = _.get(data, 'new');
            this.clone = _.get(data, 'clone');
            this.uuid = _.get(data, 'uuid');
        }

        this.answers = _.map(
            _.get(data, 'answers', []),
            (lData: any) => {
                return new AnswerModel(lData, keepFlags);
            });
    }

    /**
     * Determine questionnaire alerted answers from a template
     * @param template
     */
    static determineAlertAnswers(
        template: QuestionModel[]
    ): {
        [question_variable: string]: {
            [answer_value: string]: boolean
        }
    } {
        // map alert question answers to object for easy find
        const alertQuestionAnswers: {
            [question_variable: string]: {
                [answer_value: string]: boolean
            }
        } = {};
        const mapQuestions = (questions: QuestionModel[]) => {
            // get alerted answers
            _.each(questions, (question: QuestionModel) => {
                // alert applies only to those questions that have option values
                if (
                    question.answerType === Constants.ANSWER_TYPES.SINGLE_SELECTION.value ||
                    question.answerType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value
                ) {
                    _.each(question.answers, (answer: AnswerModel) => {
                        // answer alert ?
                        if (answer.alert) {
                            _.set(
                                alertQuestionAnswers,
                                `[${question.variable}][${answer.value}]`,
                                true
                            );
                        }

                        // go through all sub questions
                        if (!_.isEmpty(answer.additionalQuestions)) {
                            mapQuestions(answer.additionalQuestions);
                        }
                    });
                }
            });
        };

        // get alerted answers
        mapQuestions(template);

        // finished
        return alertQuestionAnswers;
    }

    /**
     * Used to format questionnaire properties before we use them to map and import data
     * @param modelProperties
     * @param modelPropertyValues
     */
    static formatQuestionnaireImportDefs(
        modelProperties: ImportableFilePropertiesModel,
        modelPropertyValues: ImportableFilePropertyValuesModel,
        fieldsWithoutTokens: {
            [property: string]: string
        },
        suggestedFieldMapping: {
            [fileHeader: string]: string
        },
        modelArrayProperties: {
            [propertyPath: string]: IModelArrayProperties
        },
        fileType: ImportDataExtension,
        extraDataUsedToFormat: any
    ) {
        // determine if this is a flat file
        const isFlat: boolean = fileType !== ImportDataExtension.JSON && fileType !== ImportDataExtension.XML;

        // determine questionnaire question types
        const questionTypes: {
            [variable: string]: string
        } = {};
        const determineTypes = (questions: QuestionModel[]) => {
            _.each(questions, (question: QuestionModel) => {
                // map current question
                questionTypes[question.variable] = question.answerType;

                // check for sub-questions
                if (!_.isEmpty(question.answers)) {
                    _.each(question.answers, (answer: AnswerModel) => {
                        determineTypes(answer.additionalQuestions);
                    });
                }
            });
        };
        determineTypes(extraDataUsedToFormat);

        // remap questionnaire answers api suggested maps
        const questionnaireParentKey: string = 'questionnaireAnswers.';
        if (suggestedFieldMapping) {
            _.each(suggestedFieldMapping, (modelKey: string, fileKey: string) => {
                // determine if we need to add type
                if (modelKey.startsWith(questionnaireParentKey)) {
                    // retrieve variable
                    const questionVariable: string = modelKey.substring(questionnaireParentKey.length);
                    const qType: string = questionTypes[questionVariable];

                    // map only if not already mapped
                    const mustEndWith: string = (isFlat && qType === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) ? '[].value[]' : '[].value';
                    if (!modelKey.endsWith(mustEndWith)) {
                        suggestedFieldMapping[fileKey] = `${modelKey}${mustEndWith}`;
                    }
                }
            });
        }

        // prepare questionnaire answers to be displayed properly by import system
        if (modelProperties.questionnaireAnswers) {
            const oldModelProperties: any = modelProperties.questionnaireAnswers;
            modelProperties.questionnaireAnswers = {};
            _.each(oldModelProperties, (answerLabel: string, variable: string) => {
                // map questionnaire answer to object with date & value properties
                const trimmedVar: string = variable.replace('_____A', '');
                modelProperties.questionnaireAnswers[`${variable}[]`] = {
                    [(isFlat && questionTypes[trimmedVar] === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) ? 'value[]' : 'value']: 'LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_VALUE',
                    date: 'LNG_PAGE_IMPORT_DATA_LABEL_QUESTIONNAIRE_ANSWERS_DATE'
                };

                // add parent object name
                if (!fieldsWithoutTokens[`${questionnaireParentKey}${variable}[]`]) {
                    fieldsWithoutTokens[`${questionnaireParentKey}${variable}[]`] = answerLabel;
                }
            });
        }

        // prepare questionnaire answers dropdown possible values
        if (modelPropertyValues.questionnaireAnswers) {
            const oldModelPropertyValues: any = modelPropertyValues.questionnaireAnswers;
            modelPropertyValues.questionnaireAnswers = {};
            _.each(oldModelPropertyValues, (dropdownOptions: any, variable: string) => {
                const trimmedVar: string = variable.replace('_____A', '');
                modelPropertyValues.questionnaireAnswers[`${variable}[]`] = {
                    [(isFlat && questionTypes[trimmedVar] === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) ? 'value[]' : 'value']: dropdownOptions
                };
            });
        }

        // prepare array props for questionnaires
        _.each(modelArrayProperties, (definition: IModelArrayProperties, propertyPath: string) => {
            if (propertyPath.startsWith(questionnaireParentKey)) {
                // determine question variable
                const variable: string = propertyPath.substring(questionnaireParentKey.length);
                delete modelArrayProperties[propertyPath];

                // add the new options
                modelArrayProperties[`${questionnaireParentKey}${variable}[].${(isFlat && questionTypes[variable] === Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value) ? 'value[]' : 'value'}`] = definition;
                modelArrayProperties[`${questionnaireParentKey}${variable}[].date`] = definition;
            }
        });
    }

    /**
     * Mark question as being new
     */
    markAsNew() {
        // mark question as being new
        this.new = true;

        // mark sub questions as being new
        _.each(this.answers, (answer) => {
            _.each(answer.additionalQuestions, (question) => {
                question.markAsNew();
            });
        });
    }
}
