import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, HostBinding, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';
import { MatOptionSelectionChange, MatSelect } from '@angular/material';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Used to map groups for easy access to a group by using its unique key
 */
export interface ISelectGroupMap<T> {
    [groupValueKey: string]: T;
}

/**
 * Used to map group child options for easy access to a options and its parent group by using its unique key
 */
export interface ISelectGroupOptionMap<T> {
    [optionValue: string]: {
        groupValue: string,
        option: T
    };
}

/**
 * Used to format child option labels & tooltips
 */
export interface ISelectGroupOptionFormatResponse {
    label: SafeHtml;
    tooltip: string;
}

@Component({
    selector: 'app-form-select-groups',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-select-groups.component.html',
    styleUrls: ['./form-select-groups.component.less'],
    providers: [{
        provide: NG_VALUE_ACCESSOR,
        useExisting: FormSelectGroupsComponent,
        multi: true
    }]
})
export class FormSelectGroupsComponent extends ElementBase<string[]> implements OnInit {
    // identifier
    static identifier: number = 0;

    // unique component id
    public identifier = `form-select-groups-${FormSelectGroupsComponent.identifier++}`;

    // form element
    @HostBinding('class.form-element-host') isFormElement = true;

    // handler to mat select
    @ViewChild('selectGroup', { read: MatSelect }) matSelect: MatSelect;

    // input data
    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;
    @Input() groupLabelKey: string;
    @Input() groupValueKey: string;
    @Input() groupTooltipKey: string;
    @Input() groupOptionsKey: string;
    @Input() groupOptionLabelKey: string;
    @Input() groupOptionValueKey: string;
    @Input() groupOptionTooltipKey: string;
    @Input() groupNoneLabel: string;
    @Input() groupNoneTooltip: string;
    @Input() groupPartialLabel: string;
    @Input() groupPartialTooltip: string;
    @Input() groupAllLabel: string;
    @Input() groupAllTooltip: string;

    // internal data used to map custom group options
    groupKeys: {
        partial: {
            [groupValueKey: string]: string
        },
        none: {
            [groupValueKey: string]: string
        },

        // uuid key map to groupValueKey
        map: {
            partial: {
                [uuid: string]: string
            },
            none: {
                [uuid: string]: string
            }
        }
    } = {
        partial: {},
        none: {},
        map: {
            partial: {},
            none: {}
        }
    };

    // partial option - child options that were selected - label
    partialOptions: {
        [partielKey: string]: string
    } = {};

    // mapped group list for easy access to a group using group unique key
    groupsMap: ISelectGroupMap<any> = {};

    // mapped group option list for easy access to a option or its parent group using option unique key
    optionsMap: ISelectGroupOptionMap<any> = {};

    // list of expanded groups - display child options instead of group options ( none, partial, all )
    expandedGroups: {
        [groupId: string]: boolean
    } = {};

    // group data - select options
    private _groups: any[];
    @Input() set groups(groups: any[]) {
        // set groups
        this._groups = groups;

        // wait for binding to take place
        setTimeout(() => {
            // initialize groups
            this.initializeGroups();

            // translate tooltips
            this.initializeGroupLabelsAndTooltips();

            // render options
            this.valueChangedTrigger();
        });
    }
    get groups(): any[] {
        return this._groups;
    }

    // select tooltip language handler
    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    // what we see when mat select is collapsed - selected value
    selectTriggerText: string = '';

    // event triggered when value changes ( called after popup closes )
    @Output() optionChanged = new EventEmitter<any>();

    // group child option label translations - optimization
    labelTranslations: {
        [groupOptionLabelKey: string]: SafeHtml
    } = {};

    // group child option tooltip translations - optimization
    tooltipTranslations: {
        [groupOptionValueKey: string]: string
    } = {};

    // used to format group options labels / tooltips.. ( add extra information )
    @Input() groupOptionFormatMethod: (
        sanitized: DomSanitizer,
        i18nService: I18nService,
        groupsMap: ISelectGroupMap<any>,
        optionsMap: ISelectGroupOptionMap<any>,
        option: any
    ) => ISelectGroupOptionFormatResponse;

    // list of items should be displayed as default values
    private _defaultValues: any[] = [];
    public get defaultValues(): any[] {
        return this._defaultValues;
    }
    @Input() public set defaultValues(defaultValues: any[]) {
        // set default values
        this._defaultValues = defaultValues;

        // add default values if necessary
        this.initializeDefaultValues(this.value);
    }

    /**
     * Constructor
     */
    constructor(
        @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
        @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
        @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
        protected i18nService: I18nService,
        protected sanitized: DomSanitizer
    ) {
        super(controlContainer, validators, asyncValidators);

        // on language change..we need to translate again the token
        this.i18nService.languageChangedEvent.subscribe(() => {
            // trigger update
            this.tooltip = this._tooltipToken;

            // translate tooltips
            this.initializeGroupLabelsAndTooltips();

            // language changed
            this.valueChangedTrigger();
        });
    }

    /**
     * Component initialized
     */
    ngOnInit(): void {
        // hack for select scroll bug
        this.hackSelectForScrollBug();
    }

    /**
     * Fixes mat-select scroll option into view not working properly when option height is changes
     */
    hackSelectForScrollBug() {
        // check if we have the component needed for fix
        if (!this.matSelect) {
            setTimeout(() => {
                this.hackSelectForScrollBug();
            }, 100);
            return;
        }

        // // overwrite scroll into view
        this.matSelect['_scrollActiveOptionIntoView'] = () => {};
    }

    /**
     * Initialize Groups
     */
    initializeGroups() {
        // reset expanded groups
        this.expandedGroups = {};

        // map group options to groups
        // option id should be unique on all groups and not only under parent group
        // due to optimization right not it ISN'T NEEDED to run this logic after groupOptionsKey / groupValueKey / groupOptionValueKey / this.value changes
        this.optionsMap = {};
        this.groupsMap = {};
        this.partialOptions = {};
        this.groupKeys = {
            partial: {},
            none: {},
            map: {
                partial: {},
                none: {}
            }
        };
        if (
            this.groups &&
            this.groupOptionsKey &&
            this.groupValueKey &&
            this.groupOptionValueKey
        ) {
            this.groups.forEach((group) => {
                // map group
                this.groupsMap[group[this.groupValueKey]] = group;

                // set partial key
                const partialValue: string = uuid();
                this.groupKeys.partial[group[this.groupValueKey]] = partialValue;
                this.groupKeys.map.partial[partialValue] = group[this.groupValueKey];

                // set none key
                const noneValue: string = uuid();
                this.groupKeys.none[group[this.groupValueKey]] = noneValue;
                this.groupKeys.map.none[noneValue] = group[this.groupValueKey];

                // map options
                (group[this.groupOptionsKey] || []).forEach((option) => {
                    // map option
                    this.optionsMap[option[this.groupOptionValueKey]] = {
                        groupValue: group[this.groupValueKey],
                        option: option
                    };
                });
            });
        }
    }

    /**
     * Translate tooltips - optimization so we don't trigger translation multiple times because of the binding system
     */
    initializeGroupLabelsAndTooltips() {
        // reset value
        this.tooltipTranslations = {};
        this.labelTranslations = {};

        // continue only if we have groups
        if (
            !this.groups ||
            !this.groupOptionsKey || (
                !this.groupOptionLabelKey &&
                !this.groupOptionTooltipKey
            )
        ) {
            return;
        }

        // go through groups & translate options
        this.groups.forEach((group) => {
            // translate group options
            (group[this.groupOptionsKey] || []).forEach((option) => {
                // format tooltips and labels ?
                if (this.groupOptionFormatMethod) {
                    // determine label & tooltip
                    const formatResponse = this.groupOptionFormatMethod(
                        this.sanitized,
                        this.i18nService,
                        this.groupsMap,
                        this.optionsMap,
                        option
                    );

                    // label
                    if (this.groupOptionLabelKey) {
                        this.labelTranslations[option[this.groupOptionLabelKey]] = formatResponse.label ? formatResponse.label : '';
                    }

                    // tooltip
                    if (this.groupOptionTooltipKey) {
                        this.tooltipTranslations[option[this.groupOptionTooltipKey]] = formatResponse.tooltip ? formatResponse.tooltip : '';
                    }
                } else {
                    // label
                    if (this.groupOptionLabelKey) {
                        this.labelTranslations[option[this.groupOptionLabelKey]] = this.i18nService.instant(option[this.groupOptionLabelKey]);
                    }

                    // tooltip
                    if (this.groupOptionTooltipKey) {
                        this.tooltipTranslations[option[this.groupOptionTooltipKey]] = this.i18nService.instant(option[this.groupOptionTooltipKey]);
                    }
                }
            });
        });
    }

    /**
     * Render options
     */
    valueChangedTrigger() {
        // reset text
        this.selectTriggerText = '';

        // go through selected values and render selected text
        if (
            this.groups &&
            this.value
        ) {
            (this.value || []).forEach((selectedOptionValue: string) => {
                // determine option label
                const text: string = this.groupsMap[selectedOptionValue] ?
                    `${this.i18nService.instant(this.groupAllLabel)} ${this.i18nService.instant(this.groupsMap[selectedOptionValue][this.groupLabelKey])}` :
                    `${!this.optionsMap[selectedOptionValue] ? '' : this.i18nService.instant(this.optionsMap[selectedOptionValue].option[this.groupOptionLabelKey])}`
                ;

                // add option label
                this.selectTriggerText = `${this.selectTriggerText}${!this.selectTriggerText ? '' : ', '}${text}`;
            });
        }
    }

    /**
     * Trigger the 'touch' action on the custom form control
     */
    onBlur() {
        this.touch();
    }

    /**
     * Check if a dom object or one of its parents has a specific class
     */
    checkIfParentHasClass(target, className: string): boolean {
        // no dom object provided ?
        if (!target) {
            return false;
        }

        // found ?
        if (
            target.classList &&
            target.classList.contains(className)
        ) {
            return true;
        }

        // check parent
        return this.checkIfParentHasClass(
            target.parentNode,
            className
        );
    }

    /**
     * Group clicked
     */
    clickedGroup(
        event,
        group,
        className: string
    ) {
        if (
            event &&
            this.checkIfParentHasClass(
                event.target,
                className
            )
        ) {
            // change expand
            this.expandedGroups[group[this.groupValueKey]] = !this.expandedGroups[group[this.groupValueKey]];

            // call value changed
            if (!this.expandedGroups[group[this.groupValueKey]]) {
                this.valueChanged(
                    this.value,
                    true
                );
            }
        }
    }

    /**
     * Check if partial / all options are checked
     */
    othersAreChecked(
        key1: string,
        key2: string
    ): boolean {
        return this.value &&
            (
                this.value.indexOf(key1) > -1 ||
                this.value.indexOf(key2) > -1
            );
    }

    /**
     * Add partial / none keys
     */
    selectGroupKeys() {
        // value must always exist
        if (!this.value) {
            this.value = [];
        }

        // check if we need to add partial & none keys
        let valueChanged: boolean = false;
        const notEmptyGroups: {
            [groupValueKey: string]: boolean
        } = {};
        this.value.forEach((optionValue: string) => {
            // group option ?
            if (
                this.optionsMap &&
                this.optionsMap[optionValue] &&
                this.groupKeys.partial[this.optionsMap[optionValue].groupValue]
            ) {
                // mark group as having at least one option selected
                notEmptyGroups[this.optionsMap[optionValue].groupValue] = true;

                // add partial key
                if (this.value.indexOf(this.groupKeys.partial[this.optionsMap[optionValue].groupValue]) < 0) {
                    this.value.push(this.groupKeys.partial[this.optionsMap[optionValue].groupValue]);
                    valueChanged = true;
                }
            } else if (
                // group ?
                this.groupsMap[optionValue]
            ) {
                // mark group as having at least one option selected
                notEmptyGroups[optionValue] = true;
            }
        });

        // go through each group key and add those that are empty
        _.each(this.groupKeys.none, (noneKey: string, groupValueKey: string) => {
            if (!notEmptyGroups[groupValueKey]) {
                // add none key
                if (this.value.indexOf(this.groupKeys.none[groupValueKey]) < 0) {
                    this.value.push(this.groupKeys.none[groupValueKey]);
                    valueChanged = true;
                }
            }
        });

        // force select update - check options
        if (valueChanged) {
            this.value = [...this.value];
        }
    }

    /**
     * Remove partial / none keys
     */
    removeGroupKeys() {
        // collapse expanded groups
        this.expandedGroups = {};

        // remove none & partial keys
        if (this.value) {
            // remove keys
            const newValue = [];
            let valueChanged: boolean = false;
            this.value.forEach((optionValue: string) => {
                if (
                    !this.groupKeys.map.partial[optionValue] &&
                    !this.groupKeys.map.none[optionValue]
                ) {
                    newValue.push(optionValue);
                } else {
                    valueChanged = true;
                }
            });

            // update value ?
            if (valueChanged) {
                this.value = newValue;
            }
        }
    }

    /**
     * Add partial ids
     */
    valueChanged(
        values,
        dontCallSelectGroup?: boolean
    ) {
        // reset all partial keys
        this.partialOptions = {};
        _.each(this.groupKeys.map.partial, (groupValueKey: string, partialValue: string) => {
            this.partialOptions[partialValue] = '';
        });

        // check partial check
        const allKeys = values ? [...values] : values;
        (allKeys || []).forEach((value: string) => {
            // partial key ?
            if (this.groupKeys.map.partial[value]) {
                // determine what was previously selected
                const groupValueKey: string = this.groupKeys.map.partial[value];
                (this.value || []).forEach((selectedValue: string) => {
                    // option has the same group ?
                    if (
                        this.optionsMap[selectedValue] &&
                        this.optionsMap[selectedValue].groupValue === groupValueKey
                    ) {
                        // add name to the list of selected child options
                        this.partialOptions[value] = this.partialOptions[value] +
                            (this.partialOptions[value] ? ', ' : ' - ') +
                            this.i18nService.instant(this.optionsMap[selectedValue].option[this.groupOptionLabelKey]);

                        // already added to the list ?
                        if (values.indexOf(selectedValue) < 0) {
                            values.push(selectedValue);
                        }
                    }
                });
            }
        });

        // select missing keys if needed
        if (!dontCallSelectGroup) {
            setTimeout(() => {
                this.selectGroupKeys();
            });
        }
    }

    /**
     * Display proper option under panel
     */
    openedChange(panelVisible: boolean) {
        // add / remove - partial / none keys
        if (panelVisible) {
            // select groups
            this.selectGroupKeys();

            // call value changed
            this.valueChanged(
                this.value,
                true
            );
        } else {
            // cleanup
            this.removeGroupKeys();

            // render options
            this.valueChangedTrigger();

            // emit change event
            this.optionChanged.emit(this.value);
        }
    }

    /**
     * Uncheck other checkboxes ( all / partial / none )
     * @param changed
     */
    uncheckOthers(changed: MatOptionSelectionChange) {
        setTimeout(() => {
            if (
                changed.isUserInput &&
                changed.source.active &&
                this.value
            ) {
                // option is either all / none or partial ?
                const checkedValue: string = changed.source.value;
                let index: number = -1;
                let valueChanged: boolean = false;
                // all key?
                if (this.groupsMap[checkedValue]) {
                    // uncheck partial key
                    if (
                        this.groupKeys.partial[checkedValue] &&
                        (index = this.value.indexOf(this.groupKeys.partial[checkedValue])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }

                    // uncheck none key
                    if (
                        this.groupKeys.none[checkedValue] &&
                        (index = this.value.indexOf(this.groupKeys.none[checkedValue])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }

                // partial key?
                } else if (this.groupKeys.map.partial[checkedValue]) {
                    // uncheck all key
                    if (
                        (index = this.value.indexOf(this.groupKeys.map.partial[checkedValue])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }

                    // uncheck none key
                    if (
                        this.groupKeys.none[this.groupKeys.map.partial[checkedValue]] &&
                        (index = this.value.indexOf(this.groupKeys.none[this.groupKeys.map.partial[checkedValue]])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }

                // none key?
                } else if (this.groupKeys.map.none[checkedValue]) {
                    // uncheck all key
                    if (
                        (index = this.value.indexOf(this.groupKeys.map.none[checkedValue])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }

                    // uncheck partial key
                    if (
                        this.groupKeys.partial[this.groupKeys.map.none[checkedValue]] &&
                        (index = this.value.indexOf(this.groupKeys.partial[this.groupKeys.map.none[checkedValue]])) > -1
                    ) {
                        this.value.splice(index, 1);
                        valueChanged = true;
                    }
                }

                // force select update - check options
                if (valueChanged) {
                    // if all / none then we need to remove partial items
                    let groupValueKey: string;
                    const newValue = [];
                    if (
                        this.groupsMap[groupValueKey = checkedValue] ||
                        (groupValueKey = this.groupKeys.map.none[checkedValue])
                    ) {
                        (this.value || []).forEach((optionValue: string) => {
                            if (
                                !this.optionsMap[optionValue] ||
                                this.optionsMap[optionValue].groupValue !== groupValueKey
                            ) {
                                newValue.push(optionValue);
                            }
                        });
                    }

                    // update
                    this.value = newValue;

                    // update values with partial ones
                    this.valueChanged(this.value);
                }
            }
        });
    }

    /**
     * Initialize default values
     */
    initializeDefaultValues(value: string[]) {
        if (
            value &&
            this.groupOptionValueKey
        ) {
            (this.defaultValues || []).forEach((defaultValue) => {
                if (
                    defaultValue[this.groupOptionValueKey] &&
                    value.indexOf(defaultValue[this.groupOptionValueKey]) < 0
                ) {
                    value.push(defaultValue[this.groupOptionValueKey]);
                }
            });
        }
    }

    /**
     * All users should have access to view system version
     */
    writeValue(value: string[]) {
        // add system version view ?
        value = value ? value : [];

        // add default values if necessary
        this.initializeDefaultValues(value);

        // send data further to parent
        super.writeValue(value);

        // render options
        this.valueChangedTrigger();
    }
}
