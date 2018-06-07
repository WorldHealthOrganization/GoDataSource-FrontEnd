import { Component, Input, ViewEncapsulation } from '@angular/core';
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

    constructor(
        private snackbarService:SnackbarService
    ) {
    }

    link(questionSelected) {
        console.log('TODO Link')
    }

    delete(questionSelected) {
        console.log('TODO Delete')
    }

}
