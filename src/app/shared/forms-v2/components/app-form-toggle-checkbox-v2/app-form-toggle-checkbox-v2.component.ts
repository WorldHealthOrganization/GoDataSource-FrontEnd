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
  tooltipTranslated: string;
  @Input() set tooltip(tooltip: string) {
    // set data
    this._tooltip = tooltip;

    // translate tooltip
    this.tooltipTranslated = this._tooltip ?
      this.i18nService.instant(this._tooltip) :
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
    protected i18nService: I18nService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    super(
      controlContainer,
      i18nService,
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
   * Click button
   */
  iconButtonClick(
    event,
    iconB: IAppFormIconButtonV2
  ): void {
    // prevent propagation
    event.stopPropagation();

    // execute click action
    if (iconB.clickAction) {
      iconB.clickAction(this);
    }
  }
}
