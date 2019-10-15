import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import * as Handsontable from 'handsontable';
import * as _ from 'lodash';
import { SheetCellValidator } from '../../../core/models/sheet/sheet-cell-validator';
import { HotTableComponent } from '@handsontable/angular';
import { ButtonSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../core/models/sheet/sheet.model';
import { SheetCellType } from '../../../core/models/sheet/sheet-cell-type';
import { Constants } from '../../../core/models/constants';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { GridSettings } from 'handsontable';
import { Observable } from 'rxjs/internal/Observable';
import { Subscriber } from 'rxjs/internal-compatibility';
import { map, tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';

export interface InvalidTableData {
    isValid: boolean;
    invalidColumns: {
        [row: number]: GridSettings[]
    };
}

export enum IHotTableWrapperEventType {
    AfterChange,
    AfterBecameDirty
}

export interface IHotTableWrapperEventTypeAfterChange {
    sheetCore: Handsontable;
    changes: any[];
    source: string;
}

export interface IHotTableWrapperEventTypeAfterBecameDirty {
    changes: any[];
}

export interface IHotTableWrapperEvent {
    // event specific data
    type: IHotTableWrapperEventType;
    typeSpecificData: IHotTableWrapperEventTypeAfterChange | IHotTableWrapperEventTypeAfterBecameDirty;

    // common data
    sheetTable: HotTableComponent;
}

@Component({
    selector: 'app-hot-table-wrapper',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './hot-table-wrapper.component.html',
    styleUrls: ['./hot-table-wrapper.component.less']
})
export class HotTableWrapperComponent implements OnInit {
    // input
    @Input() widthReduction: number = 0;
    @Input() startRows: number = 1;
    @Input() minSpareRows: number = 0;
    @Input() data: any[][];
    @Input() sheetContextMenu: any;
    @Input() sheetColumns: (
        ButtonSheetColumn |
        TextSheetColumn |
        DateSheetColumn |
        NumericSheetColumn |
        IntegerSheetColumn |
        DropdownSheetColumn
    )[] = [];

    // output
    @Output() afterChange = new EventEmitter<IHotTableWrapperEvent>();
    @Output() afterBecameDirty = new EventEmitter<IHotTableWrapperEvent>();

    // children components
    @ViewChild('sheetTable') sheetTable: HotTableComponent;

    // local constants used by component template
    SheetCellType = SheetCellType;
    Constants = Constants;

    // local variables
    sheetWidth: number = 500;
    afterChangeCallback: (
        sheetCore: Handsontable,
        changes: any[],
        source: string
    ) => void;

    /**
     * Constructor
     */
    constructor(
        private i18nService: I18nService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // set spreadsheet width
        this.setSheetWidth();
    }

    /**
     * Update sheet width based on browser width
     * Note: It's a hack, but there's no other fix for now, since handsontable is working with pixels only
     */
    @HostListener('window:resize')
    private setSheetWidth() {
        this.sheetWidth = window.innerWidth - this.widthReduction;
    }

    /**
     * 'Handsontable' hook before running validation on a cell
     */
    beforeValidateSheet(
        sheetCore: Handsontable,
        value: string, row: number,
        column: number
    ) {
        // determine if row is empty
        const columnValues: any[] = sheetCore.getDataAtRow(row);
        columnValues[column] = value;

        // isEmptyRow doesn't work since values is changed after beforeValidateSheet
        if (_.isEmpty(_.filter(columnValues, (v) => v !== null && v !== ''))) {
            // mark this cell as being on an empty row, so we skip validation for it
            return SheetCellValidator.EMPTY_ROW_CELL_VALUE;
        } else {
            return value;
        }
    }

    /**
     * After removing row
     */
    afterRemoveRow(sheetCore: Handsontable, row: number) {
        // determine if row is empty
        const countedRows: number = sheetCore.countRows();
        while (row < countedRows) {
            // validate row
            if (_.isEmpty(_.filter(sheetCore.getDataAtRow(row), (v) => v !== null && v !== ''))) {
                _.each(
                    sheetCore.getCellMetaAtRow(row),
                    (column: {
                        valid?: boolean
                    }) => {
                        if (column.valid === false) {
                            column.valid = true;
                        }
                    }
                );
            }

            // check next row
            row++;
        }
    }

    /**
     * Data changed trigger
     */
    afterChangeTrigger(): (
        sheetCore: Handsontable,
        changes: any[],
        source: string
    ) => void {
        // return cached function
        if (this.afterChangeCallback) {
            return this.afterChangeCallback;
        }

        // create functions
        this.afterChangeCallback = (
            sheetCore: Handsontable,
            changes: any[],
            source: string
        ) => {
            // trigger after change
            this.afterChange.emit({
                type: IHotTableWrapperEventType.AfterChange,
                typeSpecificData: {
                    sheetCore: sheetCore,
                    changes: changes,
                    source: source
                } as IHotTableWrapperEventTypeAfterChange,
                sheetTable: this.sheetTable
            });

            // check if we need to trigger bacame dirty
            this.checkForDirty({
                sheetCore: sheetCore,
                changes: changes,
                source: source
            });
        };

        // return newly created function
        return this.afterChangeCallback;
    }

    /**
     * Check if we need to trigger dirty event
     * @param data
     */
    checkForDirty(data: IHotTableWrapperEventTypeAfterChange) {
        // check if need to make form dirty
        if (data.source === 'edit') {
            // remove validations
            const row: number = data.changes[0][0];
            if (_.isEmpty(_.filter(data.sheetCore.getDataAtRow(row), (v) => v !== null && v !== ''))) {
                // remove validations
                _.each(
                    data.sheetCore.getCellMetaAtRow(row),
                    (column: {
                        valid?: boolean
                    }) => {
                        if (column.valid === false) {
                            column.valid = true;
                        }
                    }
                );

                // refresh
                data.sheetCore.render();
            }

            // trigger dirty state
            if (!data.sheetCore.isEmptyRow(row)) {
                this.afterBecameDirty.emit({
                    type: IHotTableWrapperEventType.AfterBecameDirty,
                    typeSpecificData: {
                        changes: data.changes
                    } as IHotTableWrapperEventTypeAfterBecameDirty,
                    sheetTable: this.sheetTable
                });
            }
        }
    }

    /**
     * Validate all table cells
     */
    validateTable(): Observable<InvalidTableData> {
        return new Observable((observer: Subscriber<InvalidTableData>) => {
            // validate all cells
            const sheetCore: Handsontable = (this.sheetTable as any).hotInstance;
            sheetCore.validateCells((valid) => {
                // if not valid, then we need to determine what rows / columns are invalid
                const invalidColumns: {
                    [row: number]: GridSettings[]
                } = {};
                const countedRows: number = sheetCore.countRows();
                let row: number = 0;
                while (row < countedRows) {
                    // validate row
                    if (!sheetCore.isEmptyRow(row)) {
                        _.each(
                            sheetCore.getCellMetaAtRow(row),
                            (column: GridSettings) => {
                                if (column.valid === false) {
                                    // initialize
                                    if (invalidColumns[row] === undefined) {
                                        invalidColumns[row] = [];
                                    }

                                    // add invalid column
                                    invalidColumns[row].push(column);
                                }
                            }
                        );
                    }

                    // check next row
                    row++;
                }

                // send response back
                observer.next({
                    isValid: valid,
                    invalidColumns: invalidColumns
                });
                observer.complete();
            });
        });
    }

    /**
     * Get contacts data from table, ready to be sent in the API call for creating the contacts
     */
    getData(): Observable<{ data: any[], sheetCore: Handsontable}> {
        // get the label-value map of Reference Data dropdowns (so we can replaced the labels used in the Sheet with the actual values)
        const sheetCore: Handsontable = (this.sheetTable as any).hotInstance;
        return this.getDropDownsLabelValueMap()
            .pipe(
                map((dropdownsMap) => {
                    const data = [];

                    // get table data
                    const tableCellsData = sheetCore.getData();

                    // get data row by row
                    _.each(tableCellsData, (rowData, rowIndex) => {
                        // check if row has any data
                        if (!sheetCore.isEmptyRow(rowIndex)) {
                            // create new object for current row
                            const rowObj = {};

                            // get row data cell by cell
                            _.each(rowData, (columnValue, columnIndex) => {
                                // omit empty cells
                                if (
                                    columnValue !== null &&
                                    columnValue !== ''
                                ) {
                                    // by default, keep the value as it is
                                    let cellValue = columnValue;

                                    // check if column is a dropdown
                                    if (this.sheetColumns[columnIndex].type === SheetCellType.DROPDOWN) {
                                        // get cell value from dropdowns map
                                        cellValue = dropdownsMap[columnIndex][columnValue];
                                    }

                                    // add cell data to the row object
                                    _.set(rowObj, this.sheetColumns[columnIndex].property, cellValue);
                                }
                            });

                            // add row data
                            data.push(rowObj);
                        }
                    });

                    // finished
                    return {
                        data: data,
                        sheetCore: sheetCore
                    };
                })
            );
    }

    /**
     * Get a map of (translated label - value) pairs for all dropdowns
     */
    private getDropDownsLabelValueMap(): Observable<any> {
        const dropdownsMap = [];
        const dropdownItemsObservables = [];

        for (const i in this.sheetColumns) {
            const sheetColumn = this.sheetColumns[i];
            // check if it's a dropdown
            if (sheetColumn.type === SheetCellType.DROPDOWN) {
                // initialize map for each dropdown
                dropdownsMap[i] = {};

                // collect the list of observables to be called to get dropdown items
                ((index) => {
                    dropdownItemsObservables.push(
                        (sheetColumn as DropdownSheetColumn).options$
                            .pipe(
                                tap((dropdownItems) => {
                                    // go through all items of each dropdown
                                    _.each(dropdownItems, (item) => {
                                        // keep the value associated to each translated label
                                        const label = this.i18nService.instant(item.label);
                                        dropdownsMap[index][label] = item.value;
                                    });
                                })
                            )
                    );
                })(i);
            }
        }

        // retrieve all dropdowns items
        return forkJoin(dropdownItemsObservables)
            .pipe(
                map(() => dropdownsMap)
            );
    }

    /**
     * Retrieve errors
     * @param response
     * @param errToken
     */
    getErrors(
        response: any,
        errToken: string
    ) {
        return _.map(
            response.invalidColumns,
            (columns: GridSettings[], row: string) => {
                // initialize
                const data: {
                    row: number,
                    columns: string
                } = {
                    row: _.parseInt(row) + 1,
                    columns: ''
                };

                // merge columns into just one error message
                _.each(
                    columns,
                    (column: GridSettings) => {
                        data.columns += `${data.columns.length < 1 ? '' : ', '}${column.title}`;
                    }
                );

                // finished
                return {
                    message: errToken,
                    data: data
                };
            }
        );
    }
}
