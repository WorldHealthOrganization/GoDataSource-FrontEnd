import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, EventEmitter, Output, HostBinding, AfterViewInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import * as _ from 'lodash';
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
export class FormSelectComponent extends ElementBase<string | string[]> implements AfterViewInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;

    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() multiple: boolean = false;
    private _options: any[];
    @Input() set options(options: any[]) {
        this._options = options;
        this.initSelectedOptions();
    }
    get options(): any[] {
        return this._options;
    }
    @Input() optionLabelKey: string = 'label';
    @Input() optionLabelPrefixKey: string = null;
    @Input() optionLabelImgKey: string = 'iconUrl';
    @Input() optionValueKey: string = 'value';
    @Input() optionTooltipKey: string = 'tooltip';
    @Input() optionDisabledKey: string = 'disabled';
    @Input() optionVisibleKey: string = 'visible';
    @Input() optionReadOnly: boolean = false;
    @Input() clearable: boolean = true;
    @Input() compareWith: (o1: any, o2: any) => boolean = FormSelectComponent.compareWithDefault;
    @Input() allowSelectionOfDisabledItems: boolean = false;
    @Input() displayInvisibleItems: boolean = false;

    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    @Input() displayFilterIcon: boolean = false;

    @Input() noneLabel: string = 'LNG_COMMON_LABEL_NONE';
    // options for select-trigger
    selectedOptions: any[] = [];

    @Output() optionChanged = new EventEmitter<any>();
    @Output() initialized = new EventEmitter<any>();

    public identifier = `form-select-${FormSelectComponent.identifier++}`;

    static compareWithDefault = (o1: any, o2: any) => {
        return o1 === o2;
    }

    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        private i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);

        // on language change..we need to translate again the token
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.tooltip = this._tooltipToken;
        });
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }

    /**
     * Set value from select option
     * @param {string} value
     */
    writeValue(value: string) {
        super.writeValue(value);
        this.initSelectedOptions();
    }

    /**
     * Create options for select-trigger
     */
    private initSelectedOptions() {
        const selectedOptionsIds = this.value ? (
            _.isArray(this.value) ?
                this.value :
                [this.value]
        ) : [];

        this.selectedOptions = !_.isEmpty(this.options) ? _.map(selectedOptionsIds, (selectedValue) => {
            return _.find(this.options, (option) => {
                return option[this.optionValueKey] === selectedValue;
            });
        }) : [];
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
        this.initSelectedOptions();
        return this.optionChanged.emit(selectedOptions);
    }

    ngAfterViewInit() {
        // wait for the input object to be initialized
        // then trigger the initialized event
        setTimeout(() => {
            this.initialized.emit(this.value);
        });

        super.ngAfterViewInit();
    }
}
