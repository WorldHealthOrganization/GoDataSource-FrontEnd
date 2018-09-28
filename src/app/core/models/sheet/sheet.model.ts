import { Observable } from 'rxjs/Observable';

export enum SheetColumnType {
    TEXT = 'text',
    NUMERIC = 'numeric',
    DROPDOWN = 'dropdown',
    DATE = 'date'
}

export abstract class AbstractSheetColumn {
    // translation key for column name
    public title: string;
    // property used to populate the resulted object after saving data
    public property: string;
    // required field?
    required: boolean = false;

    constructor(
        // column type (check Handsontable documentation)
        public type: SheetColumnType
    ) {
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
        return this;
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
