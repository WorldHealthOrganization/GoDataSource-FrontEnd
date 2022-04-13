import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';
import { MAT_SELECT_CONFIG } from '@angular/material/select';

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

  // tooltip
  @Input() optionTooltipKey: string;

  // include no value ?
  private _includeNoValue: boolean;
  @Input() set includeNoValue(includeNoValue: boolean) {
    // set data
    this._includeNoValue = includeNoValue;

    // has options ?
    if (
      this.allOptions &&
      this._includeNoValue
    ) {
      // determine if we need to add has no value
      let hasNoValue: boolean = false;
      this.allOptions.forEach((item) => {
        // already included no value ?
        if (item.value === null) {
          hasNoValue = true;
        }
      });

      // add no value if missing
      if (!hasNoValue) {
        // add to all options
        const item = {
          label: this.translateService.instant('LNG_COMMON_LABEL_NONE'),
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
    this.allOptions = options;

    // translate options and sort
    if (this.allOptions) {
      // translate
      let hasNoValue: boolean = false;
      this.allOptions
        .forEach((item) => {
          // translate
          item.label = item.label ?
            this.translateService.instant(item.label) :
            item.label;

          // already included no value ?
          if (item.value === null) {
            hasNoValue = true;
          }
        });

      // sort
      this.allOptions
        .sort((item1, item2) => {
          return item1.label.toLowerCase().localeCompare(item2.label.toLowerCase());
        });

      // add no value if missing
      if (
        this.includeNoValue &&
        !hasNoValue
      ) {
        this.allOptions.splice(
          0,
          0,
          {
            label: this.translateService.instant('LNG_COMMON_LABEL_NONE'),
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

  // toggle all
  toggleAllCheckboxChecked: boolean = false;

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport', { static: true }) cdkVirtualScrollViewport: CdkVirtualScrollViewport;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
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
   * Filter options
   */
  filterOptions(byValue?: string): void {
    // nothing to filter ?
    if (!this.options) {
      this.filteredOptions = [];
      return;
    }

    // filter options
    if (!byValue) {
      // all visible options
      this.filteredOptions = this.options;

      // finished
      return;
    }

    // case insensitive
    byValue = byValue.toLowerCase();

    // filter
    this.filteredOptions = this.options.filter((item: ILabelValuePairModel): boolean => {
      return item.label.toLowerCase().indexOf(byValue) > -1;
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
}
