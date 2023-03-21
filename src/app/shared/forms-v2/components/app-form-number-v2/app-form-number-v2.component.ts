import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional,
  SkipSelf, ViewChild, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-form-number-v2',
  templateUrl: './app-form-number-v2.component.html',
  styleUrls: ['./app-form-number-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormNumberV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormNumberV2Component
  extends AppFormBaseV2<number> implements OnDestroy {

  // float label
  @Input() neverFloatLabel: boolean = false;

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

  // autocomplete
  @Input() autocomplete: string;

  // min / max
  @Input() min: number;
  @Input() max: number;

  // tooltip
  tooltipButton: IAppFormIconButtonV2;
  private _tooltip: string;
  tooltipTranslated: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // translate tooltip
    this.tooltipTranslated = this._tooltip ?
      this.translateService.instant(this._tooltip) :
      this._tooltip;

    // add / remove tooltip icon
    this.tooltipButton = !this.tooltipTranslated ?
      undefined : {
        icon: 'help',
        tooltip: this.tooltipTranslated
      };
  }
  get tooltip(): string {
    return this._tooltip;
  }

  // input
  private _input: MatInput;
  private _focusAfterInit: boolean = false;
  @ViewChild(MatInput) set input(input: MatInput) {
    // set
    this._input = input;

    // do we need to focus after init ?
    if (this._focusAfterInit) {
      this.focus();
    }
  }
  get input(): MatInput {
    return this._input;
  }

  // timers
  private _focusTimer: any;

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
    // parent
    super.onDestroy();

    // timers
    this.stopFocusTimer();
  }

  /**
   * Set value
   * @param value
   */
  writeValue(value: number): void {
    // make sure precision is max 6 digits
    if (value) {
      // count number of decimals
      const stringValue: string = value.toString();
      const decimalIndex: number = stringValue.indexOf('.');
      if (
        decimalIndex > -1 &&
        stringValue.length - 1 > decimalIndex
      ) {
        const decimals: string = stringValue.substring(decimalIndex + 1);
        if (decimals.length > 5) {
          value = Math.round(value * 1000000) / 1000000;
        }
      }

      // convert to number
      if (typeof value === 'string') {
        try {
          // trigger change
          this.value = parseFloat(value);
          return;
        } catch (e) {}
      }
    }

    // write value
    super.writeValue(value);
  }

  /**
   * Timer - focus
   */
  private stopFocusTimer(): void {
    if (this._focusTimer) {
      clearTimeout(this._focusTimer);
      this._focusTimer = undefined;
    }
  }

  /**
   * Focus
   */
  focus(): void {
    // timer - focus
    this.stopFocusTimer();

    // wait for binds to take effect
    this._focusTimer = setTimeout(() => {
      // reset
      this._focusTimer = undefined;

      // focus
      if (this.input) {
        this._focusAfterInit = false;
        this.input.focus();
      } else {
        this._focusAfterInit = true;
      }
    });
  }
}
