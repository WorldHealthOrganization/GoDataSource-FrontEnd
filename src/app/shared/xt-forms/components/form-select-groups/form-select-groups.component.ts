import { Component, Input, ViewEncapsulation, Optional, Inject, Host, SkipSelf, HostBinding, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { v4 as uuid } from 'uuid';
import * as _ from 'lodash';
import { MatOptionSelectionChange, MatSelect } from '@angular/material';
import { PERMISSION } from '../../../../core/models/permission.model';

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
    static identifier: number = 0;

    @HostBinding('class.form-element-host') isFormElement = true;

    @ViewChild('selectGroup', { read: MatSelect }) matSelect: MatSelect;

    @Input() placeholder: string;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() name: string;

    // constants
    PERMISSION = PERMISSION;

    // data
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

    partialPermissions: {
        [partielKey: string]: string
    } = {};
    groupsMap: {
        [groupValueKey: string]: any
    } = {};
    optionsMap: {
        [optionValue: string]: {
            groupValue: string,
            option: any
        }
    } = {};
    expandedGroups: {
        [groupId: string]: boolean
    } = {};
    private _groups: any[];
    @Input() set groups(groups: any[]) {
        // set groups
        this._groups = groups;

        // wait for binding to take place
        setTimeout(() => {
            // reset expanded groups
            this.expandedGroups = {};

            // map group options to groups
            // option id should be unique on all groups and not only under parent group
            // due to optimization right not it ISN'T NEEDED to run this logic after groupOptionsKey / groupValueKey / groupOptionValueKey / this.value changes
            this.optionsMap = {};
            this.groupsMap = {};
            this.partialPermissions = {};
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

            // render options
            this.valueChangedTrigger();
        });
    }
    get groups(): any[] {
        return this._groups;
    }
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

    private _tooltipToken: string;
    private _tooltip: string;
    @Input() set tooltip(tooltip: string) {
        this._tooltipToken = tooltip;
        this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken) : this._tooltipToken;
    }
    get tooltip(): string {
        return this._tooltip;
    }

    public identifier = `form-select-groups-${FormSelectGroupsComponent.identifier++}`;

    selectTriggerText: string = '';

    @Output() optionChanged = new EventEmitter<any>();

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

        // on language change..we need to translate again the token
        this.i18nService.languageChangedEvent.subscribe(() => {
            this.tooltip = this._tooltipToken;

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
        this.partialPermissions = {};
        _.each(this.groupKeys.map.partial, (groupValueKey: string, partialValue: string) => {
            this.partialPermissions[partialValue] = '';
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
                        // add name to the list of permissions
                        this.partialPermissions[value] = this.partialPermissions[value] +
                            (this.partialPermissions[value] ? ', ' : ' - ') +
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
            this.optionChanged.emit(
                (this.value || []).filter(
                    (permissionId: string) => ([PERMISSION.SYSTEM_VERSION_VIEW] as string[]).indexOf(permissionId) < 0
                )
            );
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
     * All users should have access to view system version
     */
    writeValue(value: string[]) {
        // add system version view ?
        value = value ? value : [];
        if (value && value.indexOf(PERMISSION.SYSTEM_VERSION_VIEW) < 0) {
            value.push(PERMISSION.SYSTEM_VERSION_VIEW);
        }

        // send data further to parent
        super.writeValue(value);

        // render options
        this.valueChangedTrigger();
    }
}
