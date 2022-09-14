import { ErrorStateMatcher } from '@angular/material/core';
import { AbstractControl } from '@angular/forms';

export class AppFormBaseErrorStateMatcherV2 implements ErrorStateMatcher {
  /**
   * Control container
   */
  constructor(
    private component: {
      control: AbstractControl
    }
  ) {}

  /**
   * Check if input can display error
   */
  isErrorState(): boolean {
    // invalid ?
    return this.component.control ?
      this.component.control.touched && this.component.control.invalid :
      false;
  }
}
