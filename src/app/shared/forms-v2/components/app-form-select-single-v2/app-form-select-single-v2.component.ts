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
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

@Component({
  selector: 'app-form-select-single-v2',
  templateUrl: './app-form-select-single-v2.component.html',
  styleUrls: ['./app-form-select-single-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectSingleV2Component),
    multi: true
  }, {
    provide: MAT_SELECT_CONFIG,
    useValue: {
      overlayPanelClass: 'gd-cdk-overlay-pane-dropdown'
    }
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectSingleV2Component
  extends AppFormBaseV2<string> implements OnDestroy {

  // float label
  @Input() neverFloatLabel: boolean = false;

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // clearable ?
  @Input() clearable: boolean = false;

  // tooltip
  @Input() optionTooltipKey: string;

  // sort disabled
  @Input() sortDisabled: boolean;

  // scroll to top when showing options popup ?
  @Input() optionsPopupScrollToTop: boolean;

  // loading
  @Input() loading: boolean;

  // tooltip
  tooltipButton: IAppFormIconButtonV2;
  private _tooltip: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // translate tooltip
    const tooltipTranslated = this._tooltip ?
      this.translateService.instant(this._tooltip) :
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
      this.allOptions
        .forEach((item) => {
          item.label = item.label ?
            this.translateService.instant(item.label) :
            item.label;
        });

      // sort
      if (!this.sortDisabled) {
        this.allOptions
          .sort((item1, item2) => {
            // compare
            if (
              typeof item1.order === 'number' &&
              typeof item2.order === 'number'
            ) {
              // equal ?
              if (item1.order === item2.order) {
                return (item1.label ? this.translateService.instant(item1.label) : '')
                  .localeCompare((item2.label ? this.translateService.instant(item2.label) : ''));
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
            return (item1.label ? this.translateService.instant(item1.label) : '')
              .localeCompare((item2.label ? this.translateService.instant(item2.label) : ''));
          });
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

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport') cdkVirtualScrollViewport: CdkVirtualScrollViewport;

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
    // nothing to do ?
    if (!this.cdkVirtualScrollViewport) {
      return;
    }

    // scroll to top ?
    if (this.optionsPopupScrollToTop) {
      // scroll
      this.cdkVirtualScrollViewport.scrollToOffset(0);
      this.changeDetectorRef.detectChanges();

      // finished
      return;
    }

    // scroll to item ?
    if (this.value) {
      // determine value to search
      const index: number = this.filteredOptions.findIndex((option) => option.value === this.value);
      if (index > -1) {
        this.cdkVirtualScrollViewport.scrollToIndex(index);
        this.changeDetectorRef.detectChanges();
      }
    }
  }
}
