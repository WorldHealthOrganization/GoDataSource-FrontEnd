import { AbstractControl, ControlContainer, ControlValueAccessor } from '@angular/forms';
import { noop } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseErrorStateMatcherV2 } from './app-form-base-error-state-matcher-v2';
import { AppFormBaseErrorMsgV2 } from './app-form-base-error-msg-v2';
import { Directive, EventEmitter, Input, Output } from '@angular/core';

/**
 * Input handler
 */
@Directive()
export abstract class AppFormBaseV2<T> implements ControlValueAccessor {
  // value
  inputValue: T;

  // handle value changes
  onChange: (value: T) => void = noop;

  // handle value changes
  onTouch: (value?: T) => void = noop;

  // control name - required - must be unique in the same control container
  protected controlName: string;

  // control
  public control: AbstractControl;

  // display error message?
  errMatcher = new AppFormBaseErrorStateMatcherV2(this);

  // used to determine if validation errors changed
  private previousErrorsObject;
  private errorsString;

  /**
   * Retrieve value
   */
  get value(): T {
    return this.inputValue;
  }

  /**
   * Set value
   */
  set value(value: T) {
    if (value !== this.inputValue) {
      this.inputValue = value;
      this.onChange(this.inputValue);
    }
  }

  // control name - required - must be unique in the same control container
  @Input() set name(name: string) {
    this.controlName = name;
  }
  get name(): string {
    return this.controlName;
  }

  // required ?
  @Input() required: boolean = false;

  // disabled
  @Input() disabled: boolean = false;

  // placeholder
  @Input() placeholder: string;

  // blur
  @Output() blurEvent = new EventEmitter<void>();

  /**
   * Constructor
   */
  constructor(
    public controlContainer: ControlContainer,
    protected translateService: TranslateService
  ) {
    // retrieve control
    // console.log(this.controlContainer);
    // if (this.controlContainer.control instanceof FormGroup) {
    //   // FIX for dotted path, since get uses paths but we don't always want to use paths
    //   this.control = this.controlContainer.control.controls[this.controlName];
    // } else {
    //   this.control = this.controlContainer.control.get(this.controlName);
    // }
  }

  /**
   * Retrieve error messages
   */
  getErrorMessages(): string {
    // as an optimization we check for error only if error object changed
    // it seems angular generates a different object when validation errors change
    if (
      this.control &&
      this.control.errors !== this.previousErrorsObject
    ) {
      // use the new one
      this.previousErrorsObject = this.control.errors;

      // construct error string
      this.errorsString = '';
      const props = Object.keys(this.previousErrorsObject);
      for (const prop of props) {
        this.errorsString =
          (this.errorsString ? this.errorsString + AppFormBaseErrorMsgV2.SEPARATOR : '') +
          AppFormBaseErrorMsgV2.msg(
            this.translateService,
            prop,
            this.previousErrorsObject[prop]
          );
      }
    }

    // finished
    return this.errorsString;
  }

  /**
   * Write value
   */
  writeValue(value: T): void {
    // set value
    this.inputValue = value;
  }

  /**
   * On change handler
   */
  registerOnChange(fn: (value: T) => void): void {
    this.onChange = (value: T) => {
      // change value
      this.inputValue = value;

      // call main item
      fn(value);
    };
  }

  /**
   * On touch handler
   */
  registerOnTouched(fn: (value: T) => void): void {
    this.onTouch = fn;
  }

  /**
   * On touch
   */
  onTouchItem(): void {
    // touch
    this.onTouch();

    // blur event
    this.blurEvent.emit();
  }
}
