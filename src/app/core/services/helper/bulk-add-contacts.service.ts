import { Injectable } from '@angular/core';
import * as Handsontable from 'handsontable';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { AbstractSheetColumn, DropdownSheetColumn } from '../../models/sheet/sheet.model';
import * as _ from 'lodash';
import { SheetCellType } from '../../models/sheet/sheet-cell-type';
import { I18nService } from './i18n.service';
import 'rxjs/add/observable/forkJoin';

@Injectable()
export class BulkAddContactsService {

    constructor(
        private i18nService: I18nService
    ) {
    }

    /**
     * Validate all table cells
     * @param sheetCore
     */
    validateTable(sheetCore: Handsontable): Observable<boolean> {
        return Observable.create((observer: Subscriber<boolean>) => {
            // validate all cells
            sheetCore.validateCells((valid) => {
                observer.next(valid);
                observer.complete();
            });
        });
    }

    /**
     * Get contacts data from table, ready to be sent in the API call for creating the contacts
     * @param sheetCore
     * @param sheetColumns
     */
    getData(sheetCore: Handsontable, sheetColumns: AbstractSheetColumn[]): Observable<any[]> {
        // get the label-value map of Reference Data dropdowns (so we can replaced the labels used in the Sheet with the actual values)
        return this.getDropdownsLabelValueMap((sheetColumns as any))
            .map((dropdownsMap) => {
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
                                if (sheetColumns[columnIndex].type === SheetCellType.DROPDOWN) {
                                    // get cell value from dropdowns map
                                    cellValue = dropdownsMap[columnIndex][columnValue];
                                }

                                // add cell data to the row object
                                _.set(rowObj, sheetColumns[columnIndex].property, cellValue);
                            }
                        });

                        // add row data
                        data.push(rowObj);
                    }
                });

                return data;
            });
    }

    /**
     * Get a map of (translated label - value) pairs for all dropdowns
     * @param sheetColumns
     */
    getDropdownsLabelValueMap(sheetColumns: DropdownSheetColumn[]): Observable<any> {
        const dropdownsMap = [];
        const dropdownItemsObservables = [];

        for (const i in sheetColumns) {
            const sheetColumn = sheetColumns[i];
            // check if it's a dropdown
            if (sheetColumn.type === SheetCellType.DROPDOWN) {
                // initialize map for each dropdown
                dropdownsMap[i] = {};

                // collect the list of observables to be called to get dropdown items
                ((index) => {
                    dropdownItemsObservables.push(
                        sheetColumn.options$
                            .do((dropdownItems) => {
                                // go through all items of each dropdown
                                _.each(dropdownItems, (item) => {
                                    // keep the value associated to each translated label
                                    const label = this.i18nService.instant(item.label);
                                    dropdownsMap[index][label] = item.value;
                                });
                            })
                    );
                })(i);
            }
        }

        // retrieve all dropdowns items
        return Observable.forkJoin(dropdownItemsObservables)
            .map(() => dropdownsMap);
    }
}
