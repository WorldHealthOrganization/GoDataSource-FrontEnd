import { Observable } from 'rxjs/Observable';
import { SheetCellValidator } from './sheet-cell-validator';
import { SheetCellType } from './sheet-cell-type';
import { SheetCellValidationType } from './sheet-cell-validation-type';

export abstract class AbstractSheetColumn {
    // translation key for column name
    title: string;
    // property used to populate the resulted object after saving data
    property: string;
    // required field?
    required: boolean = false;
    // custom cell validation function
    validationFunc: (value: string, callback: (result: boolean) => any) => any;
    // validations to be applied
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

    public addValidation(validationType: SheetCellValidationType) {
        this.validations.push(validationType);

        this.validationFunc = SheetCellValidator.mergeValidations(this.validations);
    }
}

export class TextSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetCellType.TEXT);
    }
}

export class DateSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetCellType.DATE);
    }
}

export class NumericSheetColumn extends AbstractSheetColumn {
    constructor(
    ) {
        super(SheetCellType.NUMERIC);
    }
}

export class DropdownSheetColumn extends AbstractSheetColumn {
    // list of options for dropdown
    public options$: Observable<any>;

    constructor(
    ) {
        super(SheetCellType.DROPDOWN);
    }

    setOptions(options$: Observable<any>) {
        this.options$ = options$;
        return this;
    }
}
