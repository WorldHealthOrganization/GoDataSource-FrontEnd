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
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseV2 } from '../../core/app-form-base-v2';
import { IAppFormIconButtonV2 } from '../../core/app-form-icon-button-v2';

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
  private _attachClassTimer: any = null;

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

    // stop attach class timer
    this.stopAttachTimer();
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
