import { AbstractControl, ControlContainer, ControlValueAccessor, FormGroup, NgForm, NgModelGroup } from '@angular/forms';
import { noop } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseErrorStateMatcherV2 } from './app-form-base-error-state-matcher-v2';
import { AppFormBaseErrorMsgV2 } from './app-form-base-error-msg-v2';
import { ChangeDetectorRef, Directive, EventEmitter, Input, Output } from '@angular/core';
import { Subscription } from 'rxjs/internal/Subscription';

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

  // status changed subscription
  private statusChangesSubscription: Subscription;

  // form submitted subscription
  private formSubmittedSubscription: Subscription;

  // control
  public get control(): AbstractControl {
    // input has no parent so there is no way to retrieve form control
    if (!this.controlContainer) {
      return undefined;
    }

    // retrieve control
    let control: AbstractControl;
    if (this.controlContainer.control instanceof FormGroup) {
      // FIX for dotted path, since get uses paths, but we don't always want to use paths
      control = this.controlContainer.control.controls[this.controlName];
    } else if (this.controlContainer.control) {
      // default one
      control = this.controlContainer.control.get(this.controlName);
    }

    // found control ?
    if (control) {
      // keep an instance
      (control as any)._gd_component = this;

      // listen for status changes
      if (!this.statusChangesSubscription) {
        this.statusChangesSubscription = control.statusChanges
          .subscribe(() => {
            this.changeDetectorRef.detectChanges();
          });
      }
    }

    // finished
    return control;
  }

  /**
   * Invalid ?
   */
  get invalid(): boolean {
    return !this.control || this.control.invalid;
  }

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
    protected controlContainer: ControlContainer,
    protected translateService: TranslateService,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // on submit - do validation
    let form: NgForm;
    if (controlContainer) {
      // ng model group ?
      if (controlContainer instanceof NgModelGroup) {
        form = controlContainer.formDirective as NgForm;
      } else {
        form = controlContainer as NgForm;
      }
    }

    // listen for form submit
    if (
      form &&
      form.ngSubmit
    ) {
      // listen for submit
      this.formSubmittedSubscription = form.ngSubmit.subscribe(() => {
        // touch on submit
        this.onTouch();

        // validate
        this.control?.updateValueAndValidity();
      });
    }
  }

  /**
   * Release resources
   */
  onDestroy(): void {
    // release status changed subscription
    if (this.statusChangesSubscription) {
      this.statusChangesSubscription.unsubscribe();
      this.statusChangesSubscription = undefined;
    }

    // release form submit listener
    if (this.formSubmittedSubscription) {
      this.formSubmittedSubscription.unsubscribe();
      this.formSubmittedSubscription = undefined;
    }
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
      const props = this.previousErrorsObject ? Object.keys(this.previousErrorsObject) : [];
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
