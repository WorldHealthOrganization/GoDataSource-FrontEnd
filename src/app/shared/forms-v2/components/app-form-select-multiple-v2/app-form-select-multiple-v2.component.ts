import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, EventEmitter,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional, Output,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';
import { MAT_SELECT_CONFIG } from '@angular/material/select';
import * as _ from 'lodash';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { I18nService } from '../../../../core/services/helper/i18n.service';

@Component({
  selector: 'app-form-select-multiple-v2',
  templateUrl: './app-form-select-multiple-v2.component.html',
  styleUrls: ['./app-form-select-multiple-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectMultipleV2Component),
    multi: true
  }, {
    provide: MAT_SELECT_CONFIG,
    useValue: {
      overlayPanelClass: [
        'gd-cdk-overlay-pane-dropdown',
        'gd-cdk-overlay-pane-dropdown-multi'
      ]
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectMultipleV2Component
  extends AppFormBaseV2<string[]> implements OnDestroy {
  // has no value
  static readonly HAS_NO_VALUE: string = '---has-no-value---';

  // float label
  @Input() neverFloatLabel: boolean = false;

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // tooltip
  @Input() optionTooltipKey: string;

  // tooltip
  tooltipButton: IAppFormIconButtonV2;
  private _tooltip: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // translate tooltip
    const tooltipTranslated = this._tooltip ?
      this.i18nService.instant(this._tooltip) :
      this._tooltip;

    // add / remove tooltip icon
    this.tooltipButton = !tooltipTranslated ?
      undefined : {
        icon: 'help',
        tooltip: tooltipTranslated
      };
  }
  get tooltip(): string {
    return this._tooltip;
  }

  // include no value ?
  private _includeNoValue: boolean;
  @Input() set includeNoValue(includeNoValue: boolean) {
    // set data
    this._includeNoValue = includeNoValue;

    // has options ?
    if (this.allOptions) {
      // determine if we need to add has no value
      const index: number = this.allOptions.findIndex((item) => item.value === AppFormSelectMultipleV2Component.HAS_NO_VALUE);
      if (index > -1) {
        this.allOptions.splice(
          index,
          1
        );
      }

      // add no value if missing
      if (this._includeNoValue) {
        // add to all options
        const item = {
          label: this.i18nService.instant('LNG_COMMON_LABEL_NONE'),
          value: AppFormSelectMultipleV2Component.HAS_NO_VALUE
        };
        this.allOptions.splice(
          0,
          0,
          item
        );

        // map it
        this.allOptionsMap[item.value] = item;
      }
    }
  }
  get includeNoValue(): boolean {
    return this._includeNoValue;
  }

  // options
  filteredOptions: ILabelValuePairModel[];
  allOptionsMap: {
    [value: string]: ILabelValuePairModel
  } = {};
  private allOptions: ILabelValuePairModel[];
  @Input() set options(options: ILabelValuePairModel[]) {
    // set all options
    this.allOptions = _.cloneDeep(options);

    // translate options and sort
    if (this.allOptions) {
      // determine if we need to add has no value
      const index: number = this.allOptions.findIndex((item) => item.value === AppFormSelectMultipleV2Component.HAS_NO_VALUE);
      if (index > -1) {
        this.allOptions.splice(
          index,
          1
        );
      }

      // translate
      this.allOptions
        .forEach((item) => {
          // translate
          item.label = item.label ?
            this.i18nService.instant(item.label) :
            item.label;
        });

      // sort
      this.allOptions
        .sort((item1, item2) => {
          // compare
          if (
            typeof item1.order === 'number' &&
            typeof item2.order === 'number'
          ) {
            // equal ?
            if (item1.order === item2.order) {
              return (item1.label ? this.i18nService.instant(item1.label) : '')
                .localeCompare((item2.label ? this.i18nService.instant(item2.label) : ''));
            }

            // finished
            return item1.order - item2.order;
          } else if (
            typeof item1.order === 'number' &&
            !item2.order
          ) {
            return -1;
          } else if (
            !item1.order &&
            typeof item2.order === 'number'
          ) {
            return 1;
          }

          // finished
          return (item1.label ? this.i18nService.instant(item1.label) : '')
            .localeCompare((item2.label ? this.i18nService.instant(item2.label) : ''));
        });

      // add no value if missing
      if (this.includeNoValue) {
        this.allOptions.splice(
          0,
          0,
          {
            label: this.i18nService.instant('LNG_COMMON_LABEL_NONE'),
            value: AppFormSelectMultipleV2Component.HAS_NO_VALUE
          }
        );
      }
    }

    // map for easy access
    this.allOptionsMap = {};
    (this.allOptions || []).forEach((item) => {
      this.allOptionsMap[item.value] = item;
    });

    // filter options
    this.filterOptions();
  }
  get options(): ILabelValuePairModel[] {
    return this.allOptions;
  }

  // allow disabled options to be selected ?
  @Input() allowDisabledToBeSelected: boolean = false;

  // toggle all
  toggleAllCheckboxChecked: boolean = false;

  // search value
  private _searchValue: string;

  // selected values
  selectedValues: {
    [value: string]: true
  } = {};

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport') cdkVirtualScrollViewport: CdkVirtualScrollViewport;

  // value changed and dropdown closed
  changedSinceLastChangedAndClosed: boolean = false;
  @Output() changedAndClosed = new EventEmitter<void>();

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    super(
      controlContainer,
      i18nService,
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
   * Update visible options depending on if they were disabled or not
   */
  writeValue(value: string[]) {
    // parent
    super.writeValue(value);

    // do we need to update options ?
    if (
      !this.allowDisabledToBeSelected &&
      this.value?.length
    ) {
      this.filterOptions();
    }
  }

  /**
   * Filter options
   */
  filterOptions(searchValue?: string): void {
    // update search value
    if (searchValue !== undefined) {
      this._searchValue = searchValue;
    }

    // nothing to filter ?
    if (!this.options) {
      this.filteredOptions = [];
      return;
    }

    // map selected values for easy find
    this.selectedValues = {};
    if (this.value?.length) {
      this.value.forEach((value) => {
        this.selectedValues[value] = true;
      });
    }

    // filter options
    if (!this._searchValue) {
      // all visible options
      this.filteredOptions = this.allowDisabledToBeSelected ?
        this.options :
        this.options.filter((item: ILabelValuePairModel): boolean => {
          return !item.disabled ||
            this.selectedValues[item.value];
        });

      // finished
      return;
    }

    // case insensitive
    const byValue: string = this._searchValue.toLowerCase();

    // filter
    this.filteredOptions = this.options.filter((item: ILabelValuePairModel): boolean => {
      return (
        this.allowDisabledToBeSelected ||
        !item.disabled ||
        this.selectedValues[item.value]
      ) && item.label.toLowerCase().indexOf(byValue) > -1;
    });
  }

  /**
   * vScroll to see the first selected item
   */
  vScrollToFirstSelectedOption(): void {
    // scroll to item ?
    if (
      this.value &&
      this.cdkVirtualScrollViewport
    ) {
      // hack to force re-render, otherwise we see an empty scroll
      if (
        this.value &&
        this.value.length > 0
      ) {
        // determine value to search
        const valueToSearch: string = this.value[0];
        const index: number = this.filteredOptions.findIndex((option) => option.value === valueToSearch);
        if (index > -1) {
          this.cdkVirtualScrollViewport.scrollToIndex(index);
        }
      }
    }
  }

  /**
   * Toggle all checkbox
   */
  toggleAll(checked: boolean): void {
    // map filtered items
    const filteredOptionsMap: {
      [value: string]: true
    } = {};
    this.filteredOptions.forEach((option) => {
      filteredOptionsMap[option.value] = true;
    });

    // value not initialized ?
    if (!this.value) {
      this.value = [];
    }

    // set check stats
    this.toggleAllCheckboxChecked = checked;

    // go through visible search items and check or uncheck them
    if (checked) {
      // remove already checked options
      this.value.forEach((value) => {
        delete filteredOptionsMap[value];
      });

      // append unchecked items
      Object.keys(filteredOptionsMap).forEach((value) => {
        this.value.push(value);
      });

      // trigger change
      this.onChange(this.value);
    } else {
      // change already triggered by setter
      this.value = this.value.filter((value) => !filteredOptionsMap[value]);
    }
  }

  /**
   * Trigger change and close
   */
  changedAndClosedTrigger(opened: boolean): void {
    // nothing to do ?
    if (
      opened ||
      !this.changedSinceLastChangedAndClosed
    ) {
      return;
    }

    // reset
    this.changedSinceLastChangedAndClosed = false;

    // emit event
    this.changedAndClosed.emit();
  }
}
