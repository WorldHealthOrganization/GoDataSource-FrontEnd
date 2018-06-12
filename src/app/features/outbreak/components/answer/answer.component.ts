import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';


@Component({
    selector: 'answer',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './answer.component.html',
    styleUrls: ['./answer.component.less']
})
export class AnswerComponent {
    @Input() answer: any;
    @Input() index: number;
    @Input() viewOnly: string;
    @Output() deleteAnswer = new EventEmitter();
    @Output() linkAnswer = new EventEmitter();

    constructor(
        private snackbarService:SnackbarService
    ) {
    }

    link() {
        this.linkAnswer.emit(this.answer);
    }

    delete() {
        this.deleteAnswer.emit(this.answer);
    }

}
