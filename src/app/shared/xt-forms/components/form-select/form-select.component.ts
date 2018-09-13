import {
    Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, EventEmitter, Output, HostBinding,
    OnInit
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer, NgModel } from '@angular/forms';

import { ElementBase } from '../../core/index';
import * as _ from 'lodash';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
    selector: 'app-form-select',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select.component.html',
    styleUrls: ['./form-select.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectComponent,
        multi: true
    }]
})
export class FormSelectComponent extends ElementBase<string> implements OnInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() multiple: boolean = false;
    @Input() options: any[];
    @Input() optionLabelKey: string = 'label';
    @Input() optionLabelPrefixKey: string = null;
    @Input() optionValueKey: string = 'value';
    @Input() optionTooltipKey: string = 'tooltip';
    @Input() optionDisabledKey: string = 'disabled';
    @Input() clearable: boolean = true;
    @Input() tooltip: string = null;

    @Input() noneLabel: string = 'LNG_COMMON_LABEL_NONE';

    @Output() optionChanged = new EventEmitter<any>();

    public identifier = `form-select-${FormSelectComponent.identifier++}`;

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
        const labelValue = _.camelCase(this.i18nService.instant(this.placeholder)).toLowerCase();
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
     * Function triggered when the selected value is changed
     * @param selectedValue The new value that has been selected
     */
    onChange(selectedValue) {
        // note that this could be a single or a multi select
        let selectedOptions = _.filter(this.options, (option) => {
            if (!_.isArray(selectedValue)) {
                // single select
                return option[this.optionValueKey] === selectedValue;
            } else {
                // multi select
                return selectedValue.indexOf(option[this.optionValueKey]) >= 0;
            }
        });

        // clone the selected options so we don't affect the Options list
        selectedOptions = _.cloneDeep(selectedOptions);

        if (!this.multiple) {
            // single select; keep only the first option that was found
            selectedOptions = selectedOptions[0];
        }

        // emit the currently selected option(s)
        return this.optionChanged.emit(selectedOptions);
    }
}
