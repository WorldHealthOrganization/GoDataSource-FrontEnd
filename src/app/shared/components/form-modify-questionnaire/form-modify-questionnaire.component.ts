import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { ConfirmOnFormChanges } from '../../../core/services/guards/page-change-confirmation-guard.service';
import { UserModel } from '../../../core/models/user.model';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakQestionnaireTypeEnum } from '../../../core/enums/outbreak-qestionnaire-type.enum';
import { ActivatedRoute } from '@angular/router';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { OutbreakTemplateModel } from '../../../core/models/outbreak-template.model';
import { PERMISSION } from '../../../core/models/permission.model';
import * as _ from 'lodash';
import { AnswerModel, QuestionModel } from '../../../core/models/question.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { Subscriber } from 'rxjs/Subscriber';
import { ReferenceDataCategory } from '../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../core/services/data/reference-data.data.service';
import { LabelValuePair } from '../../../core/models/label-value-pair';
import { GenericDataService } from '../../../core/services/data/generic.data.service';
import { NgForm, NgModel } from '@angular/forms';
import { FormHelperService } from '../../../core/services/helper/form-helper.service';
import { Constants } from '../../../core/models/constants';
import { DomService } from '../../../core/services/helper/dom.service';
import { v4 as uuid } from 'uuid';

/**
 * Used to initialize breadcrumbs
 */
export class FormModifyQuestionnaireBreadcrumbsData {
    constructor(
        public outbreak: OutbreakModel | OutbreakTemplateModel,
        public type: OutbreakQestionnaireTypeEnum
    ) {}
}

/**
 * Used to update questionnaire data
 */
export class FormModifyQuestionnaireUpdateData {
    constructor(
        public parent: OutbreakModel | OutbreakTemplateModel,
        public type: OutbreakQestionnaireTypeEnum,
        public questionnaire: QuestionModel[],
        public finishSubscriber: Subscriber<boolean>
    ) {}
}

@Component({
    selector: 'app-form-modify-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-modify-questionnaire.component.html',
    styleUrls: ['./form-modify-questionnaire.component.less']
})
export class FormModifyQuestionnaireComponent extends ConfirmOnFormChanges implements OnInit {
    // component unique id
    uniqueID: string = uuid();
    uniqueIDQuestion: string = `question-section-${this.uniqueID}`;
    uniqueIDAnswer: string = `answer-section-${this.uniqueID}`;
    uniqueIDQuestionForm: string = `question-form-${this.uniqueID}`;
    uniqueIDAnswerForm: string = `answer-form-${this.uniqueID}`;

    // constants
    answerTypes: any = Constants.ANSWER_TYPES;

    // authenticated user
    authUser: UserModel;

    // outbreak / outbreak template to modify
    private _parent: OutbreakModel | OutbreakTemplateModel;
    @Input() set parent(value: OutbreakModel | OutbreakTemplateModel) {
        // set parent
        this._parent = value;

        // emit breadcrumbs event
        this.emitBreadcrumbEvent();

        // init questionnaire data
        this.initQuestionnaireData();
    }
    get parent(): OutbreakModel | OutbreakTemplateModel {
        return this._parent;
    }

    /**
     * Display change label instead of save ( used by additional questions )
     */
    @Input() displayChangeButton: boolean = false;

    /**
     * Template used ( case, follow-up, lab )
     */
    questionnaireType: OutbreakQestionnaireTypeEnum;

    /**
     * Questionnaire questions
     */
    questionnaireData: QuestionModel[];

    /**
     * Questionnaire question variables
     */
    questionVariables: {
        [lowercaseVariable: string]: string
    } = {};

    /**
     * Extra Question variables prepended to questionVariables
     */
    @Input() extraQuestionVariables: {
        [lowercase_variable: string]: string
    } = {};

    /**
     * Question In Edit Mode
     */
    questionIndexInEditMode: number = null;

    /**
     * Question In Edit Mode Clone
     */
    questionInEditModeClone: QuestionModel;

    /**
     * Question Answer In Edit Mode
     */
    questionAnswerIndexInEditMode: number = null;

    /**
     * Question Answer In Edit Mode Clone
     */
    questionAnswerInEditModeClone: AnswerModel;

    /**
     * Question Answer Dummy Parent - used for recursive questions ( additional questions )
     */
    questionAnswerDummyParent: OutbreakModel | OutbreakTemplateModel;

    /**
     * Saving data
     */
    savingData: boolean = false;

    /**
     * List of categories for a form-question
     */
    questionCategoriesInstantList: LabelValuePair[];

    /**
     * List of answer types
     */
    answerTypesInstantList: LabelValuePair[];

    /**
     * Child question is in edit mode ?
     */
    childQuestionIsInEditMode: boolean = false;

    /**
     * Edit Mode - Question Form
     */
    @ViewChild('questionForm') questionForm: NgForm;

    /**
     * Edit Mode - Question Answer Form
     */
    @ViewChild('answerForm') answerForm: NgForm;

    /**
     * Used to mark question form dirty
     */
    @ViewChild('inputQuestionForMakingFormDirty') inputQuestionForMakingFormDirty: NgModel;

    /**
     * Used to mark answer form dirty
     */
    @ViewChild('inputAnswerForMakingFormDirty') inputAnswerForMakingFormDirty: NgModel;

    /**
     * Breadcrumbs init
     */
    @Output() initBreadcrumbs = new EventEmitter<FormModifyQuestionnaireBreadcrumbsData>();

    /**
     * Save outbreak questionnaire
     */
    @Output() updateQuestionnaire = new EventEmitter<FormModifyQuestionnaireUpdateData>();

    /**
     * triggered when edit mode has changed
     */
    @Output() questionEditModeChanged = new EventEmitter<boolean>();

    /**
     * Constructor
     */
    constructor(
        protected route: ActivatedRoute,
        private authDataService: AuthDataService,
        private i18nService: I18nService,
        private dialogService: DialogService,
        private referenceDataDataService: ReferenceDataDataService,
        private genericDataService: GenericDataService,
        private formHelper: FormHelperService,
        private domService: DomService
    ) {
        super();
    }

    /**
     * Initialized
     */
    ngOnInit() {
        // retrieve reference options
        this.referenceDataDataService
            .getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.QUESTION_CATEGORY)
            .subscribe((questionCategoriesList) => {
                this.questionCategoriesInstantList = questionCategoriesList;
            });
        this.genericDataService
            .getAnswerTypesList()
            .subscribe((answerTypesInstantList) => {
                this.answerTypesInstantList = answerTypesInstantList;
            });

        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // on language change..we need to translate again question data
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.initQuestionnaireData();
        });

        // determine what kind of view we should display
        this.route.data.subscribe((data: { questionnaire: OutbreakQestionnaireTypeEnum }) => {
            // questionnaire
            this.questionnaireType = data.questionnaire;

            // emit breadcrumbs event
            this.emitBreadcrumbEvent();

            // init questionnaire data
            this.initQuestionnaireData();
        });
    }

    /**
     * Emit breadcrumbs init event
     */
    private emitBreadcrumbEvent() {
        // can we emit breadcrumb event ?
        if (
            !_.isEmpty(this.parent) &&
            !_.isEmpty(this.questionnaireType)
        ) {
            setTimeout(() => {
                // update breadcrumbs
                this.initBreadcrumbs.emit(new FormModifyQuestionnaireBreadcrumbsData(
                    this.parent,
                    this.questionnaireType
                ));
            });
        }
    }

    /**
     * Init questionnaire data
     */
    private initQuestionnaireData() {
        // can we init questionnaire data ?
        if (
            !_.isEmpty(this.parent) &&
            !_.isEmpty(this.questionnaireType)
        ) {
            // retrieve questionnaire data
            this.questionnaireData = _.isEmpty(this.parent[this.questionnaireType]) ?
                [] :
                // clone list of questions so we don't change the provided one since we might want to cancel some of the changes
                _.transform(
                    this.parent[this.questionnaireType],
                    (accumulator: QuestionModel[], question: QuestionModel) => {
                        accumulator.push(new QuestionModel(question));
                    },
                    []
                );

            // format data
            this.sanitizeQuestionnaireData();
        }
    }

    /**
     * Format questionnaire data
     */
    private sanitizeQuestionnaireData() {
        // no need to anything if we don't have any data :)
        if (!_.isEmpty(this.questionnaireData)) {
            // make sure they are sorted
            this.questionnaireData = this.sortQuestionnaireQuestions(this.questionnaireData);

            // after sort, set the proper value in order field
            this.setQuestionnaireQuestionsOrder(this.questionnaireData);

            // translate data? since we need to have it in memory translated ?
            // what about language change ? should we hook that too - HANDLED ?
            this.initTranslateQuestionnaireQuestions();
        }

        // get variables so we don't allow duplicates
        this.determineQuestionnaireVariables();
    }

    /**
     * Determine questionnaire variables
     */
    private determineQuestionnaireVariables() {
        // init questionnaire variables
        this.questionVariables = { ...this.extraQuestionVariables };

        // add variables to array of variables
        const getQuestionVariables = (questions: QuestionModel[]) => {
            _.each(questions, (question: QuestionModel) => {
                // add variable to list
                if (question.variable) {
                    this.questionVariables[question.variable.toLowerCase()] = question.uuid;
                }

                // search for child variables
                _.each(question.answers, (answer: AnswerModel) => {
                    // do we have questions ?
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        getQuestionVariables(answer.additionalQuestions);
                    }
                });
            });
        };

        // go through data and add questionnaire variables
        if (!_.isEmpty(this.questionnaireData)) {
            // start with main questions
            getQuestionVariables(this.questionnaireData);
        }

        // append clone too since this is active information
        if (
            this.questionAnswerInEditModeClone &&
            !_.isEmpty(this.questionAnswerInEditModeClone.additionalQuestions)
        ) {
            getQuestionVariables(this.questionAnswerInEditModeClone.additionalQuestions);
        }
    }

    /**
     * Sort questionnaire questions
     * @param questions
     */
    private sortQuestionnaireQuestions(
        questions: QuestionModel[],
        recursive: boolean = true
    ): QuestionModel[] {
        // empty ?
        if (_.isEmpty(questions)) {
            return questions;
        }

        // sort answer questions
        _.each(questions, (question: QuestionModel) => {
            if (!_.isEmpty(question.answers)) {
                // sort answers
                question.answers = _.sortBy(
                    question.answers,
                    'order'
                );

                // check answers for order
                if (recursive) {
                    _.each(question.answers, (answer: AnswerModel) => {
                        if (!_.isEmpty(answer.additionalQuestions)) {
                            answer.additionalQuestions = this.sortQuestionnaireQuestions(
                                answer.additionalQuestions,
                                recursive
                            );
                        }
                    });
                }
            }
        });

        // sort questions
        return _.sortBy(
            questions,
            'order'
        );
    }

    /**
     * Set questionnaire questions default order values
     * @param questions
     */
    private setQuestionnaireQuestionsOrder(
        questions: QuestionModel[],
        recursive: boolean = true
    ) {
        // sort answer questions
        _.each(questions, (question: QuestionModel, questionIndex: number) => {
            // set question order
            question.order = questionIndex + 1;

            // set additional questions index
            _.each(question.answers, (answer: AnswerModel, answerIndex: number) => {
                // set answer order
                answer.order = answerIndex + 1;

                // continue bellow ?
                if (recursive) {
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        this.setQuestionnaireQuestionsOrder(
                            answer.additionalQuestions,
                            recursive
                        );
                    }
                }
            });
        });
    }

    /**
     * Translate Question Data
     */
    private initTranslateQuestionnaireQuestions() {
        // no need to anything if we don't have any data :)
        if (!_.isEmpty(this.questionnaireData)) {
            this.translateQuestionnaireQuestions(this.questionnaireData);
        }
    }

    /**
     * Translate Question Data
     */
    private translateQuestionnaireQuestions(questions: QuestionModel[]) {
        _.each(questions, (question: QuestionModel) => {
            // translate question
            question.text = this.i18nService.instant(question.text);
            question.uuid = uuid();

            // translate answers & sub questions
            _.each(question.answers, (answer: AnswerModel) => {
                // translate answer
                answer.label = this.i18nService.instant(answer.label);

                // translate sub-question
                if (!_.isEmpty(answer.additionalQuestions)) {
                    this.translateQuestionnaireQuestions(answer.additionalQuestions);
                }
            });
        });
    }

    /**
     * Check if we have write access to write to outbreaks or outbreak templates
     * @returns {boolean}
     */
    hasWriteAccess(): boolean {
        return this.parent ?
            this.authUser.hasPermissions(
                this.parent instanceof OutbreakTemplateModel ?
                    PERMISSION.WRITE_SYS_CONFIG :
                    PERMISSION.WRITE_OUTBREAK
            ) :
            false;
    }

    /**
     * Change question position
     * @param questionIndex
     */
    moveQuestionAbove(questionIndex: number) {
        this.changeQuestionPosition(
            questionIndex,
            questionIndex - 1
        );
    }

    /**
     * Change question position
     * @param questionIndex
     */
    moveQuestionBellow(questionIndex: number) {
        this.changeQuestionPosition(
            questionIndex,
            questionIndex + 1
        );
    }

    /**
     * Change question position
     */
    private changeQuestionPosition(
        currentPosition: number,
        newPosition: number
    ) {
        // nothing to change ?
        if (currentPosition === newPosition) {
            return;
        }

        // restrict min value
        if (newPosition < 0) {
            newPosition = 0;
        }

        // restrict max value
        if (newPosition > this.questionnaireData.length) {
            newPosition = this.questionnaireData.length;
        }

        // need to remove next item since a new one was added before this one meaning that the index has changed
        const newPosBeforeCurrent: boolean = newPosition < currentPosition;

        // no need to anything if we don't have any data :)
        if (
            !_.isEmpty(this.questionnaireData) &&
            !_.isEmpty(this.questionnaireData[currentPosition])
        ) {
            // push question to the new position
            this.questionnaireData.splice(
                newPosition + (newPosBeforeCurrent ? 0 : 1),
                0,
                this.questionnaireData[currentPosition]
            );

            // delete old position
            this.questionnaireData.splice(
                currentPosition + (newPosBeforeCurrent ? 1 : 0),
                1
            );
        }

        // update questions order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // emit questionnaire save
        this.emitUpdateQuestionnaire(false);
    }

    /**
     * Move question answer above
     * @param answerIndex
     */
    moveAnswerAbove(answerIndex: number) {
        this.changeQuestionAnswerPosition(
            answerIndex,
            answerIndex - 1
        );
    }

    /**
     * Move question answer bellow
     * @param answerIndex
     */
    moveAnswerBellow(answerIndex: number) {
        this.changeQuestionAnswerPosition(
            answerIndex,
            answerIndex + 1
        );
    }

    /**
     * Change question position
     */
    private changeQuestionAnswerPosition(
        currentAnswerPosition: number,
        newAnswerPosition: number
    ) {
        // nothing to change ?
        if (currentAnswerPosition === newAnswerPosition) {
            return;
        }

        // answer are initialized ?
        if (_.isEmpty(this.questionInEditModeClone.answers)) {
            return;
        }

        // restrict min value
        if (newAnswerPosition < 0) {
            newAnswerPosition = 0;
        }

        // restrict max value
        if (newAnswerPosition > this.questionInEditModeClone.answers.length) {
            newAnswerPosition = this.questionInEditModeClone.answers.length;
        }

        // need to remove next item since a new one was added before this one meaning that the index has changed
        const newPosBeforeCurrent: boolean = newAnswerPosition < currentAnswerPosition;

        // push question to the new position
        this.questionInEditModeClone.answers.splice(
            newAnswerPosition + (newPosBeforeCurrent ? 0 : 1),
            0,
            this.questionInEditModeClone.answers[currentAnswerPosition]
        );

        // delete old position
        this.questionInEditModeClone.answers.splice(
            currentAnswerPosition + (newPosBeforeCurrent ? 1 : 0),
            1
        );

        // update questions order
        this.setQuestionnaireQuestionsOrder(
            [this.questionInEditModeClone],
            false
        );

        // mark form as dirty
        this.markQuestionFormDirty();
    }

    /**
     * Save questionnaire
     */
    private emitUpdateQuestionnaire(
        blockWhileSaving: boolean = true
    ) {
        // can we emit breadcrumb event ?
        if (
            !_.isEmpty(this.parent) &&
            !_.isEmpty(this.questionnaireType)
        ) {
            // data clone
            const questionnaireCloneData: QuestionModel[] = _.isEmpty(this.questionnaireData) ?
                this.questionnaireData : _.map(this.questionnaireData, (question: QuestionModel) => {
                    return new QuestionModel(question);
                });

            // call event
            this.savingData = blockWhileSaving;
            this.updateQuestionnaire.emit(new FormModifyQuestionnaireUpdateData(
                this.parent,
                this.questionnaireType,
                questionnaireCloneData,
                Subscriber.create((success) => {
                    // success saving questionnaire ?
                    if (!success) {
                        // #TODO
                        // we can't rollback..so..what now ? try again, or disable questionnaire ?
                    }

                    // finished saving data
                    this.savingData = false;
                })
            ));
        }
    }

    /**
     * Modify Question
     * @param questionIndex
     */
    modifyQuestion(questionIndex: number) {
        // make some validations just to be sure
        if (
            !_.isEmpty(this.questionnaireData) &&
            !_.isEmpty(this.questionnaireData[questionIndex])
        ) {
            // set question edit mode
            this.questionIndexInEditMode = questionIndex;
            this.questionInEditModeClone = new QuestionModel(this.questionnaireData[questionIndex]);
            this.questionInEditModeClone.new = this.questionnaireData[questionIndex].new;
            this.questionInEditModeClone.uuid = this.questionnaireData[questionIndex].uuid;

            // edit mode changed
            this.questionEditModeChanged.emit(true);

            // set focus on the new question
            this.domService.scrollItemIntoView(
                `#${this.uniqueIDQuestion}`,
                'nearest'
            );
        }
    }

    /**
     * Modify Question Answer
     */
    modifyAnswer(answerIndex: number) {
        // make some validations just to be sure
        if (
            !_.isEmpty(this.questionInEditModeClone) &&
            !_.isEmpty(this.questionInEditModeClone.answers) &&
            !_.isEmpty(this.questionInEditModeClone.answers[answerIndex])
        ) {
            // set answer edit mode
            this.questionAnswerIndexInEditMode = answerIndex;
            this.questionAnswerInEditModeClone = new AnswerModel(this.questionInEditModeClone.answers[answerIndex]);
            this.questionAnswerInEditModeClone.new = this.questionInEditModeClone.answers[answerIndex].new;

            // create object to overwrite main questionnaires
            const overWriteData: {
                [prop: string]: QuestionModel[]
            } = {};
            _.each(
                Object.values(OutbreakQestionnaireTypeEnum),
                (prop: string) => {
                    overWriteData[prop] = [];
                }
            );

            // set our questions
            overWriteData[this.questionnaireType] = this.questionAnswerInEditModeClone.additionalQuestions;

            // create dummy parent
            const data = {
                ...this.parent,
                ...overWriteData
            };
            if (this.parent instanceof OutbreakTemplateModel) {
                // outbreak template
                this.questionAnswerDummyParent = new OutbreakTemplateModel(data);
            } else {
                // outbreak
                this.questionAnswerDummyParent = new OutbreakModel(data);
            }

            // set focus on the new answer
            this.domService.scrollItemIntoView(
                `#${this.uniqueIDAnswer}`,
                'nearest'
            );
        }
    }

    /**
     * Clone Question
     * @param questionIndex
     */
    cloneQuestion(questionIndex: number) {
        // #TODO
        alert('Work in progress');
    }

    /**
     * Clone Question Answer
     */
    cloneAnswer(answerIndex: number) {
        // #TODO
        alert('Work in progress');
    }

    /**
     * Delete Question
     * @param questionIndex
     */
    deleteQuestion(questionIndex: number) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete question
                    this.questionnaireData.splice(questionIndex, 1);

                    // update order
                    this.setQuestionnaireQuestionsOrder(
                        this.questionnaireData,
                        false
                    );

                    // save questionnaire
                    this.emitUpdateQuestionnaire(false);
                }
            });
    }

    /**
     * Delete Question Answer
     */
    deleteAnswer(answerIndex: number) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION_ANSWER')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // delete question
                    this.questionInEditModeClone.answers.splice(answerIndex, 1);

                    // update order
                    this.setQuestionnaireQuestionsOrder(
                        [this.questionInEditModeClone],
                        false
                    );

                    // mark form as dirty
                    this.markQuestionFormDirty();
                }
            });
    }

    /**
     * Cancel question edit
     */
    cancelModifyQuestion() {
        // check for changes and display popup
        // need to implement viewModifyComponent so it checks if we try to change the page or close window etc..too
        if (this.questionInEditModeClone.new) {
            // new question, ask if he wants to revert back
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_NEW_QUESTION')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        // delete question
                        this.questionnaireData.splice(this.questionIndexInEditMode, 1);

                        // update order
                        this.setQuestionnaireQuestionsOrder(
                            this.questionnaireData,
                            false
                        );

                        // cancel question edit
                        this.resetQuestionEditMode();
                    }
                });
        } else {
            // check if changes were made and display message that changes will be lost
            if (this.questionForm.dirty) {
                // made changes that will be lost if we cancel
                this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_LOOSE_CHANGES_QUESTION')
                    .subscribe((answer: DialogAnswer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            // cancel question edit
                            this.resetQuestionEditMode();
                        }
                    });
            } else {
                // cancel question edit
                this.resetQuestionEditMode();
            }
        }
    }

    /**
     * Reset question edit mode
     */
    private resetQuestionEditMode() {
        // reset answer edit mode
        this.resetQuestionAnswerEditMode();

        // reset question edit mode
        this.questionIndexInEditMode = null;
        this.questionInEditModeClone = null;

        // edit mode changed
        this.questionEditModeChanged.emit(false);
    }

    /**
     * Reset question answer edit mode
     */
    private resetQuestionAnswerEditMode() {
        // reset answer edit mode
        this.questionAnswerIndexInEditMode = null;
        this.questionAnswerInEditModeClone = null;
        this.questionAnswerDummyParent = null;
    }

    /**
     * Save Question
     */
    saveModifyQuestion() {
        // take in account that we could change a child question too...
        // this applies to saving question validation too..since it won't validate to the end since a new component is included for additional questions
        // #TODO
        // childQuestionIsInEditMode + answerForm

        // validate form
        if (
            !this.questionForm ||
            !this.formHelper.validateForm(this.questionForm)
        ) {
            return;
        }

        // replace question with the one we just changed
        const isNew: boolean = this.questionInEditModeClone.new;
        delete this.questionInEditModeClone.new;
        this.questionnaireData[this.questionIndexInEditMode] = this.questionInEditModeClone;

        // sort questions
        this.questionnaireData = this.sortQuestionnaireQuestions(this.questionnaireData);

        // reset question order
        this.setQuestionnaireQuestionsOrder(this.questionnaireData);

        // get variables so we don't allow duplicates
        if (isNew) {
            this.determineQuestionnaireVariables();
        }

        // stop question edit
        this.resetQuestionEditMode();

        // save question
        this.emitUpdateQuestionnaire(false);
    }

    /**
     * Mark question form dirty
     */
    markQuestionFormDirty() {
        if (
            this.questionForm &&
            this.inputQuestionForMakingFormDirty
        ) {
            this.inputQuestionForMakingFormDirty.control.markAsDirty();
        }
    }

    /**
     * Mark answer form dirty
     */
    markAnswerFormDirty() {
        if (
            this.answerForm &&
            this.inputAnswerForMakingFormDirty
        ) {
            // mark answer form as dirty
            this.inputAnswerForMakingFormDirty.control.markAsDirty();

            // mark question form as dirty
            this.markQuestionFormDirty();
        }
    }

    /**
     * Update Answer Additional Questions
     */
    updateAnswerAdditionalQuestions(questionnaireData: FormModifyQuestionnaireUpdateData) {
        // update answer additional questions
        this.questionAnswerInEditModeClone.additionalQuestions = questionnaireData.questionnaire;

        // get variables so we don't allow duplicates
        this.determineQuestionnaireVariables();

        // mark answer form as dirty
        this.markAnswerFormDirty();
    }

    /**
     * Cancel Modify answer
     */
    cancelModifyAnswer() {
        // check for changes and display popup
        // need to implement viewModifyComponent so it checks if we try to change the page or close window etc..too
        if (this.questionAnswerInEditModeClone.new) {
            // new answer, ask if he wants to revert back
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_NEW_QUESTION_ANSWER')
                .subscribe((answer: DialogAnswer) => {
                    if (answer.button === DialogAnswerButton.Yes) {
                        // delete question
                        this.questionInEditModeClone.answers.splice(this.questionAnswerIndexInEditMode, 1);

                        // update order
                        this.setQuestionnaireQuestionsOrder(
                            [this.questionInEditModeClone],
                            false
                        );

                        // cancel answer edit
                        this.resetQuestionAnswerEditMode();
                    }
                });
        } else {
            // check if changes were made and display message that changes will be lost
            if (this.questionForm.dirty) {
                // made changes that will be lost if we cancel
                this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_LOOSE_CHANGES_QUESTION_ANSWER')
                    .subscribe((answer: DialogAnswer) => {
                        if (answer.button === DialogAnswerButton.Yes) {
                            // cancel answer edit
                            this.resetQuestionAnswerEditMode();
                        }
                    });
            } else {
                // cancel answer edit
                this.resetQuestionAnswerEditMode();
            }
        }
    }

    /**
     * Update answer data - no save
     */
    updateAnswerData() {
        // take in account that we could change a child question too...
        // this applies to saving question validation too..since it won't validate to the end since a new component is included for additional questions
        // #TODO
        // childQuestionIsInEditMode

        // validate answer form without validating parent question...
        if (
            !this.answerForm ||
            !this.formHelper.validateForm(this.answerForm)
        ) {
            return;
        }

        // replace answer with the new one
        delete this.questionAnswerInEditModeClone.new;
        this.questionInEditModeClone.answers[this.questionAnswerIndexInEditMode] = this.questionAnswerInEditModeClone;

        // stop answer edit
        this.resetQuestionAnswerEditMode();

        // mark main form as dirty
        this.markQuestionFormDirty();
    }

    /**
     * Add a new question
     */
    addNewQuestion() {
        // check if we need to initialize questionnaire
        if (_.isEmpty(this.questionnaireData)) {
            this.questionnaireData = [];
        }

        // push a new question
        const question: QuestionModel = new QuestionModel({
            order: 99999
        });
        question.new = true;
        this.questionnaireData.push(question);

        // sort not needed since we always add questions at the end
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // start modifying the new question
        this.modifyQuestion(this.questionnaireData.length - 1);
    }

    /**
     * Sanitize order value => convert string to int
     */
    setOrderValue(
        object: QuestionModel | AnswerModel,
        value: string | null
    ) {
        if (_.isString(value)) {
            if (value.length > 0) {
                object.order = parseFloat(value);
            }
        } else {
            object.order = value as any;
        }
    }

    /**
     * Add new question answer
     */
    addNewAnswer() {
        // check if we need to initialize answers
        if (_.isEmpty(this.questionInEditModeClone.answers)) {
            this.questionInEditModeClone.answers = [];
        }

        // push a new answer
        const answer: AnswerModel = new AnswerModel({
            order: 99999
        });
        answer.new = true;
        this.questionInEditModeClone.answers.push(answer);

        // sort not needed since we always add answers at the end
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            [this.questionInEditModeClone],
            false
        );

        // start modifying the new answer
        this.modifyAnswer(this.questionInEditModeClone.answers.length - 1);

        // mark main form as dirty
        this.markQuestionFormDirty();
    }

    /**
     * Triggered when additional question edit mode has changed
     */
    questionEditModeChangedHandler(isInEditMode: boolean) {
        this.childQuestionIsInEditMode = isInEditMode;
    }
}
