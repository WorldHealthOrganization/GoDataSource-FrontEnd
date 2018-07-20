import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ListBase } from '../../../../shared/xt-forms/core/index';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { QuestionModel } from '../../../../core/models/question.model';
import { DialogConfirmAnswer } from '../../../../shared/components';
import { Subscriber } from 'rxjs/Subscriber';
import { DomService } from '../../../../core/services/helper/dom.service';

@Component({
    selector: 'app-form-question-list',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-question-list.component.html',
    styleUrls: ['./form-question-list.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormQuestionListComponent,
        multi: true
    }]
})
export class FormQuestionListComponent extends ListBase<QuestionModel> implements OnInit {
    @Input() viewOnly: boolean = false;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private dialogService: DialogService,
        private domService: DomService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        // handle remove item confirmation
        this.deleteConfirm.subscribe((observer: Subscriber<void>) => {
            this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_QUESTION')
                .subscribe((answer: DialogConfirmAnswer) => {
                    if (answer === DialogConfirmAnswer.Yes) {
                        observer.next();
                    }
                });
        });
    }

    /**
     * Adds a new form-question
     */
    addNewQuestion() {
        super.add(new QuestionModel());
        this.domService.scrollItemIntoView('app-form-question-list');
    }

    /**
     * Duplicate form-question
     */
    duplicateQuestion(question: QuestionModel) {
        super.clone(question);
        this.domService.scrollItemIntoView('app-form-question-list');
    }

}
