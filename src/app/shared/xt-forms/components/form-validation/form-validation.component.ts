import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import * as _ from 'lodash';

@Component({
    selector: 'app-form-validation',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-validation.component.html',
    styleUrls: ['./form-validation.component.less']
})
export class FormValidationComponent {
    @Input() messages: Array<string>;
    @Input() controlContainer: ControlContainer;
    @Input() controlName: string;

    /**
     * Condition for displaying a custom form control's validation errors
     * @returns {boolean}
     */
    displayErrors() {
        // form submitted?
        const formSubmitted = _.get(this.controlContainer, 'formDirective.submitted', false);
        // form control touched?
        const controlTouched = _.get(this.controlContainer, 'control.controls.' + this.controlName + '.touched', false);

        return formSubmitted || controlTouched;
    }
}
