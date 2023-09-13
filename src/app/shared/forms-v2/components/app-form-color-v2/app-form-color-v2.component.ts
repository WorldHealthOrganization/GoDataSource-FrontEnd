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
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ColorPickerDirective } from 'ngx-color-picker';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-color-v2',
  templateUrl: './app-form-color-v2.component.html',
  styleUrls: ['./app-form-color-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormColorV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormColorV2Component
  extends AppFormBaseV2<string> implements OnDestroy {

  // color picker directive used to fix jumping dialog effect
  // - IMPORTANT: don't set static to true
  private _ngxColorPicker: ColorPickerDirective;
  @ViewChild('ngxColorPicker') set ngxColorPicker(ngxColorPicker: ColorPickerDirective) {
    // same ?
    if (this.ngxColorPicker === ngxColorPicker) {
      return;
    }

    // set data
    this._ngxColorPicker = ngxColorPicker;

    // nothing to do ?
    if (!this.ngxColorPicker) {
      return;
    }

    // fix
    this.ngxColorPicker.openDialog();
    this.ngxColorPicker.closeDialog();
  }
  get ngxColorPicker(): ColorPickerDirective {
    return this._ngxColorPicker;
  }

  // view only
  @Input() viewOnly: boolean;

  // no value string
  @Input() noValueLabel: string = '—';

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

  // language handler
  private languageSubscription: Subscription;

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

    // stop refresh language tokens
    this.releaseLanguageChangeListener();
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
}
