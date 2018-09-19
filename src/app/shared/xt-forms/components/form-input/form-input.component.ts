import {
    Component,
    Input,
    ViewEncapsulation,
    Optional,
    Inject,
    Host,
    SkipSelf,
    HostBinding,
    Output,
    EventEmitter,
    AfterViewInit, OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-input',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-input.component.html',
    styleUrls: ['./form-input.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormInputComponent,
        multi: true
    }]
})
export class FormInputComponent extends ElementBase<string> implements AfterViewInit, OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() type: string = 'text';
    @Input() required: boolean = false;
    @Input() name: string;
    @Input() disabled: boolean = false;
    @Input() readonly: boolean = false;
    @Input() tooltip: string = null;

    @Input() maxlength: number;


    @Output() optionChanged = new EventEmitter<any>();
    @Output() initialized = new EventEmitter<any>();

    public identifier = `form-input-${FormInputComponent.identifier++}`;

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private referenceDataDataService: ReferenceDataDataService,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);
    }

    ngOnInit() {
        const labelValue = this.referenceDataDataService.stringifyGlossaryTerm(this.placeholder);
        this.referenceDataDataService.getGlossaryItems().subscribe((glossaryData) => {
            this.tooltip = _.isEmpty(glossaryData[labelValue]) ? null : this.i18nService.instant(glossaryData[labelValue]);
        });
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange() {

        // emit the current value
        return this.optionChanged.emit(this.value);
    }

    ngAfterViewInit() {
        // wait for the input object to be initialized
        // then trigger the initialized event
        setTimeout(() => {
            return this.initialized.emit(this.value);
        });

        super.ngAfterViewInit();
    }
}
