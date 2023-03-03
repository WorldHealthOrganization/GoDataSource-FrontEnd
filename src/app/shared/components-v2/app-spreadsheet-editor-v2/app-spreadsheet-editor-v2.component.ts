import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, V2ActionType } from '../app-list-table-v2/models/action.model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { ColumnApi } from '@ag-grid-community/core/dist/cjs/es5/columns/columnApi';
import { GridReadyEvent } from '@ag-grid-community/core';
import { V2SpreadsheetEditorColumn, V2SpreadsheetEditorColumnType, V2SpreadsheetEditorColumnTypeToEditor } from './models/column.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { IV2SpreadsheetEditorExtendedColDef, IV2SpreadsheetEditorExtendedColDefEditor, IV2SpreadsheetEditorExtendedColDefEditorSelectionRange } from './models/extended-column.model';
import { AppSpreadsheetEditorV2CellBasicRendererComponent } from './components/cell-basic-renderer/app-spreadsheet-editor-v2-cell-basic-renderer.component';
import * as moment from 'moment';
import { Clipboard } from '@angular/cdk/clipboard';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2',
  templateUrl: './app-spreadsheet-editor-v2.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2Component implements OnInit, OnDestroy {
  // max number of ms until outside leave is consider mouse out
  private static readonly HOVER_OUSIDE_LIMIT_UNTIL_MOUSE_OUT: number = 200;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // columns
  private _locationColumns: string[];
  private _columns: V2SpreadsheetEditorColumn[];
  @Input() set columns(columns: V2SpreadsheetEditorColumn[]) {
    // set data
    this._columns = columns;

    // update columns definitions
    this.updateColumnDefinitions();
  }
  get columns(): V2SpreadsheetEditorColumn[] {
    return this._columns;
  }

  // editor
  editor: IV2SpreadsheetEditorExtendedColDefEditor = {
    // columns map
    columnsMap: {},

    // location
    locationNamesMap: {},

    // selection range handlers
    selection: {
      // data
      selected: {
        collecting: undefined,
        previousCollecting: undefined,
        outTime: undefined,
        ranges: []
      },

      // events
      mouseDown: (
        row,
        column,
        ctrlKey,
        shiftKey
      ) => {
        this.cellMouseDown(
          row,
          column,
          ctrlKey,
          shiftKey
        );
      },
      mouseUp: () => {
        this.cellMouseUp();
      },
      mouseLeave: () => {
        this.cellMouseLeave();
      },
      mouseEnter: (
        row,
        column,
        primaryButtonStillDown
      ) => {
        this.cellMouseEnter(
          row,
          column,
          primaryButtonStillDown
        );
      }
    }
  };

  // action button
  actionButton: IV2ActionIconLabel = {
    type: V2ActionType.ICON_LABEL,
    icon: '',
    label: 'LNG_COMMON_BUTTON_SAVE',
    action: {
      click: () => {
        // #TODO
      }
    }
  };

  // ag-grid modules
  modules = [
    ClientSideRowModelModule
  ];

  // ag table api handlers
  private _agTable: {
    api: GridApi,
    columnApi: ColumnApi
  } = null;
  private _callWhenReady: {
    updateColumnDefinitions?: true
  } = {};

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService,
    protected elementRef: ElementRef,
    protected clipboard: Clipboard
  ) {}

  /**
   * Initialize resources
   */
  ngOnInit(): void {
    // subscribe to language change
    // #TODO
    // this.initializeLanguageChangeListener();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // stop retrieving data
    // #TODO
    // this.stopGetRecords();

    // stop refresh language tokens
    // #TODO
    // this.releaseLanguageChangeListener();
  }

  /**
   * Refresh template
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Grid ready
   */
  gridReady(event: GridReadyEvent): void {
    // initialize table
    this._agTable = {
      api: event.api,
      columnApi: event.columnApi
    };

    // call methods to finish setup - updateColumnDefinitions
    if (this._callWhenReady.updateColumnDefinitions) {
      // call
      this.updateColumnDefinitions();
    }
  }

  /**
   * Update column definitions
   */
  updateColumnDefinitions(): void {
    // reset
    this._locationColumns = [];
    this.editor.columnsMap = {};
    this.editor.locationNamesMap = {};
    this.editor.selection.selected = {
      collecting: undefined,
      previousCollecting: undefined,
      outTime: undefined,
      ranges: []
    };

    // ag table not initialized ?
    if (!this._agTable) {
      // call later
      this._callWhenReady.updateColumnDefinitions = true;

      // finished
      return;
    }

    // already called
    delete this._callWhenReady.updateColumnDefinitions;

    // nothing to do ?
    if (!this._columns) {
      // reset
      this._agTable.api.setColumnDefs(undefined);

      // finished
      return;
    }

    // determine columns
    const columnDefs: IV2SpreadsheetEditorExtendedColDef[] = [{
      headerName: '',
      field: 'rowNo',
      resizable: false,
      suppressMovable: true,
      suppressFillHandle: true,
      suppressPaste: true,
      suppressNavigable: true,
      editable: false,
      pinned: 'left',
      width: 50,
      cellClass: 'gd-spreadsheet-editor-row-no',
      editor: this.editor
    }];

    // process columns in default order
    this._columns.forEach((column, index) => {
      // column key
      const columnKey: string = column.field;

      // custom process ?
      switch (column.type) {
        case V2SpreadsheetEditorColumnType.LOCATION:
          // add to location columns
          this._locationColumns.push(columnKey);

          // finished
          break;
        case V2SpreadsheetEditorColumnType.SINGLE_SELECT:
          // map options
          column.optionsMap = {};
          column.options.forEach((option) => {
            column.optionsMap[option.value] = option;
          });

          // finished
          break;
      }

      // define column
      const colDef: IV2SpreadsheetEditorExtendedColDef = {
        headerName: column.label ?
          this.i18nService.instant(column.label) :
          '',
        field: column.field,
        resizable: true,
        suppressMovable: true,
        editable: true,
        cellEditor: V2SpreadsheetEditorColumnTypeToEditor[column.type].type,
        cellEditorParams: column.editor?.params,
        columnDefinition: column,
        editor: this.editor,
        // valueFormatter: (params): string => {
        //   // nothing to format ?
        //   const colDef: IV2SpreadsheetEditorExtendedColDef = params.colDef;
        //   if (
        //     !colDef?.columnDefinition ||
        //     colDef.columnDefinition.type === V2SpreadsheetEditorColumnType.TEXT ||
        //     colDef.columnDefinition.type === V2SpreadsheetEditorColumnType.TEXTAREA
        //   ) {
        //     return params.value;
        //   }
        //
        //   // handle type
        //   switch (colDef.columnDefinition.type) {
        //     case V2SpreadsheetEditorColumnType.SINGLE_SELECT:
        //       return colDef.columnDefinition.optionsMap[params.value] ?
        //         colDef.columnDefinition.optionsMap[params.value].label :
        //         params.value;
        //   }
        //
        //   // custom format
        //   return params.value;
        // },
        cellRenderer: AppSpreadsheetEditorV2CellBasicRendererComponent,
        cellStyle: {
          padding: '0',
          border: 'none'
        }
      };

      // map
      this.editor.columnsMap[columnKey] = {
        // +1 to jump over row number column
        index: index + 1,
        columnDefinition: column
      };

      // attach column to list of visible columns
      columnDefs.push(colDef);
    });

    // update column defs
    this._agTable.api.setColumnDefs(columnDefs);

    // #TODO - remove
    const aaa = [];
    for (let i = 1; i < 100; i++) {
      aaa.push({
        rowNo: i,
        aaa: `aa${i}`,
        bbb: `bb${i}`,
        ccc: 2,
        eee: '36b07a5c-b2cd-48b6-bb12-9912bc8094de'
      });
    }
    this._agTable.api.setRowData(aaa);
    // #TODO - remove

    // #TODO - pipe..retrieve locations
    // this._locationColumns
    // aaa => records
    // determine locations that we need to retrieve
    // put in cache
    // currentItem.location.name + (
    //               !_.isEmpty(currentItem.location.synonyms) ?
    //                 ` ( ${currentItem.location.synonymsAsString} )` :
    //                 ''
    //             )
    this.editor.locationNamesMap = {
      '36b07a5c-b2cd-48b6-bb12-9912bc8094de': 'Bucharest ( B )'
    };
    // #TODO - pipe..retrieve locations

    // re-render page
    this.detectChanges();
  }

  /**
   * Merge 2 ranges if necessary
   */
  private cellMergeTwoRangesIfNecessary(
    range1: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange,
    range2: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange
  ): IV2SpreadsheetEditorExtendedColDefEditorSelectionRange {
    // check if we should merge this range with collecting one
    if (
      range1.columns.start === range2.columns.start &&
      range1.columns.end === range2.columns.end && (
        (
          range1.rows.start >= range2.rows.start - 1 &&
          range1.rows.start <= range2.rows.end + 1
        ) || (
          range1.rows.end >= range2.rows.start - 1 &&
          range1.rows.end <= range2.rows.end + 1
        ) || (
          range2.rows.start >= range1.rows.start - 1 &&
          range2.rows.start <= range1.rows.end + 1
        ) || (
          range2.rows.end >= range1.rows.start - 1 &&
          range2.rows.end <= range1.rows.end + 1
        )
      )
    ) {
      // merge
      range1.rows.start = range1.rows.start < range2.rows.start ?
        range1.rows.start :
        range2.rows.start;
      range1.rows.end = range1.rows.end > range2.rows.end ?
        range1.rows.end :
        range2.rows.end;

      // finished
      return range1;
    } else if (
      range1.rows.start === range2.rows.start &&
      range1.rows.end === range2.rows.end && (
        (
          range1.columns.start >= range2.columns.start - 1 &&
          range1.columns.start <= range2.columns.end + 1
        ) || (
          range1.columns.end >= range2.columns.start - 1 &&
          range1.columns.end <= range2.columns.end + 1
        ) || (
          range2.columns.start >= range1.columns.start - 1 &&
          range2.columns.start <= range1.columns.end + 1
        ) || (
          range2.columns.end >= range1.columns.start - 1 &&
          range2.columns.end <= range1.columns.end + 1
        )
      )
    ) {
      // merge
      range1.columns.start = range1.columns.start < range2.columns.start ?
        range1.columns.start :
        range2.columns.start;
      range1.columns.end = range1.columns.end > range2.columns.end ?
        range1.columns.end :
        range2.columns.end;

      // finished
      return range1;
    } else if (
      (
        range1.rows.start <= range2.rows.start &&
        range1.rows.end >= range2.rows.end &&
        range1.columns.start <= range2.columns.start &&
        range1.columns.end >= range2.columns.end
      ) || (
        range2.rows.start <= range1.rows.start &&
        range2.rows.end >= range1.rows.end &&
        range2.columns.start <= range1.columns.start &&
        range2.columns.end >= range1.columns.end
      )
    ) {
      // merge
      range1.rows.start = range1.rows.start < range2.rows.start ?
        range1.rows.start :
        range2.rows.start;
      range1.rows.end = range1.rows.end > range2.rows.end ?
        range1.rows.end :
        range2.rows.end;
      range1.columns.start = range1.columns.start < range2.columns.start ?
        range1.columns.start :
        range2.columns.start;
      range1.columns.end = range1.columns.end > range2.columns.end ?
        range1.columns.end :
        range2.columns.end;

      // finished
      return range1;
    }

    // not merged
    return undefined;
  }

  /**
   * Merge ranges
   */
  private cellMergeRanges(): void {
    // nothing to do ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // update previous
    const collecting = this.editor.selection.selected.collecting;
    this.editor.selection.selected.previousCollecting = collecting;

    // no merge necessary ?
    if (this.editor.selection.selected.ranges.length < 1) {
      // add to list
      this.editor.selection.selected.ranges.push(collecting.range);

      // finished
      return;
    }

    // go through ranges and merge with first one that matches
    let merged: boolean = false;
    for (let rangeIndex = 0; rangeIndex < this.editor.selection.selected.ranges.length; rangeIndex++) {
      // retrieve range
      const range: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange = this.editor.selection.selected.ranges[rangeIndex];
      const mergedResultRange = this.cellMergeTwoRangesIfNecessary(
        range,
        collecting.range
      );
      if (mergedResultRange) {
        // if we merged the collecting range then we need to update previous
        this.editor.selection.selected.previousCollecting.range = mergedResultRange;
        this.editor.selection.selected.previousCollecting.startingPoint = {
          row: mergedResultRange.rows.start,
          column: mergedResultRange.columns.start
        };

        // merged - finished
        merged = true;
        break;
      }
    }

    // not merged ?
    if (!merged) {
      // add to list
      this.editor.selection.selected.ranges.push(collecting.range);
    } else {
      // if a merge was done then we might need to readjust other ranges too
      while (merged) {
        // reset
        merged = false;

        // try merging again
        for (let range1Index = 0; range1Index < this.editor.selection.selected.ranges.length; range1Index++) {
          // try merging with others
          for (let range2Index = range1Index + 1; range2Index < this.editor.selection.selected.ranges.length; range2Index++) {
            // try merging ranges
            const mergedResultRange = this.cellMergeTwoRangesIfNecessary(
              this.editor.selection.selected.ranges[range1Index],
              this.editor.selection.selected.ranges[range2Index]
            );

            // merged ?
            if (mergedResultRange) {
              // remove the second one since we merged it into first one
              this.editor.selection.selected.ranges.splice(range2Index, 1);

              // try again from the start
              merged = true;
              break;
            }
          }

          // must start again ?
          if (merged) {
            break;
          }
        }
      }

      // remove intersections
      // - split into multiple ranges
      // - Microsoft Excel doesn't do it, so we will keep overlapping selections too

      // if we merged the collecting range then we need to update previous
      // - can't continue from previous one
      this.editor.selection.selected.previousCollecting = undefined;
    }
  }

  /**
   * Finished range collecting
   */
  private cellFinishCollecting(): void {
    // nothing to do ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // merge ranges with collecting one if necessary
    this.cellMergeRanges();

    // cleanup
    this.editor.selection.selected.collecting = undefined;
    this.editor.selection.selected.outTime = undefined;

    // update css
    this.cellUpdateRangeClasses();
  }

  /**
   * Add proper css classes
   */
  private cellProcessRange(range: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange): void {
    for (let rowIndex: number = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
      for (let columnIndex: number = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
        // retrieve cell html
        const cellHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-selected-${rowIndex}-${columnIndex}`);

        // attach selected class
        cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-visible');

        // left border
        if (columnIndex === range.columns.start) {
          cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-left');
        }

        // right border
        if (columnIndex === range.columns.end) {
          cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-right');
        }

        // top border
        if (rowIndex === range.rows.start) {
          cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-top');
        }

        // bottom border
        if (rowIndex === range.rows.end) {
          cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-bottom');
        }
      }
    }
  }

  /**
   * Update css
   */
  private cellUpdateRangeClasses(): void {
    // remove selected
    const elements = this.elementRef.nativeElement.getElementsByClassName('gd-spreadsheet-editor-v2-cell-basic-renderer-selected');
    for (let elementIndex = 0; elementIndex < elements.length; elementIndex++) {
      elements[elementIndex].classList.remove(
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-visible',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-left',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-right',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-top',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-bottom'
      );
    }

    // render already selected ranges
    this.editor.selection.selected.ranges.forEach((range) => {
      this.cellProcessRange(range);
    });

    // update cell classes for currently collecting
    if (this.editor.selection.selected.collecting) {
      this.cellProcessRange(this.editor.selection.selected.collecting.range);
    }
  }

  /**
   * Column mouse down
   */
  private cellMouseDown(
    row: number,
    column: number,
    ctrlKey: boolean,
    shiftKey: boolean
  ): void {
    // cleanup - if no need to continue
    if (
      !ctrlKey &&
      !shiftKey
    ) {
      this.editor.selection.selected.ranges = [];
      this.editor.selection.selected.previousCollecting = undefined;
    }

    // start collecting
    if (
      shiftKey &&
      this.editor.selection.selected.previousCollecting
    ) {
      // continue previous
      this.editor.selection.selected.collecting = this.editor.selection.selected.previousCollecting;
    } else {
      // clean start
      this.editor.selection.selected.collecting = {
        startingPoint: {
          row,
          column
        },
        range: {
          rows: {
            start: row,
            end: row
          },
          columns: {
            start: column,
            end: column
          }
        }
      };
    }

    // update css
    this.cellUpdateRangeClasses();
  }

  /**
   * Column mouse up
   */
  private cellMouseUp(): void {
    // finished
    this.cellFinishCollecting();
  }

  /**
   * Column mouse leave
   */
  private cellMouseLeave(): void {
    // are we collecting cells ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // listen for leaving cells zone
    this.editor.selection.selected.outTime = moment();
  }

  /**
   * Column mouse enter
   */
  private cellMouseEnter(
    row: number,
    column: number,
    primaryButtonStillDown: boolean
  ): void {
    // are we collecting cells ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // too late ?
    if (
      !primaryButtonStillDown || (
        this.editor.selection.selected.outTime &&
        moment().diff(this.editor.selection.selected.outTime) > AppSpreadsheetEditorV2Component.HOVER_OUSIDE_LIMIT_UNTIL_MOUSE_OUT
      )
    ) {
      // wrap up
      this.cellMouseUp();

      // finished
      return;
    }

    // reset
    this.editor.selection.selected.outTime = undefined;

    // add to range - row start
    if (row < this.editor.selection.selected.collecting.startingPoint.row) {
      this.editor.selection.selected.collecting.range.rows.start = row;
    } else {
      this.editor.selection.selected.collecting.range.rows.start = this.editor.selection.selected.collecting.startingPoint.row;
    }

    // add to range - row end
    if (row > this.editor.selection.selected.collecting.startingPoint.row) {
      this.editor.selection.selected.collecting.range.rows.end = row;
    } else {
      this.editor.selection.selected.collecting.range.rows.end = this.editor.selection.selected.collecting.startingPoint.row;
    }

    // add to range - column start
    if (column < this.editor.selection.selected.collecting.startingPoint.column) {
      this.editor.selection.selected.collecting.range.columns.start = column;
    } else {
      this.editor.selection.selected.collecting.range.columns.start = this.editor.selection.selected.collecting.startingPoint.column;
    }

    // add to range - column end
    if (column > this.editor.selection.selected.collecting.startingPoint.column) {
      this.editor.selection.selected.collecting.range.columns.end = column;
    } else {
      this.editor.selection.selected.collecting.range.columns.end = this.editor.selection.selected.collecting.startingPoint.column;
    }

    // update css
    this.cellUpdateRangeClasses();
  }

  /**
   * Mouse leave
   */
  gridMouseLeave(): void {
    // end collecting
    this.cellFinishCollecting();
  }

  /**
   * Context menu option - cut
   */
  cellCut(): void {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length < 1) {
      return;
    }

    // ask how to cut (separator)
    // #TODO

    // determine unique cells so we don't export the same cell data if there is an intersection between ranges
    // #TODO

    // retrieve row data
    // #TODO
    const data: any[] = [];
    this._agTable.api.forEachNode((node) => {
      data.push(node.data);
    });

    // cut data
    // #TODO
    let finalString: string = '';
    this.editor.selection.selected.ranges.forEach((range) => {
      for (let rowIndex = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
        // copy row data
        for (let columnIndex = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
          // #TODO
          // columnIndex - 1 to exclude row number column which isn't in this.columns
          let value: string = data[rowIndex][this.columns[columnIndex - 1].field];
          value = value === undefined || value == null ? '' : value;
          finalString += columnIndex === range.columns.start ? value : `\t${value}`;
        }

        // end of line
        finalString += '\r\n';
      }
    });

    // copy to clipboard
    this.clipboard.copy(finalString);
  }

  /**
   * Context menu option - copy
   */
  cellCopy(): void {
    // #TODO
  }
}
