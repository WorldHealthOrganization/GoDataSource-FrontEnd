import { Injectable } from '@angular/core';
import * as Handsontable from 'handsontable';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import { SnackbarService } from './snackbar.service';
import { AbstractSheetColumn } from '../../models/sheet/sheet.model';
import * as _ from 'lodash';

@Injectable()
export class BulkAddContactsService {

    constructor(
        private snackbarService: SnackbarService
    ) {
    }

    /**
     * Check if all table cells are valid
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

    getData(sheetCore: Handsontable, sheetColumns: AbstractSheetColumn[]): any[] {
        const data = [];

        // get table data
        const tableCellsData = sheetCore.getData();

        // get data row by row
        _.each(tableCellsData, (rowData, rowIndex) => {
            // check if row has any data
            if (!sheetCore.isEmptyRow(rowIndex)) {
                // create new object for current row
                const rowObj = {};
                _.each(rowData, (columnValue, columnIndex) => {
                    // omit empty columns
                    if (
                        columnValue !== null &&
                        columnValue !== ''
                    ) {
                        _.set(rowObj, sheetColumns[columnIndex].property, columnValue);
                    }
                });

                data.push(rowObj);
            }
        });

        return data;
    }
}

