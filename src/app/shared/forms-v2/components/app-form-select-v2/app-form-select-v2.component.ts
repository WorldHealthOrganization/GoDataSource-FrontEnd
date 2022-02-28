import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host,
  Input, OnDestroy,
  Optional,
  SkipSelf, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { LabelValuePairModel } from '../../core/label-value-pair.model';

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
  filteredOptions: LabelValuePairModel[];
  allOptionsMap: {
    [value: string]: LabelValuePairModel
  } = {};
  private allOptions: LabelValuePairModel[];
  @Input() set options(options: LabelValuePairModel[]) {
    // set all options
    this.allOptions = options;

    // map for easy access
    this.allOptionsMap = {};
    (this.allOptions || []).forEach((item) => {
      this.allOptionsMap[item.value] = item;
    });

    // filter options
    this.filterOptions();
  }
  get options(): LabelValuePairModel[] {
    return this.allOptions;
  }

  // value as string
  get valueAsString(): string {
    return this.value as string;
  }

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
    this.filteredOptions = this.options.filter((item: LabelValuePairModel): boolean => {
      return item.label.toLowerCase().indexOf(byValue) > -1;
    });
  }

  /**
   * Dropdown opened
   */
  dropdownOpened(): void {
    const classList = document.querySelector('.gd-form-select-v2-panel').closest('.cdk-overlay-pane').classList;
    if (!classList.contains('cgd-cdk-overlay-pane-dropdown')) {
      classList.add('gd-cdk-overlay-pane-dropdown');
    }
  }
}
