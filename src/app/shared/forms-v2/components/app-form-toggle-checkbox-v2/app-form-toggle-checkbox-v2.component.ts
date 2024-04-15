import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component,
  forwardRef,
  Host, Input,
  OnDestroy,
  Optional,
  SkipSelf, ViewEncapsulation
} from '@angular/core';
import { ControlContainer, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-form-toggle-checkbox-v2',
  templateUrl: './app-form-toggle-checkbox-v2.component.html',
  styleUrls: ['./app-form-toggle-checkbox-v2.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppFormToggleCheckboxV2Component),
      multi: true
    }
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormToggleCheckboxV2Component
  extends AppFormBaseV2<boolean> implements OnDestroy {

  // right - icon buttons
  @Input() suffixIconButtons: IAppFormIconButtonV2[];

  // view only
  @Input() viewOnly: boolean;

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
