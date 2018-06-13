import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';



@Component({
    selector: 'question',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './question.component.html',
    styleUrls: ['./question.component.less']
})
export class QuestionComponent {
    @Input() question: any;
    @Input() viewOnly: string;
    @Output() deleteQuestion = new EventEmitter();
    @Output() duplicateQuestion = new EventEmitter();
    @Output() deleteAnswer = new EventEmitter();
    @Output() linkAnswer = new EventEmitter();

    constructor(
        private snackbarService: SnackbarService
    ) {
        console.log('TODO Question changed');
    }


    duplicate() {
        this.duplicateQuestion.emit(this.question);
    }

    delete() {
        this.deleteQuestion.emit(this.question);
    }

    deleteAnswerFromQuestion(answer){
        this.deleteAnswer.emit({answer: answer});
    }

    linkAnswerQuestion(answer){
        this.linkAnswer.emit({answer: answer});
    }

}
