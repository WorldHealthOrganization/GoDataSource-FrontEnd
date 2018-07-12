import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'app-answer',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './answer.component.html',
    styleUrls: ['./answer.component.less']
})
export class AnswerComponent {
    @Input() answer: any;
    @Input() index: number;
    @Input() viewOnly: boolean;
    @Input() name: string;
    @Output() deleteAnswer = new EventEmitter();
    // TODO To be used when linking an answer to a question
    @Output() linkAnswer = new EventEmitter();

    /**
     * TODO Link other questions with this answer
     */
    link() {
        // this.linkAnswer.emit(this.answer);
    }

    /**
     * Delete an answer
     */
    delete() {
        this.deleteAnswer.emit(this.answer);
    }

}
