import * as Handsontable from 'handsontable';
import { SheetCellValidationType } from './sheet-cell-validation-type';
import * as _ from 'lodash';
import { SheetCellType } from './sheet-cell-type';

export class SheetCellValidator {

    static CELL_VALIDATION_TYPE = {
        [SheetCellType.DATE]: SheetCellValidationType.DATE,
        [SheetCellType.DROPDOWN]: SheetCellValidationType.DROPDOWN,
        [SheetCellType.NUMERIC]: SheetCellValidationType.POSITIVE_INTEGER
    };

    /**
     * Merge more validations into a single function
     * @param validationTypes
     */
    static mergeValidations(validationTypes: SheetCellValidationType[]) {
        return function(value, callback) {
            // do not validate empty rows
            if (value === 'empty-row') {
                // do not validate empty rows
                callback(true);
                return;
            }

            // keep current context (handsontable will call this function with a specific context)
            const context = this;
            // flag to mark if a validation has failed
            let validationPassed = true;

            // get validation functions
            const validationFunctions = _.map(validationTypes, (type) => SheetCellValidator.getValidation(type));
            // run all validations
            let validationsPassed = 0;
            _.each(validationFunctions, (validationFunc) => {
                // call each validation function with the specific context that handsontable expects
                validationFunc.call(context, value, (currentResult) => {
                    if (!currentResult) {
                        // validation failed; propagate the result if it wasn't already done by other validation
                        if (validationPassed) {
                            validationPassed = false;
                            callback(false);
                        }
                    } else {
                        // validation passed;
                        validationsPassed++;
                        // check if all validations were passed
                        if (validationsPassed === validationFunctions.length) {
                            callback(true);
                        }
                    }
                });
            });
        };
    }

    /**
     * Get validation function for a given type
     * @param validationType
     */
    static getValidation(validationType: SheetCellValidationType) {
        switch (validationType) {
            case SheetCellValidationType.DROPDOWN:
                return (Handsontable as any).validators.DropdownValidator;

            case SheetCellValidationType.DATE:
                return (Handsontable as any).validators.DateValidator;

            case SheetCellValidationType.REQUIRED:
                return (value, callback) => {
                    if (value && value.length > 0) {
                        callback(true);
                        return;
                    }

                    callback(false);
                };

            case SheetCellValidationType.POSITIVE_INTEGER:
                return (value, callback) => {
                    callback(/^([1-9]*|null)$/.test(value));
                };
        }

        return null;
    }
}
