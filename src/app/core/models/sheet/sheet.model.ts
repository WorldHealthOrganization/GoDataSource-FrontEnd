import { Observable } from 'rxjs/Observable';
import * as Handsontable from 'handsontable';
import * as _ from 'lodash';

export enum SheetColumnType {
    TEXT = 'text',
    NUMERIC = 'numeric',
    DROPDOWN = 'dropdown',
    DATE = 'date'
}

export enum SheetColumnValidationType {
    DROPDOWN = 'dropdown',
    DATE = 'date',
    POSITIVE_INTEGER = 'positive-integer',
    REQUIRED = 'required'
}

class SheetColumnValidator {
    // type of cell
    private columnType: SheetColumnType;
    // set of validations to be applied on a cell
    private validations: SheetColumnValidationType[] = [];

    constructor(columnType: SheetColumnType) {
        this.columnType = columnType;

        this.setDefaultValidations();
    }

    /**
     * Build validator based on the column type and applied validations
     */
    public validate() {
        if (this.validations.length === 0) {
            return null;
        } else {
            _.each(this.validations, (validationType) => {
                const validationFunc = this.getValidation(validationType);
                console.log(validationFunc);
                const test = (Handsontable as any).validators;
                console.log(test);
            });

            return (value, callback) => {
                callback(true);
            };
        }
    }

    public addValidations(validations: SheetColumnValidationType[]) {
        this.validations = [...this.validations, ...validations];
    }

    /**
     * Include validations for each cell type
     */
    private setDefaultValidations() {
        switch (this.columnType) {
            case SheetColumnType.DATE:
                this.validations.push(SheetColumnValidationType.DATE);
                break;

            case SheetColumnType.DROPDOWN:
                this.validations.push(SheetColumnValidationType.DROPDOWN);
                break;

            case SheetColumnType.NUMERIC:
                this.validations.push(SheetColumnValidationType.POSITIVE_INTEGER);
                break;
        }
    }

    /**
     * Get validation function for a given type
     * @param validationType
     */
    private getValidation(validationType: SheetColumnValidationType) {
        switch (validationType) {
            case SheetColumnValidationType.DROPDOWN:
                return (Handsontable as any).validators.DropdownValidator;

            case SheetColumnValidationType.DATE:
                return (Handsontable as any).validators.DateValidator;

            case SheetColumnValidationType.REQUIRED:
                return (value, callback) => {
                    if (value === 'empty-row') {
                        // do not validate empty rows
                        callback(true);
                        return;
                    }

                    if (value && value.length > 0) {
                        callback(true);
                        return;
                    }

                    callback(false);
                };

            case SheetColumnValidationType.POSITIVE_INTEGER:
                return (value, callback) => {
                    if (value === 'empty-row') {
                        // do not validate empty rows
                        callback(true);
                        return;
                    }

                    callback(/^([1-9]*|null)$/.test(value));
                };
        }

        return null;
    }
}

export abstract class AbstractSheetColumn {
    // translation key for column name
    public title: string;
    // property used to populate the resulted object after saving data
    public property: string;
    // required field?
    required: boolean = false;
    // custom cell validator
    private validator: SheetColumnValidator;

    constructor(
        // column type (check Handsontable documentation)
        public type: SheetColumnType
    ) {
        this.validator = new SheetColumnValidator(this.type);
    }

    public setTitle(title: string) {
        this.title = title;
        return this;
    }

    public setProperty(property: string) {
        this.property = property;
        return this;
    }

    public setRequired(value: boolean = true) {
        this.required = value;

        // include required validator
        if (value) {
            this.validator.addValidations([SheetColumnValidationType.REQUIRED]);
        }

        return this;
    }

    /**
     * Set validations to be applied on cell
     * @param validations
     */
    public setValidations(validations: SheetColumnValidationType[]) {
        this.validator.addValidations(validations);
    }

    /**
     * Get validator function for current cell (which includes all the applied validations)
     * @param validators
     */
    public validate() {
        return this.validator.validate();
    }
}

export class TextSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetColumnType.TEXT);
    }
}

export class DateSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetColumnType.DATE);
    }
}

export class NumericSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetColumnType.NUMERIC);
    }
}

export class DropdownSheetColumn extends AbstractSheetColumn {
    // list of options for dropdown
    public options$: Observable<any>;

    constructor(
    ) {
        super(SheetColumnType.DROPDOWN);
    }

    setOptions(options$: Observable<any>) {
        this.options$ = options$;
        return this;
    }
}
