import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, HostBinding, Output, EventEmitter, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

@Component({
    selector: 'app-form-select-vscroll',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select-vscroll.component.html',
    styleUrls: ['./form-select-vscroll.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectVscrollComponent,
        multi: true
    }]
})
export class FormSelectVscrollComponent
    extends ElementBase<string | number> {

    // enable form element
    @HostBinding('class.form-element-host') isFormElement = true;

    // virtual scroll
    @ViewChild(CdkVirtualScrollViewport) cdkVirtualScrollViewport: CdkVirtualScrollViewport;

    // component conf
    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;

    // option changed
    @Output() optionChanged = new EventEmitter<any>();

    // all options
    private _options: any[];
    @Input() set options(options: any[]) {
        // set all options
        this._options = options;

        // init selected options
        this.initSelectedOption();

        // filter options
        this.filterOptions();
    }
    get options(): any[] {
        return this._options;
    }

    // option keys
    @Input() optionLabelKey: string = 'label';
    @Input() optionValueKey: string = 'value';
    @Input() optionTooltipKey: string = 'tooltip';
    @Input() optionDisabledKey: string = 'disabled';

    // clearable ?
    @Input() clearable: boolean = true;
    @Input() noneLabel: string = 'LNG_COMMON_LABEL_NONE';

    // filtered options used to be displayed
    filteredOptions: any[] = [];

    // filter configuration
    private _filterTimeout: any;
    @Input() filterOptionsPlaceholder: string = 'LNG_COMMON_LABEL_SEARCH';
    @Input() filterOptionsDelayMs: number = 200;

    // label is material icon ?
    @Input() labelIsMaterialIcon: boolean;

    // selected option
    selectedOption: any;

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        protected i18nService: I18nService
    ) {
        // parent constructor
        super(
            controlContainer,
            validators,
            asyncValidators
        );
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
    writeValue(value: string | number) {
        // save initial value
        super.writeValue(value);

        // init selected options
        this.initSelectedOption();
    }

    /**
     * Select option for select-trigger
     */
    private initSelectedOption() {
        // determine selected option
        this.selectedOption = !this.options || this.options.length < 1 ?
            undefined :
            this.options.find((option) => option[this.optionValueKey] === this.value);
    }

    /**
     * Function triggered when the selected value is changed
     */
    onChange(selectedValue) {
        // set value
        this.value = selectedValue;

        // init selected options
        this.initSelectedOption();

        // trigger event
        return this.optionChanged.emit(this.selectedOption);
    }

    /**
     * Clear timeout callback
     */
    private clearFilterTimeoutCall() {
        // clear
        if (this._filterTimeout) {
            clearTimeout(this._filterTimeout);
            this._filterTimeout = undefined;
        }
    }

    /**
     * Filter options by text
     */
    filterOptions(byValue?: string) {
        // nothing to filter ?
        if (!this.options) {
            this.filteredOptions = [];
            return;
        }

        // filter options
        if (
            !byValue ||
            !this.optionLabelKey
        ) {
            // all visible options
            this.filteredOptions = this.options;

            // finished
            return;
        }

        // clear timeout interval and filter
        this.clearFilterTimeoutCall();
        this._filterTimeout = setTimeout(() => {
            // case insensitive
            byValue = byValue.toLowerCase();

            // filter
            this.filteredOptions = this.options.filter((item: any): boolean => {
                // nothing to filter ?
                if (
                    !this.optionLabelKey ||
                    !item[this.optionLabelKey]
                ) {
                    return false;
                }

                // prepare to filter
                let translatedValue: string = this.i18nService.instant(item[this.optionLabelKey]);
                translatedValue = translatedValue.toLowerCase();

                // filter
                return translatedValue.indexOf(byValue) > -1;
            });

            // reset virtual scroll position
            if (this.cdkVirtualScrollViewport) {
                this.cdkVirtualScrollViewport.scrollToOffset(0);
            }

        }, this.filterOptionsDelayMs);
    }

    /**
     * Select open options list
     */
    openedChange(opened) {
        if (
            this.cdkVirtualScrollViewport &&
            opened
        ) {
            // scroll to specific position
            const optionIndex: number = this.value !== undefined && this.value !== null ?
                this.filteredOptions.findIndex((option) => option[this.optionValueKey] === this.value) :
                0;
            if (optionIndex > -1) {
                this.cdkVirtualScrollViewport.scrollToIndex(optionIndex);
            } else {
                this.cdkVirtualScrollViewport.scrollToIndex(0);
            }

            // make sure we render
            this.cdkVirtualScrollViewport.checkViewportSize();
        }
    }
}
