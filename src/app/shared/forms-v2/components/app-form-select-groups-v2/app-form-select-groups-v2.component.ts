import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional, Output,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { MAT_SELECT_CONFIG, MatSelect } from '@angular/material/select';
import { GroupEventDataAction, IGroupEventData, IGroupOptionEventData, ISelectGroupMap, ISelectGroupOptionFormatResponse, ISelectGroupOptionMap } from './models/select-group.model';
import * as _ from 'lodash';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { v4 as uuid } from 'uuid';
import { MatOptionSelectionChange } from '@angular/material/core';

@Component({
  selector: 'app-form-select-groups-v2',
  templateUrl: './app-form-select-groups-v2.component.html',
  styleUrls: ['./app-form-select-groups-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectGroupsV2Component),
    multi: true
  }, {
    provide: MAT_SELECT_CONFIG,
    useValue: {
      overlayPanelClass: 'gd-cdk-overlay-pane-dropdown-groups'
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectGroupsV2Component
  extends AppFormBaseV2<string[]> implements OnDestroy {

  // select item
  @ViewChild('selectItem') selectItem: MatSelect;

  // float label
  @Input() neverFloatLabel: boolean = false;

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // group keys
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
  @Input() groupOptionHiddenKey: string;

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
    i18nService: TranslateService,
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

  // valueChanged method triggered
  private _valueChangedTriggered: boolean = false;

  /**
   * Triggered when a group option is checked / unchecked
   */
  @Output() groupSelectionChanged = new EventEmitter<IGroupEventData>();

  /**
   * Triggered when a group child option is checked / unchecked
   */
  @Output() groupOptionCheckStateChanged = new EventEmitter<IGroupOptionEventData>();

  /**
   * Process options to be applied on filters
   */
  static processValuesForFilter(
    values: string[],
    defaultValues: any[],
    groupOptionValueKey: string
  ): string[] {
    return (values || []).filter((optionId) => {
      return defaultValues &&
        groupOptionValueKey &&
        !defaultValues.find((value) => {
          return value[groupOptionValueKey] === optionId;
        });
    });
  }

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef,
    protected sanitized: DomSanitizer
  ) {
    super(
      controlContainer,
      translateService,
      changeDetectorRef
    );
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    super.onDestroy();
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

    // reset value changed triggered
    this._valueChangedTriggered = false;

    // render options
    this.valueChangedTrigger();
  }

  /**
   * Initialize Groups
   */
  initializeGroups() {
    // reset expanded groups
    this.expandedGroups = {};

    // reset value changed triggered
    this._valueChangedTriggered = false;

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
        this.groupsMap[group[this.groupValueKey]] = _.cloneDeep(group);

        // set partial key
        const partialValue: string = uuid();
        this.groupKeys.partial[group[this.groupValueKey]] = partialValue;
        this.groupKeys.map.partial[partialValue] = group[this.groupValueKey];

        // set none key
        const noneValue: string = uuid();
        this.groupKeys.none[group[this.groupValueKey]] = noneValue;
        this.groupKeys.map.none[noneValue] = group[this.groupValueKey];

        // map options
        const oldOptions: any[] = group[this.groupOptionsKey] || [];
        const newOptions: any[] = [];
        oldOptions.forEach((option) => {
          // exclude hidden properties
          if (
            this.groupOptionHiddenKey &&
            option[this.groupOptionHiddenKey]
          ) {
            return;
          }

          // add it to the list
          newOptions.push(option);

          // map option
          this.optionsMap[option[this.groupOptionValueKey]] = {
            groupValue: group[this.groupValueKey],
            option: option
          };
        });

        // set options
        group[this.groupOptionsKey] = newOptions;
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
            this.translateService,
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
            this.labelTranslations[option[this.groupOptionLabelKey]] = this.translateService.instant(option[this.groupOptionLabelKey]);
          }

          // tooltip
          if (this.groupOptionTooltipKey) {
            this.tooltipTranslations[option[this.groupOptionTooltipKey]] = this.translateService.instant(option[this.groupOptionTooltipKey]);
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
      // determine labels
      const labels: string[] = [];
      (this.value || []).forEach((selectedOptionValue: string) => {
        // exclude default options
        if (
          this.groupOptionValueKey &&
          this.defaultValues &&
          this.defaultValues.find((value) => {
            return value[this.groupOptionValueKey] === selectedOptionValue;
          })
        ) {
          return;
        }

        // determine option label
        labels.push(
          this.groupsMap[selectedOptionValue] ?
            `${this.translateService.instant(this.groupAllLabel)} ${this.translateService.instant(this.groupsMap[selectedOptionValue][this.groupLabelKey])}` :
            `${!this.optionsMap[selectedOptionValue] ? '' : this.translateService.instant(this.optionsMap[selectedOptionValue].option[this.groupOptionLabelKey])}`
        );
      });

      // sort labels
      labels.sort((l1: string, l2: string) => {
        return l1.toLowerCase().localeCompare(l2.toLowerCase());
      });

      // add option label
      this.selectTriggerText = labels.join(', ');
    }

    // re-render ui
    this.changeDetectorRef.detectChanges();
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
    _.each(this.groupKeys.none, (_noneKey: string, groupValueKey: string) => {
      if (!notEmptyGroups[groupValueKey]) {
        // add none key
        if (this.value.indexOf(this.groupKeys.none[groupValueKey]) < 0) {
          this.value.push(this.groupKeys.none[groupValueKey]);
          valueChanged = true;
        }
      } else {
        // remove none option if we have to
        const noneIndex: number = this.value.indexOf(this.groupKeys.none[groupValueKey]);
        if (noneIndex > -1) {
          this.value.splice(noneIndex, 1);
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
   * Refresh partial keys
   */
  refreshPartialKeys(values: string[]) {
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
              this.translateService.instant(this.optionsMap[selectedValue].option[this.groupOptionLabelKey]);

            // already added to the list ?
            if (values.indexOf(selectedValue) < 0) {
              values.push(selectedValue);
            }
          }
        });
      }
    });
  }

  /**
   * Add partial ids
   */
  valueChanged(
    values: string[],
    dontCallSelectGroup?: boolean
  ) {
    // reset all partial keys
    this.partialOptions = {};
    _.each(this.groupKeys.map.partial, (_groupValueKey: string, partialValue: string) => {
      this.partialOptions[partialValue] = '';
    });

    // check partial check
    this.refreshPartialKeys(values);

    // select missing keys if needed
    if (!dontCallSelectGroup) {
      // announce that value changes was triggered
      this._valueChangedTriggered = true;

      // determine group keys
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
      if (this._valueChangedTriggered) {
        // reset change trigger
        this._valueChangedTriggered = false;

        // emit event after binding is done
        setTimeout(() => {
          this.optionChanged.emit(
            AppFormSelectGroupsV2Component.processValuesForFilter(
              this.value,
              this.defaultValues,
              this.groupOptionValueKey
            )
          );
        });
      }
    }
  }

  /**
   * Add values
   */
  private internalAddValues(...values: string[]): string[] {
    // add values and rerender list
    // make sure we don't add duplicates
    this.value = this.value || [];
    let valueChanged: boolean = false;
    const groupIds: string[] = [];
    (values || []).forEach((value: string) => {
      // did we already add it to the group ?
      if (this.value.indexOf(value) < 0) {
        // add to the list
        this.value.push(value);

        // if this is a group option, then we need to do some cleanup - remove partial options
        if (
          this.groupsMap &&
          this.groupOptionValueKey &&
          this.groupOptionsKey &&
          this.groupsMap[value]
        ) {
          groupIds.push(value);
        }

        // tell system that we need to update select options
        valueChanged = true;
      }
    });

    // update only if we have to
    if (valueChanged) {
      // check to see if one of these options was a group option
      if (
        this.value &&
        groupIds.length > 0
      ) {
        groupIds.forEach((groupValueKey: string) => {
          // remove partial options
          const groupOptions: any[] = this.groupsMap[groupValueKey][this.groupOptionsKey];
          (groupOptions || []).forEach((groupOption: any) => {
            const groupOptionId: string = groupOption[this.groupOptionValueKey];
            let groupOptionIndex: number;
            if (
              groupOptionId &&
              (groupOptionIndex = this.value.indexOf(groupOptionId)) !== -1
            ) {
              // remove group child option since we checked group all option
              this.value.splice(groupOptionIndex, 1);
            }
          });

          // remove partial key if necessary
          const partialKeyIndex: number = this.value.indexOf(this.groupKeys.partial[groupValueKey]);
          if (partialKeyIndex !== -1) {
            this.value.splice(partialKeyIndex, 1);
          }

          // remove none key if necessary - this shouldn't be possible..but...
          const noneKeyIndex: number = this.value.indexOf(this.groupKeys.none[groupValueKey]);
          if (noneKeyIndex !== -1) {
            this.value.splice(noneKeyIndex, 1);
          }

          // collapse group
          if (this.expandedGroups[groupValueKey]) {
            this.expandedGroups[groupValueKey] = false;
          }
        });
      }

      // update values with partial ones / group all
      this.value = [...this.value];
      this.valueChanged(this.value);

      // update
      this.valueChangedTrigger();

      // force partial refresh keys
      // fix for when jumping from 'None' to 'Partial' group checkbox
      setTimeout(() => {
        this.refreshPartialKeys(this.value);
      });
    }

    // finished
    return [...this.value];
  }

  /**
   * Uncheck other checkboxes ( all / partial / none )
   */
  uncheckOthers(changed: MatOptionSelectionChange) {
    // wait for data bind
    if (changed.isUserInput) {
      // keep reference to previous value
      const previousValue: string[] = this.value ? [...this.value] : [];

      // wait for data to bind
      setTimeout(() => {
        // handle group option checked & unchecked
        if (
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

        // trigger group events
        if (changed.source.value) {
          // determine group and action
          let action: GroupEventDataAction;
          let group: any;
          if (this.groupsMap[changed.source.value]) {
            action = GroupEventDataAction.All;
            group = this.groupsMap[changed.source.value];
          } else if (this.groupKeys.map.none[changed.source.value]) {
            action = GroupEventDataAction.None;
            group = this.groupsMap[this.groupKeys.map.none[changed.source.value]];
          } else if (this.groupKeys.map.partial[changed.source.value]) {
            action = GroupEventDataAction.Partial;
            group = this.groupsMap[this.groupKeys.map.partial[changed.source.value]];
          }

          // trigger event
          if (
            group &&
            action
          ) {
            const self = this;
            this.groupSelectionChanged.emit({
              action,
              group,
              value: [...this.value],
              previousValue: previousValue,
              groupsMap: this.groupsMap,
              optionsMap: this.optionsMap,
              addValues: (...values: string[]): string[] => {
                return this.internalAddValues(...values);
              },
              hidePanel(): void {
                self.selectItem.close();
              }
            });
          }
        }
      });
    }
  }

  /**
   * Checked child option
   */
  checkedChildOption(changed: MatOptionSelectionChange) {
    // user input ?
    if (changed.isUserInput) {
      // determine if previously all group option was selected
      const groupAllOptionWasSelected: boolean = this.value &&
        this.optionsMap[changed.source.value] &&
        this.value.indexOf(this.optionsMap[changed.source.value].groupValue) > -1;

      // wait for data bind
      setTimeout(() => {
        // selected option
        if (changed.source.value) {
          // retrieve selected option
          const mapOption = this.optionsMap[changed.source.value];
          if (mapOption) {
            // retrieve option data
            const option = mapOption.option;
            const group = this.groupsMap[mapOption.groupValue];

            // trigger event
            if (
              option &&
              group
            ) {
              const self = this;
              this.groupOptionCheckStateChanged.emit({
                group,
                option,
                checked: changed.source.selected,
                allWasSelected: groupAllOptionWasSelected,
                groupsMap: this.groupsMap,
                optionsMap: this.optionsMap,
                value: [...this.value],
                addValues: (...values: string[]): string[] => {
                  return this.internalAddValues(...values);
                },
                hidePanel(): void {
                  self.selectItem.close();
                }
              });
            }
          }
        }
      });
    }
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
   * Clear selected options
   */
  clearSelected(event: MouseEvent) {
    // stop propagation
    event.preventDefault();
    event.stopPropagation();

    // if already empty, then we don't need to clear it
    if (
      !this.value ||
      this.value.length < 1
    ) {
      return;
    }

    // clear
    this.value = [];

    // add default values if necessary
    this.initializeDefaultValues(this.value);

    // value changed
    this._valueChangedTriggered = true;

    // render options
    this.valueChangedTrigger();
  }
}
