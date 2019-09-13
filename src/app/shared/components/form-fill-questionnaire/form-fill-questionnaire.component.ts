import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, NgModel } from '@angular/forms';
import * as _ from 'lodash';
import { GroupBase, GroupFilteredValue } from '../../xt-forms/core';
import { AnswerModel, IAnswerData, QuestionModel } from '../../../core/models/question.model';
import { Constants } from '../../../core/models/constants';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { environment } from '../../../../environments/environment';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { OutbreakModel } from '../../../core/models/outbreak.model';
import { OutbreakDataService } from '../../../core/services/data/outbreak.data.service';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { AttachmentDataService } from '../../../core/services/data/attachment.data.service';
import { AttachmentModel } from '../../../core/models/attachment.model';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';
import { DialogService } from '../../../core/services/helper/dialog.service';
import * as FileSaver from 'file-saver';
import * as momentOriginal from 'moment';
import { moment, Moment } from '../../../core/helperClasses/x-moment';

interface UploaderData {
    uploader: FileUploader;
    attachment: AttachmentModel;
    uploading: boolean;
}

interface QuestionGroup {
    category: string;
    questions: QuestionModel[];
    questionNo: {
        [questionIndex: number]: number
    };
    startIndex: number;
}

@Component({
    selector: 'app-form-fill-questionnaire',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-fill-questionnaire.component.html',
    styleUrls: ['./form-fill-questionnaire.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormFillQuestionnaireComponent,
        multi: true
    }]
})
export class FormFillQuestionnaireComponent extends GroupBase<{
    [variable: string]: IAnswerData[]
}> implements OnInit, GroupFilteredValue<any> {
    @Input() disabled: boolean = false;
    // skip validation for required questions?
    @Input() skipRequired: boolean = false;
    @Input() componentTitle: string;

    private _parentDate: string | Moment;
    @Input() set parentDate(parentDate: string | Moment) {
        // set value
        this._parentDate = parentDate;

        // set dates to answers
        setTimeout(() => {
            this.initParentDates();
        });
    }
    get parentDate(): string | Moment {
        return this._parentDate;
    }

    questionsGroupedByCategory: QuestionGroup[];

    additionalQuestions: {
        [ variable: string ]: {
            [ answer_value: string ]: QuestionModel[]
        }
    } = {};

    // import constants into template
    Constants = Constants;

    /**
     * Hide categories
     */
    @Input() hideCategories: boolean = false;

    /**
     * Child Index Value
     */
    private _childValueIndex: number;
    @Input() set childValueIndex(childValueIndex: number) {
        // set the new child value index
        this._childValueIndex = childValueIndex;

        // init values
        this.initValue();
    }
    get childValueIndex(): number {
        return this._childValueIndex;
    }

    /**
     * File uploader
     */
    private _uploadersDataLocked: boolean = false;
    private _uploadersData: {
        [questionVariable: string]: UploaderData[]
    } = {};
    @Input() set uploadersData(uploadersData: {
        [questionVariable: string]: UploaderData[]
    }) {
        // set data & lock
        this._uploadersData = uploadersData;
        this._uploadersDataLocked = true;
    }
    get uploadersData(): {
        [questionVariable: string]: UploaderData[]
    } {
        return this._uploadersData;
    }

    /**
     * Outbreak
     */
    selectedOutbreak: OutbreakModel;

    /**
     * Set question and group them by category
     * @param {QuestionModel[]} questions
     */
    @Input() set questions(questions: QuestionModel[]) {
        // reset additional questions
        this.additionalQuestions = {};

        // make sure we have questions ordered - these are sorted by api, but it doesn't hurt to make sure they are...
        questions = _.sortBy(questions, 'order');

        // group them by category, keeping in mind the questions order
        this._uploadersData = this._uploadersDataLocked ? this.uploadersData : {};
        this.questionsGroupedByCategory = [];
        let currentCategory: QuestionGroup = null;
        let markupNo: number = 0;
        _.each(questions, (question: QuestionModel) => {
            // ignore inactive questions
            if (question.inactive) {
                // jump over this question
                return;
            }

            // add file upload handler if necessary
            if (question.answerType === Constants.ANSWER_TYPES.FILE_UPLOAD.value) {
                // create file uploader
                if (!_.isArray(this.uploadersData[question.variable])) {
                    this.uploadersData[question.variable] = [];
                }
            }

            // map answers
            _.each(question.answers, (answer: AnswerModel) => {
                // map additional questions
                if (!_.isEmpty(answer.additionalQuestions)) {
                    // answer value should be unique
                    // can't use _.set since we can have dots & square brackets inside strings
                    if (!this.additionalQuestions[question.variable]) {
                        this.additionalQuestions[question.variable] = {};
                    }
                    this.additionalQuestions[question.variable][answer.value] = answer.additionalQuestions;
                }
            });

            // check if current question category is the same as question category, if not..add a new one
            if (
                currentCategory === null ||
                currentCategory.category !== question.category
            ) {
                // add category
                currentCategory = {
                    category: question.category,
                    questions: [],
                    questionNo: {},
                    startIndex: currentCategory ? (
                        currentCategory.startIndex + currentCategory.questions.length
                    ) : 0
                };

                // add to list
                this.questionsGroupedByCategory.push(currentCategory);
            }

            // this question is a markup question ?
            if (question.answerType === Constants.ANSWER_TYPES.MARKUP.value) {
                markupNo++;
            }

            // add question
            currentCategory.questions.push(question);
            currentCategory.questionNo[currentCategory.questions.length - 1] = currentCategory.startIndex + currentCategory.questions.length - markupNo;
        });

        // init value
        this.initValue();

        // initialize uploader
        this.initializeUploader();
    }

    /**
     * Alternative name
     */
    private _alternativeName: string;
    @Input() set alternativeName(value: string) {
        this._alternativeName = value;
    }

    /**
     * Alternative name
     */
    get alternativeName(): string {
        return this._alternativeName ? this._alternativeName : this.name;
    }

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private authDataService: AuthDataService,
        private outbreakDataService: OutbreakDataService,
        private snackbarService: SnackbarService,
        private attachmentDataService: AttachmentDataService,
        private dialogService: DialogService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    /**
     * Component initialized
     */
    ngOnInit() {
        this.outbreakDataService
            .getSelectedOutbreak()
            .subscribe((selectedOutbreak: OutbreakModel) => {
                // outbreak
                this.selectedOutbreak = selectedOutbreak;

                // uploader
                this.initializeUploader();
            });
    }

    /**
     * Handle minimum number of items from the list
     * @param value
     */
    writeValue(value: {}) {
        // write value
        super.writeValue(value);

        // init value
        this.initValue();

        // init file uploader if needed
        this.initializeUploader();

        // check if we need to set parent dates to children as well
        setTimeout(() => {
            this.initParentDates();
        });
    }

    /**
     * Init values
     */
    initValue() {
        // do we need to init value ?
        if (!this.value) {
            this.value = {};
        }

        // init first value for each question
        _.each(this.questionsGroupedByCategory, (data: { questions: QuestionModel[] }) => {
            _.each(data.questions, (question: QuestionModel) => {
                // init array to keep answer responses
                if (!_.isArray(this.value[question.variable])) {
                    this.value[question.variable] = [];
                }

                // generate values if necessary
                while (this.value[question.variable].length < (this.childValueIndex === undefined ? 1 : this.childValueIndex + 1)) {
                    this.value[question.variable].push(this.generateNewAnswer(this.parentDate));
                }
            });
        });
    }

    /**
     * Set dates where needed
     */
    initParentDates() {
        // nothing to do ?
        // change only our question answers
        // since this is called only for additional questions then we surely have childValueIndex
        if (
            !this.parentDate ||
            this.childValueIndex === undefined
        ) {
            return;
        }

        // set date
        const childDate: string = this.parentDate instanceof momentOriginal ?
            (this.parentDate as Moment).format() :
            (this.parentDate as string);
        const setDates = (question: QuestionModel, childIndex: number) => {
            const answer: IAnswerData = this.value[question.variable][childIndex];

            // set child date
            answer.date = childDate;

            // recursive
            if (
                !_.isEmpty(question.answers) &&
                !_.isEmpty(answer.value)
            ) {
                _.each(question.answers, (answerModel: AnswerModel) => {
                    if (!_.isEmpty(answerModel.additionalQuestions)) {
                        _.each(answerModel.additionalQuestions, (additionalQuestion: QuestionModel) => {
                            _.each(
                                _.isArray(answer.value) ? answer.value : [answer.value],
                                (answerValue: string) => {
                                    setDates(
                                        additionalQuestion,
                                        this.determineChildIndex(
                                            additionalQuestion.variable,
                                            childIndex,
                                            answerValue
                                        )
                                    );
                                }
                            );
                        });
                    }
                });
            }
        };

        // go through categories
        _.each(this.questionsGroupedByCategory, (data: { questions: QuestionModel[] }) => {
            _.each(data.questions, (question: QuestionModel) => {
                // set date
                setDates(question, this.childValueIndex);
            });
        });
    }

    /**
     * Initialize attachments
     */
    initializeAttachments() {
        // do we have outbreak data ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id ||
            _.isEmpty(this.value)
        ) {
            return;
        }

        // initialize attachments
        _.each(this.uploadersData, (uploadersData: UploaderData[], questionVariable: string) => {
            if (this.value[questionVariable]) {
                // init uploaders data
                _.each(this.value[questionVariable], (data: IAnswerData, index: number) => {
                    // init uploader data
                    const uploaderData = uploadersData[index];

                    // retrieve uploader file
                    if (
                        !_.isEmpty(data.value) &&
                        _.isEmpty(uploaderData.attachment)
                    ) {
                        // retrieve uploader file
                        this.attachmentDataService
                            .getAttachment(this.selectedOutbreak.id, data.value)
                            .subscribe((attachment: AttachmentModel) => {
                                uploaderData.attachment = attachment;
                            });
                    }
                });
            }
        });
    }

    /**
     * Initialize Uploader
     */
    initializeUploader() {
        // do we have outbreak data ?
        if (
            !this.selectedOutbreak ||
            !this.selectedOutbreak.id
        ) {
            return;
        }

        // initialize uploader
        _.each(this.uploadersData, (uploadersData: UploaderData[], questionVariable: string) => {
            if (this.value[questionVariable]) {
                // init uploaders data
                _.each(this.value[questionVariable], (answer: IAnswerData, index: number) => {
                    // init only if necessary
                    if (uploadersData.length > index) {
                        return;
                    }

                    // init uploader data
                    const uploaderData = {
                        uploader: new FileUploader({}),
                        attachment: null,
                        uploading: false
                    };

                    // add it to teh list
                    uploadersData.push(uploaderData);

                    // configure options
                    uploaderData.uploader.setOptions({
                        authToken: this.authDataService.getAuthToken(),
                        url: `${environment.apiUrl}/outbreaks/${this.selectedOutbreak.id}/attachments`,
                        autoUpload: true
                    });

                    // don't allow multiple files to be uploaded
                    // we could set queueLimit to 1, but we won't be able to replace the file that way
                    uploaderData.uploader.onAfterAddingFile = () => {
                        // check if we need to replace existing item
                        if (uploaderData.uploader.queue.length > 1) {
                            // remove old item
                            uploaderData.uploader.removeFromQueue(uploaderData.uploader.queue[0]);
                        }

                        // set name property
                        uploaderData.uploader.options.additionalParameter = {
                            name: uploaderData.uploader.queue[0].file.name
                        };
                    };

                    // handle server errors
                    uploaderData.uploader.onErrorItem = () => {
                        // display error
                        this.snackbarService.showError('LNG_QUESTIONNAIRE_ERROR_UPLOADING_FILE');

                        // reset uploading flag
                        uploaderData.uploading = false;
                    };

                    // handle errors when trying to upload files
                    uploaderData.uploader.onWhenAddingFileFailed = () => {
                        // display error
                        this.snackbarService.showError('LNG_QUESTIONNAIRE_ERROR_UPLOADING_FILE');
                    };

                    // progress handle
                    uploaderData.uploader.onBeforeUploadItem = () => {
                        // started uploading
                        uploaderData.uploading = true;

                        // make invalid for required files
                        this.value[questionVariable][index].value = '';
                    };

                    // everything went smoothly ?
                    uploaderData.uploader.onCompleteItem = (item: FileItem, response: string, status: number) => {
                        // finished uploading
                        uploaderData.uploading = false;

                        // an error occurred ?
                        if (status !== 200) {
                            return;
                        }

                        // we should get a ImportableFileModel object
                        let jsonResponse;
                        try {
                            jsonResponse = JSON.parse(response);
                        } catch {
                        }
                        if (
                            !response ||
                            !jsonResponse
                        ) {
                            this.snackbarService.showError('LNG_QUESTIONNAIRE_ERROR_UPLOADING_FILE');
                            return;
                        }

                        // set file upload done
                        // closure not needed ..!?
                        uploaderData.attachment = jsonResponse;
                        this.value[questionVariable][index].value = jsonResponse.id;
                        setTimeout(() => {
                            this.onChange();
                        });
                    };
                });
            }
        });

        // check if we have a file attachment saved
        if (this.value) {
            this.initializeAttachments();
        }
    }

    /**
     * Check if we have sub-questions for the selected answers
     * @param question
     * @param selectedAnswers
     */
    hasSubQuestions(question: QuestionModel, selectedAnswers): boolean {
        // nothing was selected
        if (
            _.isEmpty(selectedAnswers) ||
            !this.additionalQuestions ||
            !this.additionalQuestions[question.variable]
        ) {
            return false;
        }

        // convert to array if necessary so we handle both single & multiple selects
        if (!_.isArray(selectedAnswers)) {
            selectedAnswers = [selectedAnswers];
        }

        // determine if we have at least one answer with additional questions
        let hasQuestions: boolean = false;
        _.each(selectedAnswers, (answerValue: string) => {
            if (this.additionalQuestions[question.variable][answerValue]) {
                hasQuestions = true;
                return false;
            }
        });

        // finished
        return hasQuestions;
    }

    /**
     * Child Questions Answers
     * @param question
     * @param selectedAnswers
     */
    subQuestionsAnswer(question: QuestionModel, selectedAnswers): string[] {
        // convert to array if necessary so we handle both single & multiple selects
        if (!_.isArray(selectedAnswers)) {
            selectedAnswers = [selectedAnswers];
        }

        // determine answers with additional questions
        const answers: string[] = [];
        _.each(selectedAnswers, (answerValue: string) => {
            if (this.additionalQuestions[question.variable][answerValue]) {
                answers.push(answerValue);
            }
        });

        // finished
        return answers;
    }

    /**
     * Download attachment
     */
    downloadAttachment(
        questionVariable: string,
        index: number
    ) {
        this.attachmentDataService
            .downloadAttachment(this.selectedOutbreak.id, this.value[questionVariable][index].value)
            .subscribe((blob) => {
                FileSaver.saveAs(
                    blob,
                    this.uploadersData[questionVariable][index].attachment.name
                );
            });
    }

    /**
     * Remove attachment
     */
    removeAttachment(
        questionVariable: string,
        index: number,
        importDataBtn,
        fileHiddenInput: NgModel
    ) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REMOVE_ATTACHMENT')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    this.value[questionVariable][index].value = undefined;
                    this.uploadersData[questionVariable][index].uploader.clearQueue();
                    importDataBtn.value = '';

                    // touch control
                    fileHiddenInput.control.markAsTouched();

                    // trigger parent on change
                    this.onChange();
                }
            });
    }

    /**
     * Import File - Browse
     */
    importAttachment(
        importDataBtn,
        fileHiddenInput: NgModel
    ) {
        // touch control
        fileHiddenInput.control.markAsTouched();

        // trigger open file
        importDataBtn.click();
    }

    /**
     * Update answer date
     */
    changedAnswerDate(
        answerData: IAnswerData,
        value: string | Moment
    ) {
        // set date
        answerData.date = value instanceof momentOriginal ?
            (value as Moment).format() :
            (value as string);

        // trigger parent on change
        this.onChange();
    }

    /**
     * generate new answer
     */
    private generateNewAnswer(parentDate: Moment | string): IAnswerData {
        // determine if we have parent date
        const childDate: string = parentDate instanceof momentOriginal ?
            (parentDate as Moment).format() :
            (parentDate as string);

        // set date
        return {
            value: undefined,
            date: childDate
        };
    }

    /**
     * Add multi answer
     */
    addMultiAnswer(variable: string) {
        // create new response
        this.value[variable].push(this.generateNewAnswer(undefined));

        // might cause an impact issue
        // force redraw so we can fix a binding issue
        // old bind object remained bind by angular which was causing issues ( add 3 items, set date to item 1 and item 2, remove item 1
        // add new item which is the new item 2, change item 1 or item 2 date, you will see that both are bind to the same object )
        // the same applies for value
        this.value[variable] = _.cloneDeep(this.value[variable]);

        // init file uploader if needed
        this.initializeUploader();

        // form changed
        this.onChange();
    }

    // handle child remove recursive
    private removeChildAnswers(
        additionalQuestions: any,
        curParentValues: string[] | string,
        curQuestionVariable: string,
        curAnswerDataIndex: number
    ) {
        // nothing to do here ?
        if (
            _.isEmpty(additionalQuestions) ||
            _.isEmpty(additionalQuestions[curQuestionVariable])
        ) {
            return;
        }

        // make sure we have an array of answer since we have one for multi and we need to handle single answers a s well
        curParentValues = _.isArray(curParentValues) ? curParentValues : [curParentValues] as string[];

        // go through each answer and check if we have additional questions
        _.each(
            curParentValues,
            (answerValue: string) => {
                // check children questions
                const questions: QuestionModel[] = additionalQuestions[curQuestionVariable][answerValue];
                if (!_.isEmpty(questions)) {
                    // determine child index that we need to remove
                    const childIndex: number = this.determineChildIndex(curQuestionVariable, curAnswerDataIndex, answerValue);

                    // check children questions if we need to remove answers
                    _.each(
                        questions,
                        (question: QuestionModel) => {
                            // delete child value
                            if (
                                this.value[question.variable] &&
                                this.value[question.variable].length > childIndex
                            ) {
                                // construct additional questions
                                const tempAdditionalQuestions = {
                                    [question.variable]: {}
                                };

                                // map answers
                                _.each(question.answers, (answerModel: AnswerModel) => {
                                    if (!_.isEmpty(answerModel.additionalQuestions)) {
                                        if (!tempAdditionalQuestions[question.variable]) {
                                            tempAdditionalQuestions[question.variable] = {};
                                        }
                                        tempAdditionalQuestions[question.variable][answerModel.value] = answerModel.additionalQuestions;
                                    }
                                });

                                // recursive check for questions
                                if (!_.isEmpty(tempAdditionalQuestions[question.variable])) {
                                    this.removeChildAnswers(
                                        tempAdditionalQuestions,
                                        this.value[question.variable][childIndex].value,
                                        question.variable,
                                        childIndex
                                    );
                                }

                                // remove parent
                                this.value[question.variable].splice(childIndex, 1);

                                // remove uploaded data if we have one
                                if (this.uploadersData[question.variable]) {
                                    this.uploadersData[question.variable].splice(childIndex, 1);
                                }
                            }
                        }
                    );
                }
            }
        );
    }

    /**
     * Remove multi answer
     */
    removeMultiAnswer(
        questionVariable: string,
        answerDataIndex: number
    ) {
        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_REMOVE_MULTI_ANSWER')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // remove child answers
                    this.removeChildAnswers(
                        this.additionalQuestions,
                        this.value[questionVariable][answerDataIndex].value,
                        questionVariable,
                        answerDataIndex
                    );

                    // remove answer parent
                    this.value[questionVariable].splice(answerDataIndex, 1);

                    // remove file uploader if this is the case
                    if (this.uploadersData[questionVariable]) {
                        this.uploadersData[questionVariable].splice(answerDataIndex, 1);
                    }

                    // form changed
                    this.onChange();
                }
            });
    }

    /**
     * Get Filtered Value
     */
    getFilteredValue(): any {
        // strip unnecessary data
        return !this.value ?
            this.value :
            _.transform(
                _.cloneDeep(this.value),
                (accumulator, answers: IAnswerData[], variable: string) => {
                    // clean answers
                    answers = _.filter(
                        answers,
                        (answer: IAnswerData) => !_.isEmpty(answer.value) || _.isNumber(answer.value)
                    );

                    // add only if we still have answers for this variable
                    if (!_.isEmpty(answers)) {
                        accumulator[variable] = answers;
                    }
                },
                {}
            );
    }

    /**
     * Determine child index to know which value we should display...
     */
    determineChildIndex(
        variable: string,
        answerDataIndex: number,
        answerValue: string
    ): number {
        // determine index
        let index: number = 0;
        _.each(
            this.value[variable],
            (answerData: IAnswerData, answerIndex: number) => {
                // determine if this is our answer
                if (answerIndex >= answerDataIndex) {
                    // stop
                    return false;
                }

                // count same answers
                if (_.isArray(answerData.value) ?
                    (answerData.value as string[]).includes(answerValue) :
                    (answerData.value === answerValue)
                ) {
                    index++;
                }
            }
        );

        // finished
        return index;
    }

    /**
     * Insert child answers if needed
     */
    insertChildAnswers(
        additionalQuestions: any,
        curParentValues: string[] | string,
        curQuestionVariable: string,
        curAnswerDataIndex: number
    ) {
        // nothing to do here ?
        if (
            _.isEmpty(additionalQuestions) ||
            _.isEmpty(additionalQuestions[curQuestionVariable])
        ) {
            return;
        }

        // make sure we have an array of answer since we have one for multi and we need to handle single answers a s well
        curParentValues = _.isArray(curParentValues) ? curParentValues : [curParentValues] as string[];
        const curParentDate = this.value[curQuestionVariable][curAnswerDataIndex].date;

        // go through each answer and check if we have additional questions
        let maxDataIndex: number;
        let curAnswerRealIndex: number;
        _.each(
            curParentValues,
            (answerValue: string) => {
                // only if we have additional questions we need to insert children
                const questions: QuestionModel[] = additionalQuestions[curQuestionVariable][answerValue];
                if (_.isEmpty(questions)) {
                    return;
                }

                // determine max answer data index
                maxDataIndex = -1;
                curAnswerRealIndex = 0;
                _.each(this.value[curQuestionVariable], (answer: IAnswerData, index: number) => {
                    // check if our selected answer
                    const values = _.isArray(answer.value) ? answer.value : [answer.value];
                    if (values.includes(answerValue)) {
                        maxDataIndex++;

                        // determine real answer index
                        if (index < curAnswerDataIndex) {
                            curAnswerRealIndex++;
                        }
                    }
                });

                // do we need to insert answer ?
                if (maxDataIndex >= curAnswerRealIndex) {
                    // check children questions if we need to remove answers
                    _.each(
                        questions,
                        (question: QuestionModel) => {
                            // insert value
                            this.value[question.variable].splice(
                                curAnswerRealIndex,
                                0,
                                this.generateNewAnswer(curParentDate)
                            );

                            // create file uploader
                            if (!_.isArray(this.uploadersData[question.variable])) {
                                this.uploadersData[question.variable] = [];
                            }

                            // add file upload ?
                            this.initializeUploader();

                            // recursive isn't needed since we generate a new answer that is empty
                            // NOTHING
                        }
                    );
                }
            }
        );
    }

    /**
     * Selected answer change => we might need to insert a new child value or delete one
     */
    selectedDropdownAnswer(
        variable: string,
        answerDataIndex: number,
        newAnswer: AnswerModel | AnswerModel[]
    ) {
        // determine old & new values
        const answerNewValue: string | string[] = newAnswer ?
            _.isArray(newAnswer) ? (newAnswer as AnswerModel[]).map((a: AnswerModel) => a.value) : (newAnswer as AnswerModel).value :
            undefined;
        const answerOldValue: string | string[] = this.value[variable][answerDataIndex].value;

        // determine if we need to remove child answers
        this.removeChildAnswers(
            this.additionalQuestions,
            answerOldValue,
            variable,
            answerDataIndex
        );

        // remove uploaded data if we have one
        if (this.uploadersData[variable]) {
            this.uploadersData[variable].splice(answerDataIndex, 1);
        }

        // determine if we need to insert child answers
        this.insertChildAnswers(
            this.additionalQuestions,
            answerNewValue,
            variable,
            answerDataIndex
        );

        // set the new value
        this.value[variable][answerDataIndex].value = answerNewValue;

        // finished
        this.onChange();
    }

    /**
     * Copy date to all empty date fields
     * @param date
     */
    triggerCopyDate(date: any) {
        // validate input
        if (!date) {
            return;
        }

        // show confirm dialog to confirm the action
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_COPY_QUESTIONNAIRE_DATE')
            .subscribe((answer: DialogAnswer) => {
                if (answer.button === DialogAnswerButton.Yes) {
                    // determine top level questions
                    const topLevelQuestionsGrouped: {
                        [variable: string]: QuestionModel
                    } = {};
                    _.each(this.questionsGroupedByCategory, (data) => {
                        if (_.isArray(data.questions)) {
                            _.each(data.questions, (question: QuestionModel) => {
                                topLevelQuestionsGrouped[question.variable] = question;
                            });
                        }
                    });

                    // go through all answer and copy value if answer value is empty
                    _.each(this.value, (answersData: IAnswerData[], questionVariable: string) => {
                        _.each(answersData, (answerData: IAnswerData) => {
                            // no date, top level question & multi answer question since parent questions will send date further to children
                            if (
                                !answerData.date &&
                                topLevelQuestionsGrouped[questionVariable] &&
                                topLevelQuestionsGrouped[questionVariable].multiAnswer
                            ) {
                                answerData.date = moment(date).format();
                            }
                        });
                    });

                    // trigger parent on change
                    this.onChange();
                }
            });
    }

    /**
     * Text value changed
     */
    textValueChanged(
        answerType,
        answerData: IAnswerData,
        value
    ) {
        // convert value to proper value
        if (answerType === Constants.ANSWER_TYPES.NUMERIC.value) {
            if (_.isString(value)) {
                // parse value
                if (value) {
                    try {
                        value = parseFloat(value);
                    } catch {
                        value = null;
                    }
                } else {
                    value = null;
                }
            }
        }

        // set value
        answerData.value = value;

        // call parent on change
        super.onChange();
    }
}
