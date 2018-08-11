import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ControlContainer } from '@angular/forms';
import * as _ from 'lodash';
import { ElementBaseFailure } from '../../core';

@Component({
    selector: 'app-form-validation',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './form-validation.component.html',
    styleUrls: ['./form-validation.component.less']
})
export class FormValidationComponent {
    @Input() messages: Array<ElementBaseFailure>;
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
        const formControls = _.get(this.controlContainer, 'control.controls', false);
        const controlTouched = formControls &&
            formControls[this.controlName] &&
            formControls[this.controlName].touched;

        return formSubmitted || controlTouched;
    }
}
