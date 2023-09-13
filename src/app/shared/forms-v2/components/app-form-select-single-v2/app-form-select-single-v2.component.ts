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
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { ILabelValuePairModel } from '../../core/label-value-pair.model';
import { MAT_SELECT_CONFIG, MatSelect } from '@angular/material/select';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Subscription } from 'rxjs';

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

  // right - icon buttons
  @Input() suffixIconButtons: IAppFormIconButtonV2[];

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

    // update tooltip translation
    this.updateTooltipTranslation(false);
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
            this.i18nService.instant(item.label) :
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

  // search value
  startSearch: string;
  searchValue: string;

  // allow disabled options to be selected ?
  @Input() allowDisabledToBeSelected: boolean = false;

  // vscroll handler
  @ViewChild('cdkVirtualScrollViewport') cdkVirtualScrollViewport: CdkVirtualScrollViewport;

  // input
  private _input: MatSelect;
  private _openAfterInit: boolean = false;
  @ViewChild(MatSelect) set input(input: MatSelect) {
    // set
    this._input = input;

    // do we need to open after init ?
    if (this._openAfterInit) {
      this.open();
    }
  }
  get input(): MatSelect {
    return this._input;
  }

  // language handler
  private languageSubscription: Subscription;

  // timers
  private _openTimer: number;
  private _firstOptionTimer: number;

  /**
   * Constructor
   */
  constructor(
    @Optional() @Host() @SkipSelf() protected controlContainer: ControlContainer,
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // parent
    super(
      controlContainer,
      i18nService,
      changeDetectorRef
    );

    // language change
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // update tooltip translation
        this.updateTooltipTranslation(true);
      });
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // parent
    super.onDestroy();

    // timers
    this.stopOpenTimer();
    this.stopFirstOptionTimer();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
  }

  /**
   * Update visible options depending on if they were disabled or not
   */
  writeValue(value: string) {
    // parent
    super.writeValue(value);

    // do we need to update options ?
    if (
      !this.allowDisabledToBeSelected &&
      this.value
    ) {
      this.filterOptions();
    }
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = undefined;
    }
  }

  /**
   * Update tooltip translation
   */
  private updateTooltipTranslation(detectChanges: boolean): void {
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

    // update
    if (detectChanges) {
      this.changeDetectorRef.detectChanges();
    }
  }

  /**
   * Filter options
   */
  filterOptions(searchValue?: string): void {
    // update search value
    if (searchValue !== undefined) {
      this.searchValue = searchValue;
    }

    // nothing to filter ?
    if (!this.options?.length) {
      this.filteredOptions = [];
      return;
    }

    // filter options
    if (!this.searchValue) {
      // all visible options
      this.filteredOptions = this.allowDisabledToBeSelected ?
        this.options :
        this.options.filter((item: ILabelValuePairModel): boolean => {
          return !item.disabled || (
            this.value &&
            item.value === this.value
          );
        });

      // finished
      return;
    }

    // case insensitive
    const byValue: string = this.searchValue.toLowerCase();

    // filter
    this.filteredOptions = this.options.filter((item: ILabelValuePairModel): boolean => {
      return (
        this.allowDisabledToBeSelected ||
        !item.disabled || (
          this.value &&
          item.value === this.value
        )
      ) && item.label.toLowerCase().indexOf(byValue) > -1;
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

  /**
   * Timer - open
   */
  private stopOpenTimer(): void {
    if (this._openTimer) {
      clearTimeout(this._openTimer);
      this._openTimer = undefined;
    }
  }

  /**
   * Stop timer
   */
  private stopFirstOptionTimer(): void {
    if (this._firstOptionTimer) {
      clearTimeout(this._firstOptionTimer);
      this._firstOptionTimer = undefined;
    }
  }

  /**
   * Open select
   */
  open(startSearch?: string): void {
    // timer - open
    this.stopOpenTimer();

    // wait for binds to take effect
    this._openTimer = setTimeout(() => {
      // reset
      this._openTimer = undefined;

      // open
      if (this.input) {
        // init
        this._openAfterInit = false;
        this.startSearch = startSearch;
        this.input.open();

        // filter ?
        if (this.startSearch) {
          // filter
          this.filterOptions(this.startSearch);

          // make active first one
          if (this.filteredOptions.length) {
            // stop previous
            this.stopFirstOptionTimer();

            // trigger
            this._firstOptionTimer = setTimeout(() => {
              // reset
              this._firstOptionTimer = undefined;

              // update
              this.input._keyManager.setFirstItemActive();
            });
          }
        }
      } else {
        this._openAfterInit = true;
      }
    });
  }
}
