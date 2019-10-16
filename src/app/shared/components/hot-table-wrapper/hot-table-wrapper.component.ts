import { Component, EventEmitter, HostListener, Input, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import * as Handsontable from 'handsontable';
import * as _ from 'lodash';
import { SheetCellValidator } from '../../../core/models/sheet/sheet-cell-validator';
import { HotTableComponent } from '@handsontable/angular';
import { LocationSheetColumn, DateSheetColumn, DropdownSheetColumn, IntegerSheetColumn, NumericSheetColumn, TextSheetColumn } from '../../../core/models/sheet/sheet.model';
import { SheetCellType } from '../../../core/models/sheet/sheet-cell-type';
import { Constants } from '../../../core/models/constants';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { GridSettings } from 'handsontable';
import { Observable } from 'rxjs/internal/Observable';
import { Subscriber } from 'rxjs/internal-compatibility';
import { catchError, map, tap } from 'rxjs/operators';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { LocationModel } from '../../../core/models/location.model';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { throwError } from 'rxjs/internal/observable/throwError';
import { SnackbarService } from '../../../core/services/helper/snackbar.service';
import { Subscription } from 'rxjs/internal/Subscription';
import { DialogService } from '../../../core/services/helper/dialog.service';
import { LocationDialogComponent } from '../location-dialog/location-dialog.component';
import { DialogAnswer, DialogAnswerButton } from '../dialog/dialog.component';

/**
 * Error message
 */
export interface InvalidTableData {
    isValid: boolean;
    invalidColumns: {
        [row: number]: GridSettings[]
    };
}

/**
 * Event types
 */
export enum IHotTableWrapperEventType {
    AfterChange,
    AfterBecameDirty
}

/**
 * After Change event data
 */
export interface IHotTableWrapperEventTypeAfterChange {
    sheetCore: Handsontable;
    changes: any[];
    source: string;
}

/**
 * After component became dirty event data
 */
export interface IHotTableWrapperEventTypeAfterBecameDirty {
    changes: any[];
}

/**
 * Event
 */
export interface IHotTableWrapperEvent {
    // event specific data
    type: IHotTableWrapperEventType;
    typeSpecificData: IHotTableWrapperEventTypeAfterChange | IHotTableWrapperEventTypeAfterBecameDirty;

    // common data
    sheetTable: HotTableComponent;
}

/**
 * Loading steps
 */
export enum HotTableWrapperDialogVisibility {
    Not_Visible,
    Loading,
    Visible
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
    @Input() sheetContextMenu: any;

    // columns input
    private _sheetColumns: (
        TextSheetColumn |
        DateSheetColumn |
        NumericSheetColumn |
        IntegerSheetColumn |
        DropdownSheetColumn |
        LocationSheetColumn
    )[] = [];
    @Input() set sheetColumns(sheetColumns) {
        // set columns
        this._sheetColumns = sheetColumns;

        // update cached locations
        this.updateCachedLocations();
    }
    get sheetColumns() {
        return this._sheetColumns;
    }

    // data input
    private _data: any[][];
    @Input() set data(data: any[][]) {
        // set data
        this._data = data;

        // update cached locations
        this.updateCachedLocations();
    }
    get data(): any[][] {
        return this._data;
    }

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

    // callbacks
    afterChangeCallback: (
        sheetCore: Handsontable,
        changes: any[],
        source: string
    ) => void;
    locationRendererCallback: (
        instance,
        td: HTMLTableCellElement,
        row: number,
        col: number,
        prop: string,
        value: any,
        cellProperties: any
    ) => void;
    locationEditorCallback: (
        instance
    ) => void;

    // cache locations that we need to display here
    preparedData: {
        row: number,
        col: number,
        prop: string,
        td: HTMLTableCellElement,
        originalValue: any,
        cellProperties: any
    };
    locationDialogVisible: HotTableWrapperDialogVisibility = HotTableWrapperDialogVisibility.Not_Visible;
    getLocationsListSubscriber: Subscription;
    loadingLocations: boolean = false;
    cachedLocations: {
        [locationId: string]: LocationModel
    } = {};

    /**
     * Constructor
     */
    constructor(
        private i18nService: I18nService,
        private locationDataService: LocationDataService,
        private snackbarService: SnackbarService,
        private dialogService: DialogService
    ) {}

    /**
     * Component initialized
     */
    ngOnInit() {
        // set spreadsheet width
        this.setSheetWidth();

        // initialize hot table process messages
        this.processHotTableWrapperMessages();
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
        if (
            data.source === 'edit' ||
            data.source === 'Autofill.fill'
        ) {
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
     * Update cached locations accordingly to data and columns
     */
    private updateCachedLocations() {
        // check if we have something to load
        if (
            _.isEmpty(this.data) ||
            _.isEmpty(this.sheetColumns)
        ) {
            return;
        }

        // determine locations columns
        const locationColumns: number[] = [];
        this.sheetColumns.forEach((
            column,
            columnIndex: number
        ) => {
            if (column instanceof LocationSheetColumn) {
                if (!_.isEmpty(column.property)) {
                    locationColumns.push(columnIndex);
                }
            }
        });

        // there are no location columns, then there is no point in continuing ?
        if (_.isEmpty(locationColumns)) {
            return;
        }

        // determine if we have location ids in our data for our location columns
        const locationIds: string[] = [];
        locationColumns.forEach((columnIndex: number) => {
            this.data.forEach((data) => {
                if (!_.isEmpty(data[columnIndex])) {
                    locationIds.push(data[columnIndex]);
                }
            });
        });

        // check if we didn't retrieve location already
        const locationIdsToRetrieve: string[] = _.filter(
            locationIds,
            (id: string) => {
                return !this.cachedLocations[id];
            }
        );

        // there is nothign to retrieve ?
        if (_.isEmpty(locationIdsToRetrieve)) {
            return;
        }

        // construct query builder
        const qb: RequestQueryBuilder = new RequestQueryBuilder();
        qb.filter.bySelect(
            'id',
            locationIdsToRetrieve,
            false,
            null
        );

        // stop previous request
        if (
            this.getLocationsListSubscriber &&
            !this.getLocationsListSubscriber.closed
        ) {
            this.getLocationsListSubscriber.unsubscribe();
        }

        // retrieve locations
        this.loadingLocations = true;
        this.getLocationsListSubscriber = this.locationDataService
            .getLocationsList(qb)
            .pipe(
                catchError((err) => {
                    // display error message
                    this.snackbarService.showApiError(err);

                    // location not loading anymore
                    this.loadingLocations = false;

                    // finished
                    return throwError(err);
                })
            )
            .subscribe((locations) => {
                // map the new locations
                locations.forEach((location) => {
                    this.cachedLocations[location.id] = location;
                });

                // location not loading anymore
                this.loadingLocations = false;

                // render spreedsheet
                (this.sheetTable as any).hotInstance.render();
            });
    }

    /**
     * Render location
     */
    locationRenderer(): (
        instance,
        td: HTMLTableCellElement,
        row: number,
        col: number,
        prop: string,
        value: any,
        cellProperties: any
    ) => void {
        // return cached function
        if (this.locationRendererCallback) {
            return this.locationRendererCallback;
        }

        // create functions
        const noLocationLabel: string = this.i18nService.instant('LNG_FORM_HOT_TABLE_WRAPPER_NO_LOCATION_SELECTED_LABEL');
        const loadingTitle: string = this.i18nService.instant('LNG_FORM_HOT_TABLE_WRAPPER_LOADING_LOCATIONS_TITLE');
        this.locationRendererCallback = (
            instance,
            td: HTMLTableCellElement,
            row: number,
            col: number,
            prop: string,
            value: any,
            cellProperties: any
        ) => {
            // display loading ?
            if (this.loadingLocations) {
                td.innerHTML = `<img title="${loadingTitle}" class="hot-wrapper-loading-location" src="/assets/images/loading-32.gif"/>`;
            } else {
                // display location name
                td.innerHTML = value && this.cachedLocations[value] ?
                    this.cachedLocations[value].name :
                    noLocationLabel;
            }
        };

        // return newly created function
        return this.locationRendererCallback;
    }

    /**
     * Edit location
     */
    locationEditor(): (
        instance
    ) => void {
        // return cached function
        if (this.locationEditorCallback) {
            return this.locationEditorCallback;
        }

        // editor
        this.locationEditorCallback = (
            instance
        ) => {
            // finished
            return {
                // properties
                cellProperties: {
                    // NOTHING
                },

                // Prepare
                prepare: (
                    row: number,
                    col: number,
                    prop: string,
                    td: HTMLTableCellElement,
                    originalValue: any,
                    cellProperties: any
                ) => {
                    // keep data for later use
                    this.preparedData = {
                        row: row,
                        col: col,
                        prop: prop,
                        td: td,
                        originalValue: originalValue,
                        cellProperties: cellProperties
                    };
                },

                // Begin editing
                beginEditing: (
                    initialValue?: any
                ) => {
                    // already visible ?
                    if (this.locationDialogVisible !== HotTableWrapperDialogVisibility.Not_Visible) {
                        return;
                    }

                    // dialog visible
                    this.locationDialogVisible = HotTableWrapperDialogVisibility.Loading;
                },

                // Finish editing
                finishEditing: (
                    revertToOriginal?: boolean,
                    ctrlDown?: boolean,
                    callback?: (value: boolean) => void
                ) => {
                    // NOTHING
                },

                // discard editor
                discardEditor: (
                    validationResult: boolean
                ) => {
                    // NOTHING
                },

                // save value
                saveValue: (
                    value: any,
                    ctrlDown: boolean
                ) => {
                    // NOTHING
                },

                // is opened
                isOpened: (): boolean => {
                    return this.locationDialogVisible !== HotTableWrapperDialogVisibility.Not_Visible;
                },

                // is waiting
                isWaiting: (): boolean => {
                    return this.locationDialogVisible !== HotTableWrapperDialogVisibility.Not_Visible;
                },

                // enable full edit mode
                enableFullEditMode: () => {
                    // NOTHING
                },

                // focus
                focus: () => {
                    // NOTHING
                }
            };
        };

        // return newly created function
        return this.locationEditorCallback;
    }

    /**
     * Display location dialog
     */
    private showLocationDialog() {
        // dialog either already visible or we don't need to show it ?
        if (this.locationDialogVisible !== HotTableWrapperDialogVisibility.Loading) {
            return;
        }

        // show dialog
        this.locationDialogVisible = HotTableWrapperDialogVisibility.Visible;
        this.dialogService.showCustomDialog(
            LocationDialogComponent, {
                ...LocationDialogComponent.DEFAULT_CONFIG,
                ...{
                    data: {
                        message: 'LNG_FORM_HOT_TABLE_WRAPPER_CHANGE_LOCATION_DIALOG_TITLE',
                        locationId: this.preparedData && this.preparedData.originalValue ?
                            this.preparedData.originalValue :
                            undefined,
                        required: this.sheetColumns && this.sheetColumns[this.preparedData.col] && this.sheetColumns[this.preparedData.col].required,
                        useOutbreakLocations: this.sheetColumns && this.sheetColumns[this.preparedData.col] && (this.sheetColumns[this.preparedData.col] as LocationSheetColumn).useOutbreakLocations
                    }
                }
            }
        ).subscribe((answer: DialogAnswer) => {
            if (answer.button === DialogAnswerButton.Yes) {
                // check if we need to init location data
                let selectedLocation: LocationModel;
                if (
                    (selectedLocation = answer.inputValue.value as LocationModel) &&
                    selectedLocation.id &&
                    !this.cachedLocations[selectedLocation.id]
                ) {
                    this.cachedLocations[selectedLocation.id] = selectedLocation;
                }

                // update spreedsheet data
                if (
                    this.sheetTable &&
                    this.preparedData
                ) {
                    (this.sheetTable as any).hotInstance.setDataAtCell(
                        this.preparedData.row,
                        this.preparedData.col,
                        selectedLocation ?
                            selectedLocation.id :
                            ''
                    );
                }
            }

            // dialog not visible anymore
            this.locationDialogVisible = HotTableWrapperDialogVisibility.Not_Visible;
        });
    }

    /**
     * Hack to process hot table messages since angular can't render properly some components when called by this widget
     */
    private processHotTableWrapperMessages() {
        // display dialog ?
        this.showLocationDialog();

        // handle messages once more
        setTimeout(
            () => {
                this.processHotTableWrapperMessages();
            },
            100
        );
    }
}
