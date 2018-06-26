import { ValidationResult } from './validate';

import * as _ from 'lodash';

export class ErrorMessage {

    constructor(
        private validator: ValidationResult,
        private key: string
    ) {
    }

    /**
     * Replace all variables from an error
     * @param {string} errorMessage
     * @returns {string}
     */
    protected replaceVariables(errorMessage: string) {
        // find variables
        const varRegex = /\$\{([a-z0-9_]+)\}/ig;
        const variables = {};
        let vR = null;
        do {
            vR = varRegex.exec(errorMessage);
            if (vR) {
                // ignore duplicates
                variables[vR[1]] = {
                    text: vR[0],
                    expression: vR[1]
                };
            }
        } while (vR);

        // replace variables - right now we don't need expression - just a simple find & replace
        _.forEach(variables, (v) => {
            // determine the replacement value
            // at this point we look in just one place - so there is no need for extra logic
            const replaceValue = _.get(this.validator, this.key + '.' + v.expression);

            // replace all occurrences
            errorMessage = errorMessage.replace(
                new RegExp(v.text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&'), 'g'),
                replaceValue);
        });

        // finished
        return errorMessage;
    }

    getMessage(): string {
        let message: string;
        switch (this.key) {
            case 'required':
                message = 'This field is required';
                break;
            case 'pattern':
                message = 'Value does not match required pattern';
                break;
            case 'minlength':
                message = 'Value must be N characters';
                break;
            case 'maxlength':
                message = 'Must contain a maximum of ${requiredLength} characters';
                break;
            case 'equalValidator':
                message = 'Value must match password';
                break;
            case 'truthyValidator-terms':
                message = 'Terms and conditions must be accepted';
                break;
            case 'emailValidator':
                message = 'Invalid email address';
                break;
            case 'passwordValidator':
                message = 'Password must contain at least 6 characters, 1 lowercase, 1 uppercase, 1 number and 1 symbol';
                break;
            case 'extensionValidator':
                message = 'Please upload a valid file: ' + this.validator.extensionValidator;
                break;
            case 'uniqueEmail':
                message = 'E-mail does already exist.';
                break;
            case 'uniquePageUrl':
                message = 'Page name does already exist';
                break;
        }

        if (!message) {
            switch (typeof this.validator[this.key]) {
                case 'string':
                    message = <string> this.validator[this.key];
                    break;
                default:
                    message = `Validation failed: ${this.key}`;
            }
        }

        return this.replaceVariables(message);
    }
}
