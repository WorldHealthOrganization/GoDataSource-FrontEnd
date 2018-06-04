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
    @Output() change = new EventEmitter();

    constructor(
        private snackbarService: SnackbarService
    ) {
        console.log('TODO Question changed');
    }


    duplicate(questionSelected) {
        this.change.emit(this.question);
        console.log('TODO Duplicate')
    }

    delete(questionSelected) {
        console.log('TODO Delete')
    }

}
