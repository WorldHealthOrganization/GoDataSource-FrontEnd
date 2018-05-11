import { ValidationResult } from './validate';

export class ErrorMessage {

    constructor(
        private validator: ValidationResult,
        private key: string
    ) {
    }

    getMessage(): string {
        switch (this.key) {
            case 'required':
                return 'This field is required';
            case 'pattern':
                return 'Value does not match required pattern';
            case 'minlength':
                return 'Value must be N characters';
            case 'maxlength':
                return 'Value must be a maximum of N characters';
            case 'equalValidator':
                return 'Value must match password';
            case 'truthyValidator-terms':
                return 'Terms and conditions must be accepted';
            case 'emailValidator':
                return 'Invalid email address';
            case 'extensionValidator':
                return 'Please upload a valid file: ' + this.validator.extensionValidator;
            case 'uniqueEmail':
                return 'E-mail does already exist.';
            case 'uniquePageUrl':
                return 'Page name does already exist';
        }

        switch (typeof this.validator[this.key]) {
            case 'string':
                return <string> this.validator[this.key];
            default:
                return `Validation failed: ${this.key}`;
        }
    }
}
