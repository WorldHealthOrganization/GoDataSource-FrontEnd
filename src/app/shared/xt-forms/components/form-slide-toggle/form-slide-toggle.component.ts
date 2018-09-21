import {
    Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, HostBinding, Output, EventEmitter, OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';

import { ElementBase } from '../../core/index';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-slide-toggle',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-slide-toggle.component.html',
    styleUrls: ['./form-slide-toggle.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSlideToggleComponent,
        multi: true
    }]
})
export class FormSlideToggleComponent extends ElementBase<string> implements OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() label: string;
    // used only when toggle is "readonly" and not checked
    @Input() notCheckedLabel: string;
    @Input() name: string;
    @Input() labelBefore: boolean;
    @Input() readonly: boolean = false;
    @Input() disabled: boolean = false;
    @Input() tooltip: string = null;

    public identifier = `form-slide-toggle-${FormSlideToggleComponent.identifier++}`;

    @Output() optionChanged = new EventEmitter<any>();

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
        if (this.label) {
            const labelValue = this.referenceDataDataService.stringifyGlossaryTerm(this.label);
            this.referenceDataDataService.getGlossaryItems().subscribe((glossaryData) => {
                this.tooltip = _.isEmpty(glossaryData[labelValue]) ? null : this.i18nService.instant(glossaryData[labelValue]);
            });
        }
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onClick() {
        this.touch();
    }

    /**
     * Function triggered when the input value is changed
     */
    onChange() {
        // emit the current value
        return this.optionChanged.emit(this.value);
    }
}
