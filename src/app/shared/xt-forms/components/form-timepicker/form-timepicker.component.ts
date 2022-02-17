import {
  Component,
  Input,
  ViewEncapsulation,
  Optional,
  Inject,
  Host,
  SkipSelf,
  HostBinding,
  Output,
  EventEmitter,
  AfterViewInit, OnDestroy
} from '@angular/core';
import { NG_VALUE_ACCESSOR, NG_VALIDATORS, NG_ASYNC_VALIDATORS, ControlContainer } from '@angular/forms';
import { ElementBase } from '../../core/index';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
  selector: 'app-form-timepicker',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './form-timepicker.component.html',
  styleUrls: ['./form-timepicker.component.less'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FormTimepickerComponent,
    multi: true
  }]
})
export class FormTimepickerComponent
  extends ElementBase<string>
  implements AfterViewInit, OnDestroy {
  static identifier: number = 0;

  @HostBinding('class.form-element-host') isFormElement = true;

  @Input() placeholder: string;
  @Input() required: boolean = false;
  @Input() name: string;
  @Input() disabled: boolean = false;

  private _tooltipToken: string;
  private _tooltip: string;
  @Input() set tooltip(tooltip: string) {
    this._tooltipToken = tooltip;
    this._tooltip = this._tooltipToken ? this.i18nService.instant(this._tooltipToken, this.tooltipTranslateData) : this._tooltipToken;
  }
  get tooltip(): string {
    return this._tooltip;
  }

  private _tooltipTranslateData: any;
  @Input() set tooltipTranslateData(tooltipTranslateData: any) {
    this._tooltipTranslateData = tooltipTranslateData;
    this.tooltip = this._tooltipToken;
  }
  get tooltipTranslateData(): any {
    return this._tooltipTranslateData;
  }

  @Output() optionChanged = new EventEmitter<any>();
  @Output() blur = new EventEmitter<any>();

  public identifier = `form-timepicker-${FormTimepickerComponent.identifier++}`;

  // language subscription
  private languageSubscription: Subscription;

  /**
     * Constructor
     */
  constructor(
  @Optional() @Host() @SkipSelf() controlContainer: ControlContainer,
    @Optional() @Inject(NG_VALIDATORS) validators: Array<any>,
    @Optional() @Inject(NG_ASYNC_VALIDATORS) asyncValidators: Array<any>,
    private i18nService: I18nService
  ) {
    super(controlContainer, validators, asyncValidators);

    // on language change..we need to translate again the token
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        this.tooltip = this._tooltipToken;
      });
  }

  /**
     * Component destroyed
     */
  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
    }
  }

  /**
     * Trigger the 'touch' action on the custom form control
     */
  onBlur() {
    this.touch();
    this.blur.emit(this.value);
  }

  /**
     * Function triggered when the input value is changed
     */
  onChange() {
    // emit the current value
    return this.optionChanged.emit(this.value);
  }
}
