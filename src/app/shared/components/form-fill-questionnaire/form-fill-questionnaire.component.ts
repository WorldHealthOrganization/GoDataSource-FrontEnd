import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Input, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, NgModel } from '@angular/forms';
import * as _ from 'lodash';
import { GroupBase } from '../../xt-forms/core';
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

interface UploaderData {
    uploader: FileUploader;
    attachment: AttachmentModel;
    uploading: boolean;
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
}> implements OnInit {
    @Input() disabled: boolean = false;

    @Input() componentTitle: string;

    questionsGroupedByCategory: {
        category: string,
        questions: QuestionModel[],
        startIndex: number
    }[];

    additionalQuestions: {
        [ variable: string ]: {
            [ answer_value: string ]: QuestionModel[]
        }
    } = {};

    // import constants into template
    Constants = Constants;

    @Input() hideCategories: boolean = false;

    /**
     * File uploader
     */
    uploadersData: {
        [questionVariable: string]: UploaderData[]
    } = {};

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
        this.uploadersData = {};
        this.questionsGroupedByCategory = [];
        let currentCategory: {
            category: string,
            questions: QuestionModel[],
            startIndex: number
        } = null;
        _.each(questions, (question: QuestionModel) => {
            // ignore inactive questions
            if (question.inactive) {
                // jump over this question
                return;
            }

            // add file upload handler if necessary
            if (question.answerType === Constants.ANSWER_TYPES.FILE_UPLOAD.value) {
                // create file uploader
                this.uploadersData[question.variable] = [];
            }

            // map answers
            _.each(question.answers, (answer: AnswerModel) => {
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
                    startIndex: currentCategory ? (
                        currentCategory.startIndex + currentCategory.questions.length
                    ) : 0
                };

                // add to list
                this.questionsGroupedByCategory.push(currentCategory);
            }

            // add question
            currentCategory.questions.push(question);
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

        // initialize
        this.value = this.value ? this.value : {};
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

        // check if we have a file attachment saved
        this.initializeAttachments();
    }

    /**
     * Init values
     */
    initValue() {
        // #TODO
        // this.value
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
                // remove all uploaders
                uploadersData.splice(0, uploadersData.length);

                // init uploaders data
                _.each(this.value[questionVariable], (data: IAnswerData) => {
                    // init uploader data
                    const uploaderData = {
                        uploader: new FileUploader({}),
                        attachment: null,
                        uploading: false
                    };

                    // add it to teh list
                    uploadersData.push(uploaderData);

                    // retrieve uploader
                    this.attachmentDataService
                        .getAttachment(this.selectedOutbreak.id, data.value)
                        .subscribe((attachment: AttachmentModel) => {
                            uploaderData.attachment = attachment;
                        });
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
            _.each(uploadersData, (uploaderData: UploaderData, index: number) => {
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
                    try { jsonResponse = JSON.parse(response); } catch {}
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
                    this.onChange();
                };
            });
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
                    delete this.value[questionVariable];
                    this.uploadersData[questionVariable][index].uploader.clearQueue();
                    importDataBtn.value = '';

                    // touch control
                    fileHiddenInput.control.markAsTouched();
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
}
