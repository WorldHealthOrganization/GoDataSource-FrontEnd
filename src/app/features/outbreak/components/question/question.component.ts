import { Component, Input, ViewEncapsulation } from '@angular/core';
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

    constructor(
        private snackbarService: SnackbarService
    ) {
    }


    duplicate(questionSelected) {
        console.log('TODO Duplicate')
    }

    delete(questionSelected) {
        console.log('TODO Delete')
    }

}
