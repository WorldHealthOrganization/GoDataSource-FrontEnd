import { Component, ViewEncapsulation, Optional, Inject, Host, SkipSelf, Input, Output, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import * as _ from 'lodash';
import { GroupBase } from '../../xt-forms/core';
import { QuestionModel } from '../../../core/models/question.model';
import { Constants } from '../../../core/models/constants';

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
export class FormFillQuestionnaireComponent extends GroupBase<{}> {
    @Input() disabled: boolean = false;

    questionsGroupedByCategory: { category: string, questions: QuestionModel[] }[];

    // import constants into template
    Constants = Constants;

    @Input() displayCopyField: boolean = false;
    @Input() displayCopyFieldDescription: string = '';
    @Output() copyValue = new EventEmitter<string>();

    /**
     * Set question and group them by category
     * @param {QuestionModel[]} questions
     */
    @Input() set questions(questions: QuestionModel[]) {
        // group them by category
        this.questionsGroupedByCategory = _.chain(questions)
            .groupBy('category')
            .transform((result, questionsData: QuestionModel[], category: string) => {
                result.push({
                    category: category,
                    questions: _.sortBy(questionsData, 'order')
                });
            }, [])
            .value();
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);

        // initialize
        this.value = this.value ? this.value : {};
    }

    /**
     * Copy value
     * @param property
     */
    triggerCopyValue(property) {
        this.copyValue.emit(property);
    }
}
