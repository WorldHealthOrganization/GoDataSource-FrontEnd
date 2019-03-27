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
import { DialogAnswer, DialogAnswerButton, DialogConfiguration, DialogField, DialogFieldType } from '../dialog/dialog.component';
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
import { FormInputComponent } from '../../xt-forms/components/form-input/form-input.component';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import 'rxjs/add/observable/forkJoin';
import { Observable } from 'rxjs/Observable';
import { HoverRowActions, HoverRowActionsType } from '../hover-row-actions/hover-row-actions.component';

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
     * Loading data
     */
    loadingData: boolean = true;

    /**
     * List of categories for a form-question
     */
    questionCategoriesInstantList: LabelValuePair[];

    /**
     * List of answer types
     */
    answerTypesInstantList: LabelValuePair[];

    /**
     * List of answers display orientations
     */
    answersDisplayInstantList: LabelValuePair[];

    /**
     * Child question is in edit mode ?
     */
    childQuestionIsInEditMode: boolean = false;

    /**
     * Question Actions
     */
    questionActions: HoverRowActions[] = [];

    /**
     * Question Answer Actions
     */
    answerActions: HoverRowActions[] = [];

    /**
     * Allow question variable change
     */
    @Input() allowQuestionVariableChange: boolean = false;

    /**
     * Remove new / uuid / clone flags when saving data
     */
    @Input() cleanQuestionAndAnswerFlagsOnSave: boolean = true;

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
     * Question text input
     */
    @ViewChild('questionText') questionText: FormInputComponent;

    /**
     * Question Answer label input
     */
    @ViewChild('answerLabel') answerLabel: FormInputComponent;

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
        private domService: DomService,
        private snackbarService: SnackbarService
    ) {
        super();
    }

    /**
     * Initialized
     */
    ngOnInit() {
        // get the authenticated user
        this.authUser = this.authDataService.getAuthenticatedUser();

        // on language change..we need to translate again question data
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.initQuestionnaireData();
        });

        // retrieve data
        Observable.forkJoin([
            this.referenceDataDataService.getReferenceDataByCategoryAsLabelValue(ReferenceDataCategory.QUESTION_CATEGORY),
            this.genericDataService.getAnswerTypesList(),
            this.genericDataService.getAnswersDisplayOrientationsList(),
        ]).subscribe(([
            questionCategoriesList,
            answerTypesInstantList,
            answersDisplayInstantList
        ]: [
            LabelValuePair[],
            any[],
            any[]
        ]) => {
            // set edit options
            this.questionCategoriesInstantList = questionCategoriesList;
            this.answerTypesInstantList = answerTypesInstantList;
            this.answersDisplayInstantList = answersDisplayInstantList;

            // questionnaire data
            this.route.data.subscribe((routeData: { questionnaire: OutbreakQestionnaireTypeEnum }) => {
                // set questionnaire data
                this.questionnaireType = routeData.questionnaire;

                // emit breadcrumbs event
                this.emitBreadcrumbEvent();

                // init questionnaire data
                this.initQuestionnaireData();

                // finished loading data
                setTimeout(() => {
                    this.loadingData = false;
                });
            });
        });
    }

    /**
     * Initialize question actions
     */
    private initQuestionActions() {
        // init question actions
        this.questionActions = [];

        // add question actions that require write permissions
        if (this.hasWriteAccess()) {
            // question settings
            this.questionActions.push(new HoverRowActions({
                icon: 'settings',
                click: (questionIndex) => {
                    this.modifyQuestion(questionIndex);
                }
            }));

            // move question above
            this.questionActions.push(new HoverRowActions({
                icon: 'arrowAUp',
                click: (questionIndex) => {
                    this.moveQuestionAbove(questionIndex);
                }
            }));

            // move question bellow
            this.questionActions.push(new HoverRowActions({
                icon: 'arrowADown',
                click: (questionIndex) => {
                    this.moveQuestionBellow(questionIndex);
                }
            }));

            // other options
            this.questionActions.push(new HoverRowActions({
                type: HoverRowActionsType.MENU,
                icon: 'moreVertical',
                menuOptions: [
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_TO_POSITION_X',
                        click: (questionIndex) => {
                            this.addMoveQuestionPosition(questionIndex);
                        }
                    }),
                    new HoverRowActions({
                        type: HoverRowActionsType.DIVIDER
                    }),
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_PAGE_ACTION_CLONE',
                        click: (questionIndex) => {
                            this.cloneQuestion(questionIndex);
                        }
                    }),
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_PAGE_ACTION_DELETE',
                        click: (questionIndex) => {
                            this.deleteQuestion(questionIndex);
                        },
                        class: 'mat-menu-item-delete'
                    })
                ]
            }));
        }
    }

    /**
     * Initialize question answer actions
     */
    private initQuestionAnswerActions() {
        // init question actions
        this.answerActions = [];

        // add answer actions that require write permissions
        if (this.hasWriteAccess()) {
            // answer settings
            this.answerActions.push(new HoverRowActions({
                icon: 'settings',
                click: (answerIndex) => {
                    this.modifyAnswer(answerIndex);
                }
            }));

            // move answer above
            this.answerActions.push(new HoverRowActions({
                icon: 'arrowAUp',
                click: (answerIndex) => {
                    this.moveAnswerAbove(answerIndex);
                }
            }));

            // move answer bellow
            this.answerActions.push(new HoverRowActions({
                icon: 'arrowADown',
                click: (answerIndex) => {
                    this.moveAnswerBellow(answerIndex);
                }
            }));

            // other options
            this.answerActions.push(new HoverRowActions({
                type: HoverRowActionsType.MENU,
                icon: 'moreVertical',
                menuOptions: [
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_QUESTIONNAIRE_TEMPLATE_ACTION_MOVE_QUESTION_ANSWER_TO_POSITION_X',
                        click: (answerIndex) => {
                            this.addMoveQuestionAnswerPosition(answerIndex);
                        }
                    }),
                    new HoverRowActions({
                        type: HoverRowActionsType.DIVIDER
                    }),
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_PAGE_ACTION_CLONE',
                        click: (answerIndex) => {
                            this.cloneAnswer(answerIndex);
                        }
                    }),
                    new HoverRowActions({
                        menuOptionLabel: 'LNG_PAGE_ACTION_DELETE',
                        click: (answerIndex) => {
                            this.deleteAnswer(answerIndex);
                        },
                        class: 'mat-menu-item-delete'
                    })
                ]
            }));
        }
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
                        accumulator.push(new QuestionModel(question, true));
                    },
                    []
                );

            // format data
            this.sanitizeQuestionnaireData();

            // init question actions
            this.initQuestionActions();

            // init question answer actions
            this.initQuestionAnswerActions();
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
        const maps: {
            [uuid: string]: string
        } = {};
        this.questionVariables = { ...this.extraQuestionVariables };

        // add variables to array of variables
        const getQuestionVariables = (questions: QuestionModel[]) => {
            _.each(questions, (question: QuestionModel) => {
                // add variable to list
                if (question.variable) {
                    // check if we don't have one already set
                    if (maps[question.uuid]) {
                        delete this.questionVariables[maps[question.uuid]];
                    }

                    // set the new variable
                    const uniqueVar: string = question.variable.toLowerCase();
                    if (!this.questionVariables[uniqueVar]) {
                        this.questionVariables[uniqueVar] = question.uuid;
                        maps[question.uuid] = uniqueVar;
                    }
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
        if (this.questionInEditModeClone) {
            getQuestionVariables([this.questionInEditModeClone]);
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
            if (!question.uuid) {
                question.uuid = uuid();
            }

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

        // update questions answers order
        const previousQuestionOrder: number = this.questionInEditModeClone.order;
        this.setQuestionnaireQuestionsOrder(
            [this.questionInEditModeClone],
            false
        );
        this.questionInEditModeClone.order = previousQuestionOrder;

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
                    return new QuestionModel(
                        question,
                        !this.cleanQuestionAndAnswerFlagsOnSave
                    );
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
                        // we can't rollback..so..what now ? try again, or disable questionnaire ?
                        this.snackbarService.showError('LNG_PAGE_MODIFY_OUTBREAK_QUESTIONNAIRE_ERROR_SAVING_QUESTIONNAIRE');
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
    modifyQuestion(
        questionIndex: number,
        focusTextBox: boolean = false,
        startDirty: boolean = false
    ) {
        // make some validations just to be sure
        if (
            !_.isEmpty(this.questionnaireData) &&
            !_.isEmpty(this.questionnaireData[questionIndex])
        ) {
            // set question edit mode
            this.questionIndexInEditMode = questionIndex;
            this.questionInEditModeClone = new QuestionModel(
                this.questionnaireData[questionIndex],
                true
            );

            // edit mode changed
            this.questionEditModeChanged.emit(true);

            // set focus on the new question
            this.domService.scrollItemIntoView(
                `#${this.uniqueIDQuestion}`,
                'nearest'
            );
        }

        // wait for binding
        if (focusTextBox) {
            setTimeout(() => {
                // focus text input
                if (this.questionText) {
                    this.questionText.focus();
                    this.questionText.select();
                }
            });
        }

        // start dirty ?
        if (startDirty) {
            setTimeout(() => {
                // mark form as dirty
                this.markQuestionFormDirty();
            });
        }
    }

    /**
     * Modify Question Answer
     */
    modifyAnswer(
        answerIndex: number,
        focusTextBox: boolean = false,
        startDirty: boolean = false
    ) {
        // make some validations just to be sure
        if (
            !_.isEmpty(this.questionInEditModeClone) &&
            !_.isEmpty(this.questionInEditModeClone.answers) &&
            !_.isEmpty(this.questionInEditModeClone.answers[answerIndex])
        ) {
            // set answer edit mode
            this.questionAnswerIndexInEditMode = answerIndex;
            this.questionAnswerInEditModeClone = new AnswerModel(
                this.questionInEditModeClone.answers[answerIndex],
                true
            );

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

            // set our questions
            this.questionAnswerDummyParent[this.questionnaireType] = this.questionAnswerInEditModeClone.additionalQuestions;

            // set focus on the new answer
            this.domService.scrollItemIntoView(
                `#${this.uniqueIDAnswer}`,
                'nearest'
            );
        }

        // wait for binding
        if (focusTextBox) {
            setTimeout(() => {
                // focus text input
                if (this.answerLabel) {
                    this.answerLabel.focus();
                    this.answerLabel.select();
                }
            });
        }

        // start dirty ?
        if (startDirty) {
            setTimeout(() => {
                this.markAnswerFormDirty();
            });
        }
    }

    /**
     * Clone Question
     * @param questionIndex
     */
    cloneQuestion(questionIndex: number) {
        // clone question
        const question: QuestionModel = new QuestionModel(this.questionnaireData[questionIndex]);
        question.new = true;
        question.clone = true;
        this.questionnaireData.push(question);

        // allow variable change
        this.allowQuestionVariableChange = true;

        // update variables callback
        const setCloneQuestionVariables = (childQuestions: QuestionModel[]) => {
            _.each(childQuestions, (childQuestion: QuestionModel) => {
                // set the new variable
                childQuestion.variable = `${childQuestion.variable}_clone_${uuid()}`;
                childQuestion.uuid = uuid();

                // check answer questions
                _.each(childQuestion.answers, (answer: AnswerModel) => {
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        setCloneQuestionVariables(answer.additionalQuestions);
                    }
                });
            });
        };

        // update variables
        setCloneQuestionVariables([question]);

        // determine variables to be used in duplicates
        this.determineQuestionnaireVariables();

        // sort not needed since we always add questions at the end and all questions are already sorted
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // start modifying the new question
        this.modifyQuestion(
            this.questionnaireData.length - 1,
            true,
            true
        );
    }

    /**
     * Clone Question Answer
     */
    cloneAnswer(answerIndex: number) {
        // clone answer
        const answer: AnswerModel = new AnswerModel(this.questionInEditModeClone.answers[answerIndex]);
        answer.new = true;
        answer.clone = true;
        this.questionInEditModeClone.answers.push(answer);

        // allow variable change
        this.allowQuestionVariableChange = true;

        // update variables callback
        const setCloneQuestionVariables = (childQuestions: QuestionModel[]) => {
            _.each(childQuestions, (childQuestion: QuestionModel) => {
                // set the new variable
                childQuestion.variable = `${childQuestion.variable}_clone_${uuid()}`;
                childQuestion.uuid = uuid();

                // check answer questions
                _.each(childQuestion.answers, (childAnswer: AnswerModel) => {
                    if (!_.isEmpty(childAnswer.additionalQuestions)) {
                        setCloneQuestionVariables(childAnswer.additionalQuestions);
                    }
                });
            });
        };

        // update variables
        if (!_.isEmpty(answer.additionalQuestions)) {
            setCloneQuestionVariables(answer.additionalQuestions);
        }

        // determine variables to be used in duplicates
        this.determineQuestionnaireVariables();

        // sort not needed since we always add questions at the end and all questions are already sorted
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // start modifying the new question
        this.modifyAnswer(
            this.questionInEditModeClone.answers.length - 1,
            true,
            true
        );
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
                    const previousQuestionOrder: number = this.questionInEditModeClone.order;
                    this.setQuestionnaireQuestionsOrder(
                        [this.questionInEditModeClone],
                        false
                    );
                    this.questionInEditModeClone.order = previousQuestionOrder;

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
                        // reset allow variable change
                        if (this.questionInEditModeClone.clone) {
                            this.allowQuestionVariableChange = false;
                            delete this.questionInEditModeClone.clone;
                        }

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
        // validate form
        if (
            !this.questionForm ||
            !this.formHelper.validateForm(this.questionForm)
        ) {
            return;
        }

        // clean new flag
        const isNew: boolean = this.questionInEditModeClone.new;
        delete this.questionInEditModeClone.new;

        // clean answers
        if (
            this.questionInEditModeClone.answerType !== this.answerTypes.MULTIPLE_OPTIONS.value &&
            this.questionInEditModeClone.answerType !== this.answerTypes.SINGLE_SELECTION.value
        ) {
            this.questionInEditModeClone.answers = [];
        }

        // replace question with the one we just changed
        this.questionnaireData[this.questionIndexInEditMode] = this.questionInEditModeClone;

        // sort questions
        this.questionnaireData = this.sortQuestionnaireQuestions(this.questionnaireData);

        // reset question order
        this.setQuestionnaireQuestionsOrder(this.questionnaireData);

        // get variables so we don't allow duplicates
        if (
            isNew ||
            this.allowQuestionVariableChange
        ) {
            this.determineQuestionnaireVariables();
        }

        // reset allow variable change
        if (this.questionInEditModeClone.clone) {
            this.allowQuestionVariableChange = false;
            delete this.questionInEditModeClone.clone;
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
                        // reset allow variable change
                        if (this.questionAnswerInEditModeClone.clone) {
                            this.allowQuestionVariableChange = false;
                            delete this.questionAnswerInEditModeClone.clone;
                        }

                        // delete question
                        this.questionInEditModeClone.answers.splice(this.questionAnswerIndexInEditMode, 1);

                        // update order
                        const previousQuestionOrder: number = this.questionInEditModeClone.order;
                        this.setQuestionnaireQuestionsOrder(
                            [this.questionInEditModeClone],
                            false
                        );
                        this.questionInEditModeClone.order = previousQuestionOrder;

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

        // reset allow variable change
        if (this.questionAnswerInEditModeClone.clone) {
            this.allowQuestionVariableChange = false;
            delete this.questionAnswerInEditModeClone.clone;
        }

        // stop answer edit
        this.resetQuestionAnswerEditMode();

        // mark main form as dirty
        this.markQuestionFormDirty();
    }

    /**
     * Add a new question
     */
    addNewQuestion(position?: number) {
        // check if we need to initialize questionnaire
        if (_.isEmpty(this.questionnaireData)) {
            this.questionnaireData = [];
        }

        // push a new question
        const question: QuestionModel = new QuestionModel();
        question.new = true;
        question.uuid = uuid();

        // add question at the end
        if (position === undefined) {
            this.questionnaireData.push(question);
            position = this.questionnaireData.length - 1;
        } else {
            // make sure position is between limits
            if (position < 0) {
                position = 0;
            } else if (position > this.questionnaireData.length) {
                position = this.questionnaireData.length;
            }

            // add it a specific position
            // push question to the new position
            this.questionnaireData.splice(
                position,
                0,
                question
            );
        }

        // sort not needed since we always add questions at the end and all questions are already sorted
        // NOTHING

        // set question order
        this.setQuestionnaireQuestionsOrder(
            this.questionnaireData,
            false
        );

        // start modifying the new question
        this.modifyQuestion(
            position,
            true
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

    /**
     * Add new question answer
     */
    addNewAnswer(position?: number) {
        // check if we need to initialize answers
        if (_.isEmpty(this.questionInEditModeClone.answers)) {
            this.questionInEditModeClone.answers = [];
        }

        // push a new answer
        const answer: AnswerModel = new AnswerModel();
        answer.new = true;

        // add question at the end
        if (position === undefined) {
            this.questionInEditModeClone.answers.push(answer);
            position = this.questionInEditModeClone.answers.length - 1;
        } else {
            // make sure position is between limits
            if (position < 0) {
                position = 0;
            } else if (position > this.questionInEditModeClone.answers.length) {
                position = this.questionInEditModeClone.answers.length;
            }

            // add it a specific position
            // push question to the new position
            this.questionInEditModeClone.answers.splice(
                position,
                0,
                answer
            );
        }

        // sort not needed since we always add answers at the end
        // NOTHING

        // set question order
        const previousQuestionOrder: number = this.questionInEditModeClone.order;
        this.setQuestionnaireQuestionsOrder(
            [this.questionInEditModeClone],
            false
        );
        this.questionInEditModeClone.order = previousQuestionOrder;

        // start modifying the new answer
        this.modifyAnswer(
            position,
            true
        );

        // mark main form as dirty
        this.markQuestionFormDirty();
    }

    /**
     * Triggered when additional question edit mode has changed
     */
    questionEditModeChangedHandler(isInEditMode: boolean) {
        this.childQuestionIsInEditMode = isInEditMode;
    }

    /**
     * Question Answer changed
     */
    questionAnswerTypeChanged(value: LabelValuePair) {
        // there shouldn't be a way to not be in edit mode, but it is good to check anyway
        if (_.isEmpty(this.questionInEditModeClone)) {
            return;
        }

        // check if we need to add a new answer
        if (
            value.value === this.answerTypes.MULTIPLE_OPTIONS.value ||
            value.value === this.answerTypes.SINGLE_SELECTION.value
        ) {
            // add a new answer only if we don't have answers already
            if (_.isEmpty(this.questionInEditModeClone.answers)) {
                // add a new answer and start editing it
                this.addNewAnswer();
            }
        }
    }

    /**
     * Question Text input blur event
     * @param value - Input Value
     */
    questionTextBlurred(value: string) {
        if (
            this.questionInEditModeClone.new ||
            this.allowQuestionVariableChange
        ) {
            // set variable
            this.questionInEditModeClone.variable = _.camelCase(value);

            // update variables
            this.determineQuestionnaireVariables();
        }
    }

    /**
     * Question Variable input blur event
     * @param value - Input Value
     */
    questionVariableBlurred(value: string) {
        if (
            this.questionInEditModeClone.new ||
            this.allowQuestionVariableChange
        ) {
            // set variable
            this.questionInEditModeClone.variable = _.trim(value);

            // update variables
            this.determineQuestionnaireVariables();
        }
    }

    /**
     * Display dialog that asks user where to add the question
     */
    addMoveQuestionPosition(questionIndex?: number) {
        // check if this is a new question or we want to move an existing one
        const isNewQuestion: boolean = questionIndex === undefined;

        // display dialog
        this.dialogService.showConfirm(new DialogConfiguration({
            message: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_POSITION_DIALOG_CONFIRM_MSG',
            yesLabel: isNewQuestion ? 'LNG_COMMON_BUTTON_ADD' : 'LNG_COMMON_BUTTON_CHANGE',
            customInput: true,
            fieldsList: [new DialogField({
                name: 'position',
                placeholder: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_POSITION_DIALOG_LABEL_POSITION',
                description: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_POSITION_DIALOG_LABEL_POSITION_DESCRIPTION',
                required: true,
                fieldType: DialogFieldType.TEXT,
                type: 'number',
                value: isNewQuestion ?
                    ( this.questionnaireData ? this.questionnaireData.length + 1 : 1 ) :
                    questionIndex + 1
            })]
        })).subscribe((answer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                if (isNewQuestion) {
                    // add new question
                    this.addNewQuestion(answer.inputValue.value.position - 1);
                } else {
                    // move question
                    this.changeQuestionPosition(
                        questionIndex,
                        answer.inputValue.value.position - 1
                    );
                }
            }
        });
    }

    /**
     * Display dialog that asks user where to add the answer
     */
    addMoveQuestionAnswerPosition(answerIndex?: number) {
        // check if this is a new question or we want to move an existing one
        const isNewAnswer: boolean = answerIndex === undefined;

        // display dialog
        this.dialogService.showConfirm(new DialogConfiguration({
            message: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_ANSWER_POSITION_DIALOG_CONFIRM_MSG',
            yesLabel: isNewAnswer ? 'LNG_COMMON_BUTTON_ADD' : 'LNG_COMMON_BUTTON_CHANGE',
            customInput: true,
            fieldsList: [new DialogField({
                name: 'position',
                placeholder: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_ANSWER_POSITION_DIALOG_LABEL_POSITION',
                description: 'LNG_PAGE_MODIFY_OUTBREAK_TEMPLATE_QUESTION_ANSWER_POSITION_DIALOG_LABEL_POSITION_DESCRIPTION',
                required: true,
                fieldType: DialogFieldType.TEXT,
                type: 'number',
                value: isNewAnswer ?
                    ( this.questionInEditModeClone && this.questionInEditModeClone.answers ? this.questionInEditModeClone.answers.length + 1 : 1 ) :
                    answerIndex + 1
            })]
        })).subscribe((answer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                if (isNewAnswer) {
                    // add new answer
                    this.addNewAnswer(answer.inputValue.value.position - 1);
                } else {
                    // move answer
                    this.changeQuestionAnswerPosition(
                        answerIndex,
                        answer.inputValue.value.position - 1
                    );
                }
            }
        });
    }
}
