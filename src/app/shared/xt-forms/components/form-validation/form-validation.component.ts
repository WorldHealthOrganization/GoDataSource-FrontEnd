import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ControlContainer } from '@angular/forms';
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
        if (
            this.controlContainer &&
            this.controlContainer.formDirective &&
            (this.controlContainer.formDirective as any).submitted
        ) {
            return true;
        }

        // retrieve form controls
        const formControls = this.controlContainer && this.controlContainer.control && (this.controlContainer.control as any).controls ?
            (this.controlContainer.control as any).controls :
            false;

        // form control touched?
        return formControls &&
            formControls[this.controlName] &&
            formControls[this.controlName].touched;
    }
}
