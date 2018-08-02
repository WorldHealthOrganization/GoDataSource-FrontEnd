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
                return `Must contain a maximum of ${this.validator.maxlength['requiredLength']} characters`;
            case 'equalValidator':
                return 'Value must match password';
            case 'notEqualValidator':
                return 'The questions need to be different';
            case 'truthyValidator-terms':
                return 'Terms and conditions must be accepted';
            case 'emailValidator':
                return 'Invalid email address';
            case 'passwordValidator':
                return 'Password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol';
            case 'extensionValidator':
                return 'Please upload a valid file: ' + this.validator.extensionValidator;
            case 'uniqueEmail':
                return 'E-mail does already exist.';
            case 'uniquePageUrl':
                return 'Page name does already exist';
            case 'notUniqueValidator':
                return 'LNG_FORM_VALIDATION_ERROR_DUPLICATE_VALUE';
        }

        switch (typeof this.validator[this.key]) {
            case 'string':
                return <string> this.validator[this.key];
            default:
                return `Validation failed: ${this.key}`;
        }
    }
}
