import * as Handsontable from 'handsontable';
import { SheetCellValidationType } from './sheet-cell-validation-type';
import * as _ from 'lodash';
import { SheetCellType } from './sheet-cell-type';
import { Constants } from '../constants';
import { moment } from '../../helperClasses/x-moment';

export class SheetCellValidator {
    // cells being part of empty rows will get this value at validation time, so we know to skip validation for them (e.g. skip Required validation)
    static EMPTY_ROW_CELL_VALUE = 'empty-row';

    // available validation types for Sheet cells
    static CELL_VALIDATION_TYPE = {
        [SheetCellType.DATE]: SheetCellValidationType.DATE,
        [SheetCellType.DROPDOWN]: SheetCellValidationType.DROPDOWN,
        [SheetCellType.NUMERIC]: SheetCellValidationType.NUMERIC
    };

    /**
     * Merge multiple validations into a single function respecting the format that 'handsontable' expects
     * @param validationTypes
     */
    static mergeValidations(
        validationTypes: SheetCellValidationType[],
        sheetColumn: any
    ) {
        return function(value, callback) {
            // do not validate empty rows
            if (value === SheetCellValidator.EMPTY_ROW_CELL_VALUE) {
                // do not validate empty rows
                callback(true);
                return;
            }

            // keep current context ('handsontable' will call this function with a specific context that we need to provide to each individual validation function)
            const context = this;
            // flag to mark if a validation has failed
            let validationPassed = true;

            // get individual validation functions
            const validationFunctions = _.map(validationTypes, (type) => SheetCellValidator.getValidation(type));
            // keep the number of validations that passed, so we know when the whole validation process is done
            let validationsPassed = 0;

            // run each validation individually
            _.each(validationFunctions, (validationFunc) => {
                // call each validation function with the specific context that 'handsontable' expects
                validationFunc.call(context, value, (individualResult) => {
                    if (!individualResult) {
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
                }, sheetColumn);
            });
        };
    }

    /**
     * Get the validation function for a given type
     * Note: Each function must respect the format expected by 'handsontable'
     * @param validationType
     */
    static getValidation(
        validationType: SheetCellValidationType
    ): (value: any, callback: (boolean) => void, sheetColumn: any) => void {
        switch (validationType) {
            case SheetCellValidationType.DROPDOWN:
                // 'handsontable' built-in validator for Dropdowns
                return Handsontable.default.validators.DropdownValidator;

            case SheetCellValidationType.DATE:
                // custom validator for dates
                // we don't use "return (Handsontable as any).validators.DateValidator;" since we need min & max date validation which this validator version doesn't support
                return (value, callback, sheetColumn) => {
                    callback(
                        _.isEmpty(value) || (
                            moment(value, Constants.DEFAULT_DATE_DISPLAY_FORMAT).isValid() &&
                            (sheetColumn.min ? sheetColumn.min.isSameOrBefore(moment(value, Constants.DEFAULT_DATE_DISPLAY_FORMAT)) : true) &&
                            (sheetColumn.max ? sheetColumn.max.isSameOrAfter(moment(value, Constants.DEFAULT_DATE_DISPLAY_FORMAT)) : true)
                        )
                    );
                };

            case SheetCellValidationType.REQUIRED:
                // custom validator for Required cells
                return (value, callback) => {
                    if (
                        value &&
                        value.length > 0
                    ) {
                        callback(true);
                        return;
                    }

                    callback(false);
                };

            case SheetCellValidationType.ASYNC_VALIDATION:
                // custom validator for contact visual id
                return (value, callback, sheetColumn) => {
                    // execute async validators in series
                    let index: number = 0;
                    const next = (isValid: boolean) => {
                        if (
                            !isValid ||
                            index >= sheetColumn.asyncValidators.length
                        ) {
                            return callback(isValid);
                        }

                        // call next validator
                        sheetColumn.asyncValidators[index++](
                            value,
                            next
                        );
                    };

                    // call next validator
                    next(true);
                };

            case SheetCellValidationType.NUMERIC:
                // custom validator for Positive Integer cells
                return (value, callback, sheetColumn) => {
                    // empty string is handled by required validator
                    if (
                        _.isEmpty(value) &&
                        !_.isNumber(value)
                    ) {
                        callback(true);
                    } else {
                        callback((
                                sheetColumn.isInteger ?
                                    _.isInteger(value) :
                                    _.isNumber(value)
                            ) && (
                                sheetColumn.min === undefined ||
                                value >= sheetColumn.min
                            ) && (
                                sheetColumn.max === undefined ||
                                value <= sheetColumn.max
                            )
                        );
                    }
                };
        }

        return null;
    }
}
