import { Observable } from 'rxjs';
import { SheetCellValidator } from './sheet-cell-validator';
import { SheetCellType } from './sheet-cell-type';
import { SheetCellValidationType } from './sheet-cell-validation-type';
import { map } from 'rxjs/operators';
import { Moment } from '../../helperClasses/x-moment';
import { LabelValuePair } from '../label-value-pair';

export type SheetColumnAsyncValidator = (value: string, callback: (result: boolean) => void) => void;

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
    // async validators
    asyncValidators: SheetColumnAsyncValidator[] = [];

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

    public setAsyncValidator(callback: SheetColumnAsyncValidator) {
        if (callback) {
            this.addAsyncValidator(callback);
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

    /**
     * Add async validator
     * @param {SheetColumnAsyncValidator} callback
     */
    public addAsyncValidator(callback: SheetColumnAsyncValidator) {
        // add async validator if needed
        if (this.validations.indexOf(SheetCellValidationType.ASYNC_VALIDATION) === -1) {
            this.addValidation(SheetCellValidationType.ASYNC_VALIDATION);
        }

        // add async method
        this.asyncValidators.push(callback);
    }
}

/**
 * Free text cell
 */
export class TextSheetColumn extends AbstractSheetColumn {
    constructor() {
        super(SheetCellType.TEXT);
    }
}

/**
 * Date picker cell
 */
export class DateSheetColumn extends AbstractSheetColumn {
    constructor(
        public min?: Moment,
        public max?: Moment
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
 * Integer cell
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
    public options$: Observable<LabelValuePair[]>;
    // list of translated labels to be used as dropdown options ('handsontable' expects a list of strings)
    public optionLabels$: Observable<string[]>;

    // applies for reference data, but if we send values that aren't taken from reference data then we need to map id to name
    public idTranslatesToLabel: boolean = true;

    /**
     * Constructor
     */
    constructor() {
        super(SheetCellType.DROPDOWN);
    }

    /**
     * Set Options
     */
    setOptions(
        options$: Observable<LabelValuePair[]>,
        i18nService,
        idTranslatesToLabel: boolean = true
    ) {
        // applies for reference data, but if we send values that aren't taken from reference data then we need to map id to name
        this.idTranslatesToLabel = idTranslatesToLabel;

        // keep the observable of LabelValue options
        this.options$ = options$;

        // get the list of string labels
        this.optionLabels$ = this.options$
            .pipe(
                map((items) => items.map((item) => i18nService.instant(item.label).trim()))
            );

        // finished
        return this;
    }
}

/**
 * Location Button cell
 */
export class LocationSheetColumn extends AbstractSheetColumn {
    // outbreak locations ?
    useOutbreakLocations: boolean = false;

    constructor() {
        super(SheetCellType.LOCATION);
    }

    setUseOutbreakLocations(useOutbreakLocations: boolean) {
        this.useOutbreakLocations = useOutbreakLocations;
        return this;
    }
}
