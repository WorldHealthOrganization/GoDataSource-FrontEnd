import { Directive, forwardRef, Attribute } from '@angular/core';
import { Validator, AbstractControl, NG_VALIDATORS } from '@angular/forms';

import * as _ from 'lodash';

@Directive({
    selector: '[app-file-extension-validator][ngModel]',
    providers: [
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => FileExtensionValidatorDirective),
            multi: true
        }
    ]
})

/**
 * Custom form validation for checking file extensions
 */
export class FileExtensionValidatorDirective implements Validator {
    constructor(
        @Attribute('app-file-extension-validator') public fileExtensions: string
    ) {
    }

    validate(control: AbstractControl): { [key: string]: any } {
        if (!_.isObject(control.value) || _.isEmpty(control.value) || _.isEmpty(this.fileExtensions)) {
            return null;
        }

        let validationResult = true;

        // get valid extensions
        let extensions = this.fileExtensions.split(',');
        extensions = extensions.map(extension => _.trim(extension));

        // check files
        const files = control.value;
        _.forEach(files, file => {
            const result = this.checkExtension(file, extensions);

            // check if the extensions match
            if (!result) {
                validationResult = false;
                return false;
            }
        });

        // check result
        if (!validationResult) {
            return {
                extensionValidator: this.fileExtensions
            };
        }

        return null;
    }

    /**
     * Check if file extension matches any of the given valid extensions
     * @param file
     * @param extensions
     * @return {boolean}
     */
    checkExtension(file, extensions) {
        const fileName = _.get(file, 'name', null);
        if (_.isEmpty(fileName)) {
            return false;
        }

        const parts = file.name.split('.');
        const extension = parts[parts.length - 1];

        // check if the extensions match
        if (extensions.indexOf(extension) === -1) {
            return false;
        }

        return true;
    }
}
