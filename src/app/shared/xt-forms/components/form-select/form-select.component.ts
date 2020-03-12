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
export class FormSelectComponent
    extends ElementBase<string | string[]>
    implements AfterViewInit {
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @Input() placeholder: string;

    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() multiple: boolean = false;
    private _options: any[];
    @Input() set options(options: any[]) {
        // set all options
        this._options = options;

        // init selected options
        this.initSelectedOptions();

        // filter options
        this.filterOptions();
    }
    get options(): any[] {
        return this._options;
    }
    @Input() optionLabelKey: string = 'label';
    @Input() optionLabelPrefixKey: string = null;
    @Input() optionLabelPrefixDelimiter: string = ' => ';
    @Input() optionLabelImgKey: string = 'iconUrl';
    @Input() optionValueKey: string = 'value';
    @Input() optionTooltipKey: string = 'tooltip';
    @Input() optionDisabledKey: string = 'disabled';
    @Input() optionVisibleKey: string = 'visible';
    @Input() optionReadOnly: boolean = false;
    @Input() clearable: boolean = true;
    @Input() compareWith: (o1: any, o2: any) => boolean;
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

    // filtered options used to be displayed
    filteredOptions: any[];

    // used to filter select items
    searchedValue: string = '';

    // filter configuration
    private _filterTimeout: any;
    @Input() enableFilterOptions: boolean = false;
    @Input() filterOptionsPlaceholder: string = 'LNG_COMMON_LABEL_SEARCH';
    @Input() filterOptionsDelayMs: number = 200;
    @Input() filterOptionsIsCaseSensitive: boolean = false;
    @Input() filterOptionsComparator: (
        searchedValue: string,
        optionLabel: string
    ) => boolean;

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        protected i18nService: I18nService
    ) {
        super(controlContainer, validators, asyncValidators);

        // set default filter comparator
        if (!this.filterOptionsComparator) {
            this.filterOptionsComparator = (searchedValue: string, optionLabel: string): boolean => {
                return optionLabel.indexOf(searchedValue) > -1;
            };
        }

        // compare option items
        if (!this.compareWith) {
            this.compareWith = (o1: any, o2: any) => {
                return o1 === o2;
            };
        }

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
        // option ids
        const selectedOptionsIds = this.value !== null && this.value !== undefined ? (
            _.isArray(this.value) ?
                this.value :
                [this.value]
        ) : [];

        // determine selected options
        this.selectedOptions = _.isEmpty(this.options) ?
            [] :
            _.transform(selectedOptionsIds, (result, selectedValue) => {
                const v = _.find(this.options, (option) => {
                    return this.compareWith ?
                        this.compareWith(option[this.optionValueKey], selectedValue) :
                        option[this.optionValueKey] === selectedValue;
                });
                if (v !== undefined) {
                    result.push(v);
                }
            }, []);
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

    /**
     * After view initialized
     */
    ngAfterViewInit() {
        // wait for the input object to be initialized
        // then trigger the initialized event
        setTimeout(() => {
            this.initialized.emit(this.value);
        });

        super.ngAfterViewInit();
    }

    /**
     * Clear timeout callback
     */
    private clearFilterTimeoutCall() {
        // clear
        if (this._filterTimeout) {
            clearTimeout(this._filterTimeout);
        }

        // nothing to call anymore
        this._filterTimeout = undefined;
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
            !this.enableFilterOptions ||
            !byValue ||
            !this.optionLabelKey
        ) {
            // all visible options
            this.filteredOptions = this.displayInvisibleItems ?
                this.options :
                this.options.filter((item: any): boolean => {
                    return this.optionVisibleKey &&
                        item[this.optionVisibleKey] !== false;
                });

            // finished
            return;
        }

        // clear timeout interval and filter
        this.clearFilterTimeoutCall();
        this._filterTimeout = setTimeout(() => {
            // case sensitive
            byValue = this.filterOptionsIsCaseSensitive ? byValue : byValue.toLowerCase();

            // filter
            this.filteredOptions = this.options.filter((item: any): boolean => {
                // nothing to filter ?
                if (
                    !this.optionLabelKey ||
                    !item[this.optionLabelKey] ||
                    !this.optionVisibleKey ||
                    item[this.optionVisibleKey] === false
                ) {
                    return false;
                }

                // prepare to filter
                let translatedValue: string = this.i18nService.instant(item[this.optionLabelKey]);
                translatedValue = this.filterOptionsIsCaseSensitive ? translatedValue : translatedValue.toLowerCase();

                // filter
                return this.filterOptionsComparator(byValue, translatedValue);
            });
        }, this.filterOptionsDelayMs);
    }
}
