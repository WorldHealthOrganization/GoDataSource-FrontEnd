import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { Observable } from 'rxjs/Observable';
import { AnswerModel } from '../../../../core/models/answer.model';
import * as _ from 'lodash';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';


@Component({
    selector: 'app-question',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.less']
})
export class QuestionComponent {
    @Input() question: any;
    @Input() viewOnly: string;
    @Input() index: number;
    @Input() name: string;
    @Output() deleteQuestion = new EventEmitter();
    @Output() duplicateQuestion = new EventEmitter();
    @Output() deleteAnswer = new EventEmitter();
    // TODO Link answer to other questions
    @Output() linkAnswer = new EventEmitter();

    // list of answer types
    answerTypesList$:  Observable<any[]>;
    // list of categories for a question
    questionCategoriesList$:  Observable<any[]>;
    // value of the option corresponding to 'multiple options' answer type
    multipleOptionsAnswerType: string = Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value;

    constructor(
        private snackbarService: SnackbarService,
        private genericDataService: GenericDataService,
        private dialogService: DialogService
    ) {
        this.answerTypesList$ = this.genericDataService.getAnswerTypesList();
        this.questionCategoriesList$ = this.genericDataService.getQuestionCategoriesList();
    }

    /**
     * Duplicates a question
     */
    duplicate() {
        this.duplicateQuestion.emit(this.question);
    }

    /**
     * Deletes a question
     */
    delete() {
        this.deleteQuestion.emit(this.question);
    }

    /**
     * Adds a new answer
     */
    addAnswer() {
        // push a new empty answer to the array of answers for that question
        this.question.answers.push(new AnswerModel());
    }

    /**
     * Handle changing the answer type
     * If Free Text than remove current answers.
     * If multiple options, then add an empty answer if there are no answers
     */
    answerTypeChanged() {
        if ( this.question.answerType === this.multipleOptionsAnswerType && _.isEmpty(this.question.answers) ) {
                this.addAnswer();
        }
    }

    /**
     * Deletes an answer
     * @param answerToDelete
     */
    deleteAnswerFromQuestion(answerToDelete) {
        this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION_ANSWER')
            .subscribe((answer: DialogConfirmAnswer) => {
                if (answer === DialogConfirmAnswer.Yes) {
                    this.question.answers = this.question.answers.filter(item => item !== answerToDelete);
                }
            });
    }

    /**
     * TODO Will be used later to link an answer to a question
     * @param answer
     */
    linkAnswerQuestion(answer) {
    //    this.linkAnswer.emit({answer: answer});
    }

}
