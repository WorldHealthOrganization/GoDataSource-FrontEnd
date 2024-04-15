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
  selector: 'app-form-timepicker-v2',
  templateUrl: './app-form-timepicker-v2.component.html',
  styleUrls: ['./app-form-timepicker-v2.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => AppFormTimepickerV2Component),
    multi: true
  }],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppFormTimepickerV2Component
  extends AppFormBaseV2<string> implements OnDestroy {

  // timers
  private _attachClassTimer: number;

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

    // stop attach class timer
    this.stopAttachTimer();

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

  /**
   * Stop attach timer
   */
  private stopAttachTimer(): void {
    if (this._attachClassTimer) {
      clearTimeout(this._attachClassTimer);
      this._attachClassTimer = undefined;
    }
  }

  /**
   * Calendar opened
   */
  opened(): void {
    // clear previous
    this.stopAttachTimer();

    // hack since we can't provide / inject config for overlay wrapper css class....with current version (14.0.8)
    // #TODO - once we update to a newer version that allows us to specify backdrop class we need to refactor this logic
    this._attachClassTimer = setTimeout(() => {
      // finished
      this._attachClassTimer = undefined;

      // find panel parent and attach class
      const timerPanels = document.getElementsByClassName('gd-form-timepicker-v2-panel');
      for (let elementIndex = 0; elementIndex < timerPanels.length; elementIndex++) {
        const container = timerPanels.item(elementIndex).closest('.cdk-overlay-container');
        if (container) {
          const backdrop = container.querySelector('.cdk-overlay-backdrop');
          if (
            backdrop &&
            !backdrop.classList.contains('gd-form-timepicker-v2-backdrop')
          ) {
            backdrop.classList.add('gd-form-timepicker-v2-backdrop');
          }
        }
      }
    });
  }
}
