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
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Subscription } from 'rxjs';

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
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // update tooltip translation
    this.updateTooltipTranslation(false);
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

  // language handler
  private languageSubscription: Subscription;

  // timers
  private _focusTimer: number;

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
    this.stopFocusTimer();

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
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
