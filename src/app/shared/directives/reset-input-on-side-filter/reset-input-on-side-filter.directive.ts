import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';
import { FormLocationDropdownComponent } from '../../components/form-location-dropdown/form-location-dropdown.component';
import { ValueAccessorBase } from '../../xt-forms/core';

@Directive({
  selector: '[app-reset-input-on-side-filter]'
})
export class ResetInputOnSideFilterDirective {
  // pristine value
  private _pristineValueHasBeenSet: boolean = false;
  private pristineValue: any = undefined;

  // reset to pristine value
  @Input() resetToPristineValue: boolean = true;
  @Input() disableCachedFilterOverwrite: boolean = false;

  // update value to what is set after pristine value is taken
  private _mustUpdateAfterPristine: boolean = false;
  private _valueAfterPristine: any;

  /**
     * Constructor
     */
  constructor(
    public control: NgControl
  ) {
    setTimeout(() => {
      // set pristine value
      this.pristineValue = control.value;
      this._pristineValueHasBeenSet = true;

      // update control value
      if (
        !this.disableCachedFilterOverwrite &&
                this._mustUpdateAfterPristine
      ) {
        (control.valueAccessor as ValueAccessorBase<any>).writeValue(this._valueAfterPristine);
      }
    });
  }

  /**
     * Reset
     */
  public reset() {
    this.control.reset(this.resetToPristineValue ? this.pristineValue : undefined);
  }

  /**
     * Update input value after pristine value is taken
     */
  public updateToAfterPristineValueIsTaken(value: any): void {
    if (this._pristineValueHasBeenSet) {
      if (!this.disableCachedFilterOverwrite) {
        (this.control.valueAccessor as ValueAccessorBase<any>).writeValue(value);
      }
    } else {
      this._mustUpdateAfterPristine = true;
      this._valueAfterPristine = value;
    }
  }
}

@Directive({
  selector: '[app-reset-location-on-side-filter]'
})
export class ResetLocationOnSideFilterDirective {
  // pristine value
  private _pristineValueHasBeenSet: boolean = false;
  private pristineValue: any = undefined;

  // reset to pristine value
  @Input() resetToPristineValue: boolean = true;
  @Input() disableCachedFilterOverwrite: boolean = false;

  // update value to what is set after pristine value is taken
  private _mustUpdateAfterPristine: boolean = false;
  private _valueAfterPristine: any;

  /**
     * Constructor
     */
  constructor(
    public component: FormLocationDropdownComponent
  ) {
    setTimeout(() => {
      // set pristine value
      this.pristineValue = component.value;
      this._pristineValueHasBeenSet = true;

      // update control value
      if (
        !this.disableCachedFilterOverwrite &&
                this._mustUpdateAfterPristine
      ) {
        component.writeValue(this._valueAfterPristine);
      }
    });
  }

  /**
     * Reset
     */
  public reset() {
    this.component.value = this.resetToPristineValue ? this.pristineValue : undefined;
    if (!this.component.value) {
      this.component.addLocationConditionAndRefresh();
    }
  }

  /**
     * Update input value after pristine value is taken
     */
  public updateToAfterPristineValueIsTaken(value: any): void {
    if (this._pristineValueHasBeenSet) {
      if (!this.disableCachedFilterOverwrite) {
        this.component.writeValue(value);
      }
    } else {
      this._mustUpdateAfterPristine = true;
      this._valueAfterPristine = value;
    }
  }
}
