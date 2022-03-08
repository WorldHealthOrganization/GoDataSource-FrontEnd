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

@Component({
  selector: 'app-form-select-v2',
  templateUrl: './app-form-select-v2.component.html',
  styleUrls: ['./app-form-select-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormSelectV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormSelectV2Component
  extends AppFormBaseV2<string | string[]> implements OnDestroy {

  // multiple ?
  @Input() multiple: boolean = false;

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

  // value as string
  get valueAsString(): string {
    return this.value as string;
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
   * Dropdown opened
   */
  dropdownOpened(): void {
    // retrieve parent element
    let classList: any = document.querySelector('.gd-form-select-v2-panel');
    classList = classList ?
      classList.closest('.cdk-overlay-pane').classList :
      classList;

    // attach custom class
    if (
      classList &&
      !classList.contains('gd-cdk-overlay-pane-dropdown')
    ) {
      classList.add('gd-cdk-overlay-pane-dropdown');
    }

    // vscroll to first selected item
    this.vScrollToFirstSelectedOption();
  }

  /**
   * vScroll to see the first selected item
   */
  private vScrollToFirstSelectedOption(): void {
    // scroll to item ?
    if (
      this.value &&
      this.cdkVirtualScrollViewport
    ) {
      // hack to force re-render, otherwise we see an empty scroll
      if (
        this.value && (
          !this.multiple ||
          this.value.length > 0
        )
      ) {
        // determine value to search
        const valueToSearch: string = this.multiple ?
          this.value[0] :
          (this.value as string);
        const index: number = this.filteredOptions.findIndex((option) => option.value === valueToSearch);
        if (index > -1) {
          this.cdkVirtualScrollViewport.scrollToIndex(index);
        }
      }
    }
  }
}
