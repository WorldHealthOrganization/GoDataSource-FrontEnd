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
        public outbreak: OutbreakModel | OutbreakTemplateModel,
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

    // template used
    questionnaireType: OutbreakQestionnaireTypeEnum;

    // questionnaire data
    questionnaireData: QuestionModel[];

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
     * Form dirty
     */
    @ViewChild('form') form: NgForm;

    /**
     * Used to mark form dirty
     */
    @ViewChild('inputForMakingFormDirty') inputForMakingFormDirty: NgModel;

    /**
     * Breadcrumbs init
     */
    @Output() initBreadcrumbs = new EventEmitter<FormModifyQuestionnaireBreadcrumbsData>();

    /**
     * Save outbreak questionnaire
     */
    @Output() updateQuestionnaire = new EventEmitter<FormModifyQuestionnaireUpdateData>();

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
                        // #TODO - delete after
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
                        // accumulator.push(new QuestionModel(question));
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
     * Check if we have write access to outbreaks
     * @returns {boolean}
     */
    hasOutbreakWriteAccess(): boolean {
        return this.authUser.hasPermissions(PERMISSION.WRITE_OUTBREAK);
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
        this.markFormDirty();
    }

    /**
     * Save questionnaire
     */
    private emitUpdateQuestionnaire() {
        // can we emit breadcrumb event ?
        if (
            !_.isEmpty(this.parent) &&
            !_.isEmpty(this.questionnaireType)
        ) {
            // call event
            this.savingData = true;
            this.updateQuestionnaire.emit(new FormModifyQuestionnaireUpdateData(
                this.parent,
                this.questionnaireType,
                this.questionnaireData,
                Subscriber.create((success) => {
                    // success saving questionnaire ?
                    if (success) {
                        // no question in edit mode
                        this.resetQuestionEditMode();
                    } else {
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
     * View Question
     * @param questionIndex
     */
    viewQuestion(questionIndex: number) {
        // #TODO
    }

    /**
     * View Question Answer
     */
    viewAnswer(answerIndex: number) {
        // #TODO
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
        }
    }

    /**
     * Clone Question
     * @param questionIndex
     */
    cloneQuestion(questionIndex: number) {
        // #TODO
    }

    /**
     * Clone Question Answer
     */
    cloneAnswer(answerIndex: number) {
        // #TODO
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
                    this.emitUpdateQuestionnaire();
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
                    this.markFormDirty();
                }
            });
    }

    /**
     * Cancel question edit
     */
    cancelModifyQuestion() {
        // check for changes and display popup
        // need to implement viewModifyComponent so it checks if we try to change the page or close window etc..too
        // #TODO

        // cancel question edit
        this.resetQuestionEditMode();
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
        // validate form
        if (
            !this.form ||
            !this.formHelper.validateForm(this.form)
        ) {
            return;
        }

        // replace question with the one we just changed
        this.questionnaireData[this.questionIndexInEditMode] = this.questionInEditModeClone;

        // sort questions
        this.questionnaireData = this.sortQuestionnaireQuestions(this.questionnaireData);

        // reset question order
        this.setQuestionnaireQuestionsOrder(this.questionnaireData);

        // stop question edit
        this.resetQuestionEditMode();

        // save question
        this.emitUpdateQuestionnaire();
    }

    /**
     * Mark form dirty
     */
    markFormDirty() {
        if (
            this.form &&
            this.inputForMakingFormDirty
        ) {
            this.inputForMakingFormDirty.control.markAsDirty();
        }
    }

    /**
     * Update Answer Additional Questions
     */
    updateAnswerAdditionalQuestions(questionnaireData: FormModifyQuestionnaireUpdateData) {
        // #TODO
        // this.questionAnswerIndexInEditMode
        console.log('updateAnswerAdditionalQuestions', questionnaireData);
    }

    /**
     * Cancel Modify answer
     */
    cancelModifyAnswer() {
        // check for changes and display popup
        // need to implement viewModifyComponent so it checks if we try to change the page or close window etc..too
        // #TODO

        // cancel question edit
        this.resetQuestionAnswerEditMode();
    }

    /**
     * Update answer data - no save
     */
    updateAnswerData() {
        // validate answer form without validating parent question...
        // take in account that we could change a child question too...
        // this applies to saving question validation too..since it won't validate to the end since a new component is included for additional questions
        // #TODO

        // replace answer with the new one
        this.questionInEditModeClone.answers[this.questionAnswerIndexInEditMode] = this.questionAnswerInEditModeClone;

        // stop answer edit
        this.resetQuestionAnswerEditMode();
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
        this.questionnaireData.push(new QuestionModel({
            order: 99999
        }));

        // sort not needed since we always add questions at the end
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // start modifying the new question
        this.modifyQuestion(this.questionnaireData.length - 1);

        // set focus on the new question
        this.domService.scrollItemIntoView(
            '.modify-questionnaire-edit-question'
        );
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
}
