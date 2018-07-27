import {
    Component,
    EventEmitter, Host,
    Inject,
    Input,
    OnInit,
    Optional,
    Output,
    SkipSelf,
    ViewEncapsulation
} from '@angular/core';
import { GroupBase } from '../../../../shared/xt-forms/core';
import { ControlContainer, NG_ASYNC_VALIDATORS, NG_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AnswerModel } from '../../../../core/models/answer.model';

@Component({
    selector: 'app-form-answer',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-answer.component.html',
    styleUrls: ['./form-answer.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormAnswerComponent,
        multi: true
    }]
})
export class FormAnswerComponent extends GroupBase<AnswerModel> implements OnInit {
    @Input() title: string;
    @Input() viewOnly: boolean;
    @Input() name: string;
    @Output() deleteAnswer = new EventEmitter();
    @Input() displayRemove: boolean = true;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        // init value
        this.value = new AnswerModel(this.value);
    }

    /**
     * Answer Model
     */
    get answer(): AnswerModel {
        return this.value;
    }

    /**
     * Delete an form-answer
     */
    delete() {
        this.deleteAnswer.emit(this.answer);
    }

    /**
     * Handle two way binding setup for translate items
     * @param {string} key
     * @param {string} value
     */
    onChangeBind(key: string, value: any) {
        // "bind value"
        this.value[key] = value;

        // value changed
        this.onChange();
    }

    /**
     * Handle two way binding setup for translate items - at initialization - to not loose values in case they are not changed
     * @param {string} key
     * @param {string} value
     */
    onInitializeBind(key: string, value: any) {
        // "bind value"
        this.value[key] = value;
    }

}
