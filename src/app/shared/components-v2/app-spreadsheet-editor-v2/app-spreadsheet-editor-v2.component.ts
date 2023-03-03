import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, V2ActionType } from '../app-list-table-v2/models/action.model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { ColumnApi } from '@ag-grid-community/core/dist/cjs/es5/columns/columnApi';
import { GridReadyEvent } from '@ag-grid-community/core';
import { V2SpreadsheetEditorColumn, V2SpreadsheetEditorColumnType, V2SpreadsheetEditorColumnTypeToEditor } from './models/column.model';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { IV2SpreadsheetEditorExtendedColDef } from './models/extended-column.model';
import { AppSpreadsheetEditorV2CellBasicRendererComponent } from './components/cell-basic-renderer/app-spreadsheet-editor-v2-cell-basic-renderer.component';
import { MenuItemDef } from '@ag-grid-community/core/dist/cjs/es5/entities/gridOptions';

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
  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // columns
  private _columnsMap: {
    [field: string]: {
      index: number,
      colDef: IV2SpreadsheetEditorExtendedColDef
    }
  } = {};
  private _locationColumns: string[];
  private _columns: V2SpreadsheetEditorColumn[];
  @Input() set columns(columns: V2SpreadsheetEditorColumn[]) {
    // set data
    this._columns = columns;

    // update columns definitions
    this.updateColumnDefinitions();
  }

  // editor
  editor: {
    // location name caching
    locationNamesMap: {
      [locationId: string]: string
    }
  } = {
      locationNamesMap: {}
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
    protected i18nService: I18nService
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
    this._columnsMap = {};
    this._locationColumns = [];
    this.editor.locationNamesMap = {};

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
        cellRenderer: AppSpreadsheetEditorV2CellBasicRendererComponent
      };

      // map
      this._columnsMap[columnKey] = {
        // +1 to jump over row number column
        index: index + 1,
        colDef
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
   * Get context menu
   */
  getContextMenuItems(_params): (string | MenuItemDef)[] {
    // #TODO
    return [];
  }
}
