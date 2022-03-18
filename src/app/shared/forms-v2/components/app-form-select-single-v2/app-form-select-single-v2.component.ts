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

  // clearable ?
  @Input() clearable: boolean = false;

  // tooltip
  @Input() optionTooltipKey: string;

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
      this.allOptions
        .sort((item1, item2) => {
          return item1.label.toLowerCase().localeCompare(item2.label.toLowerCase());
        });
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

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport', {static: true}) cdkVirtualScrollViewport: CdkVirtualScrollViewport;

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
      if (this.value) {
        // determine value to search
        const index: number = this.filteredOptions.findIndex((option) => option.value === this.value);
        if (index > -1) {
          this.cdkVirtualScrollViewport.scrollToIndex(index);
        }
      }
    }
  }
}
