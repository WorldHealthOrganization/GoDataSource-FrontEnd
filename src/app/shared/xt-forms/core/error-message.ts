import { ValidationResult } from './validate';
import { ElementBaseFailure } from './element-base';

export class ErrorMessage {

    constructor(
        private validator: ValidationResult,
        private key: string
    ) {
    }

    /**
     * Get the error message for each validator
     * Support sending data array for translation
     * @returns {ElementBaseFailure}
     */
    getMessage(): ElementBaseFailure {
        switch (this.key) {
            case 'required':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_FIELD_REQUIRED'
                );
            case 'pattern':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_PATTERN'
                );
            case 'minlength':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_MIN_LENGTH',
                    {length: this.validator.minlength['requiredLength']}
                );
            case 'maxlength':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_MAX_LENGTH',
                    {length: this.validator.maxlength['requiredLength']}
                );
            case 'equalValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_EQUAL_PASSWORD_VALUE'
                );
            case 'notEqualValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_NOT_EQUAL_QUESTION_VALUE'
                );
            case 'truthyValidator-terms':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_TERMS_CONDITIONS'
                );
            case 'emailValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_FIELD_EMAIL'
                );
            case 'passwordValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_FIELD_PASSWORD'
                );
            case 'extensionValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_EXTENSION',
                    {extensions: this.validator.extensionValidator['extensions']}
                );
            case 'uniqueEmail':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_EMAIL_UNIQUE'
                );
            case 'uniquePageUrl':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_PAGE_UNIQUE'
                );
            case 'notUniqueValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_DUPLICATE_VALUE'
                );
        }

        // Get default message if no validator matched
        switch (typeof this.validator[this.key]) {
            case 'string':
                return new ElementBaseFailure(
                    <string> this.validator[this.key]
                );
            default:
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_DEFAULT',
                    {validation: this.key}
                );
        }
    }
}
