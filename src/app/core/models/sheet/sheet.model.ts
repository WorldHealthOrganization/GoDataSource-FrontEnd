import { Observable } from 'rxjs/Observable';
import { SheetCellValidator } from './sheet-cell-validator';
import { SheetCellType } from './sheet-cell-type';
import { SheetCellValidationType } from './sheet-cell-validation-type';

export abstract class AbstractSheetColumn {
    // translation key for column name
    title: string;
    // property used to populate the resulted object when saving data
    property: string;
    // required field?
    required: boolean = false;
    // cell validation function
    validationFunc: (value: string, callback: (result: boolean) => any) => any;
    // list of all individual validations to be applied on cells
    private validations: SheetCellValidationType[] = [];

    constructor(
        // column type (check Handsontable documentation)
        public type: SheetCellType
    ) {
        // get validator by Cell Type
        const validationType = SheetCellValidator.CELL_VALIDATION_TYPE[this.type];
        if (validationType) {
            this.addValidation(validationType);
        }
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
            this.addValidation(SheetCellValidationType.REQUIRED);
        }

        return this;
    }

    /**
     * Add an individual validation for cells under this column
     * @param validationType
     */
    public addValidation(validationType: SheetCellValidationType) {
        this.validations.push(validationType);

        // merge all individual validators into a single validation function that will be passed to 'handsontable'
        this.validationFunc = SheetCellValidator.mergeValidations(
            this.validations,
            this
        );
    }
}

/**
 * Free text cell
 */
export class TextSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetCellType.TEXT);
    }
}

/**
 * Date picker cell
 */
export class DateSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetCellType.DATE);
    }
}

/**
 * Numeric cell
 */
export class NumericSheetColumn extends AbstractSheetColumn {
    constructor(
        public min?: number,
        public max?: number,
        public isInteger: boolean = false
    ) {
        super(SheetCellType.NUMERIC);
    }
}

/**
 * Numeric cell
 */
export class IntegerSheetColumn extends NumericSheetColumn {
    constructor(
        public min?: number,
        public max?: number
    ) {
        super(
            min,
            max,
            true
        );
    }
}

/**
 * Dropdown cell
 */
export class DropdownSheetColumn extends AbstractSheetColumn {
    // list of options for dropdown
    public options$: Observable<any>;
    // list of translated labels to be used as dropdown options ('handsontable' expects a list of strings)
    public optionLabels$: Observable<string[]>;

    constructor(
    ) {
        super(SheetCellType.DROPDOWN);
    }

    setOptions(options$: Observable<any>, i18nService) {
        // keep the observable of LabelValue options
        this.options$ = options$;
        // get the list of string labels
        this.optionLabels$ = this.options$.map((items) => items.map((item) => i18nService.instant(item.label)));

        return this;
    }
}
