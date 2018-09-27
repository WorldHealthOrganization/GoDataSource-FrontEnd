import { Observable } from 'rxjs/Observable';

export enum SheetColumnType {
    TEXT = 'text',
    NUMERIC = 'numeric',
    DROPDOWN = 'dropdown',
    DATE = 'date'
}

export abstract class AbstractSheetColumn {
    constructor(
        // column type (check Handsontable documentation)
        public type: SheetColumnType,
        // translation key for column name
        public title: string
    ) {
    }
}

export class TextSheetColumn extends AbstractSheetColumn {
    constructor(
        title: string
    ) {
        super(SheetColumnType.TEXT, title);
    }
}

export class DateSheetColumn extends AbstractSheetColumn {
    constructor(
        title: string
    ) {
        super(SheetColumnType.DATE, title);
    }
}

export class NumericSheetColumn extends AbstractSheetColumn {
    constructor(
        title: string,
        // by default, integer
        public numericFormat = {
            // example: '0,0.00 $'
            pattern: '0'
        }
    ) {
        super(SheetColumnType.NUMERIC, title);
    }
}

export class DropdownSheetColumn extends AbstractSheetColumn {
    constructor(
        title: string,
        // list of options for dropdown
        public options$: Observable<any>
    ) {
        super(SheetColumnType.DROPDOWN, title);
    }
}
