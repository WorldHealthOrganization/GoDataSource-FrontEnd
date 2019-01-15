import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
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
     * Saving data
     */
    savingData: boolean = false;

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
        private dialogService: DialogService
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
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
                        accumulator.push(new QuestionModel(question));
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

            console.log(this.parent[this.questionnaireType]);
            console.log(this.questionnaireData);
        }
    }

    /**
     * Sort questionnaire questions
     * @param questions
     */
    private sortQuestionnaireQuestions(questions: QuestionModel[]): QuestionModel[] {
        // empty ?
        if (_.isEmpty(questions)) {
            return questions;
        }

        // sort answer questions
        _.each(questions, (question: QuestionModel) => {
            _.each(question.answers, (answer: AnswerModel) => {
                if (!_.isEmpty(answer.additionalQuestions)) {
                    answer.additionalQuestions = this.sortQuestionnaireQuestions(answer.additionalQuestions);
                }
            });
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
        _.each(questions, (question: QuestionModel, index: number) => {
            // set question order
            question.order = index + 1;

            // set additional questions index
            if (recursive) {
                _.each(question.answers, (answer: AnswerModel) => {
                    if (!_.isEmpty(answer.additionalQuestions)) {
                        this.setQuestionnaireQuestionsOrder(
                            answer.additionalQuestions,
                            recursive
                        );
                    }
                });
            }
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
                        this.questionIndexInEditMode = null;
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
     * Modify Question
     * @param questionIndex
     */
    modifyQuestion(questionIndex: number) {
        // set question edit mode
        this.questionIndexInEditMode = questionIndex;
    }

    /**
     * Clone Question
     * @param questionIndex
     */
    cloneQuestion(questionIndex: number) {
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
}
