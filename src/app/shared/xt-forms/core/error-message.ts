import { ValidationResult } from './validate';
import { ElementBaseFailure } from './element-base-failure';

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
            case 'minNumberValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_MIN_NUMBER',
                    {min: this.validator.minNumberValidator['min']}
                );
            case 'maxNumberValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_MAX_NUMBER',
                    {max: this.validator.maxNumberValidator['max']}
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
            case 'invalidDateValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_INVALID_DATE'
                );
            case 'dateValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_DATE_COMPARE',
                    this.validator[this.key] as {}
                );
            case 'allOrNoneRequiredValidator':
                return new ElementBaseFailure(
                    (this.validator[this.key] as any).err,
                    this.validator[this.key] as {}
                );
            case 'requiredOtherField':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_AT_LEAST_ONE_REQUIRED'
                );
            case 'generalAsyncValidatorDirective':
                return new ElementBaseFailure(
                    (this.validator[this.key] as any).err,
                    (this.validator[this.key] as any).details
                );
            case 'hasPropertyValidator':
                return new ElementBaseFailure(
                    (this.validator[this.key] as any).err,
                    (this.validator[this.key] as any).details
                );
            case 'urlValidator':
                return new ElementBaseFailure(
                    'LNG_FORM_VALIDATION_ERROR_FIELD_URL'
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
