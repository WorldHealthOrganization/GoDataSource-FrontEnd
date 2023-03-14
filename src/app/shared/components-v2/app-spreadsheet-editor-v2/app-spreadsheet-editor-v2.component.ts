import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewEncapsulation } from '@angular/core';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, V2ActionType } from '../app-list-table-v2/models/action.model';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { ColumnApi } from '@ag-grid-community/core/dist/cjs/es5/columns/columnApi';
import { CellEditingStoppedEvent, GridReadyEvent } from '@ag-grid-community/core';
import {
  IV2SpreadsheetEditorColumnValidatorAsync,
  IV2SpreadsheetEditorColumnValidatorDate,
  IV2SpreadsheetEditorColumnValidatorEmail,
  IV2SpreadsheetEditorColumnValidatorInteger,
  IV2SpreadsheetEditorColumnValidatorRequired,
  IV2SpreadsheetEditorEventData, IV2SpreadsheetEditorEventDataLocation,
  IV2SpreadsheetEditorHandler,
  V2SpreadsheetEditorColumn,
  V2SpreadsheetEditorColumnType,
  V2SpreadsheetEditorColumnTypeToEditor,
  V2SpreadsheetEditorEventType
} from './models/column.model';
import { IV2SpreadsheetEditorExtendedColDef, IV2SpreadsheetEditorExtendedColDefEditor, IV2SpreadsheetEditorExtendedColDefEditorError, IV2SpreadsheetEditorExtendedColDefEditorSelectionRange } from './models/extended-column.model';
import { AppSpreadsheetEditorV2CellBasicRendererComponent } from './components/cell-basic-renderer/app-spreadsheet-editor-v2-cell-basic-renderer.component';
import * as moment from 'moment';
import { Moment } from 'moment';
import { AppSpreadsheetEditorV2CellBasicHeaderComponent } from './components/header-basic/app-spreadsheet-editor-v2-cell-basic-header.component';
import { AppSpreadsheetEditorV2CellRowNoRendererComponent } from './components/cell-row-no-renderer/app-spreadsheet-editor-v2-cell-row-no-renderer.component';
import { NewValueParams, SuppressHeaderKeyboardEventParams, SuppressKeyboardEventParams } from '@ag-grid-community/core/dist/cjs/es5/entities/colDef';
import { IV2SpreadsheetEditorChangeValues, V2SpreadsheetEditorChange, V2SpreadsheetEditorChangeType } from './models/change.model';
import { Observable, of, Subscription, switchMap, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { AppSpreadsheetEditorV2LoadingComponent } from './components/loading/app-spreadsheet-editor-v2-loading.component';
import { AppSpreadsheetEditorV2NoDataComponent } from './components/no-data/app-spreadsheet-editor-v2-no-data.component';
import * as _ from 'lodash';
import { CreateViewModifyV2Action } from '../app-create-view-modify-v2/models/action.model';
import { TranslateService } from '@ngx-translate/core';
import { AppFormBaseErrorMsgV2, AppFormBaseErrorMsgV2Type } from '../../forms-v2/core/app-form-base-error-msg-v2';
import { AppBasicPageV2Component } from '../app-basic-page-v2/app-basic-page-v2.component';
import { Constants } from '../../../core/models/constants';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IV2SpreadsheetEditorEventSave } from './models/event.model';
import { LocationDataService } from '../../../core/services/data/location.data.service';
import { RequestQueryBuilder } from '../../../core/helperClasses/request-query-builder';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputNumber, V2SideDialogConfigInputType } from '../app-side-dialog-v2/models/side-dialog-config.model';
import { IV2BottomDialogConfigButtonType } from '../app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { IV2SpreadsheetEditorSelectedMatrix } from './models/selected.model';
import { IRowNode } from '@ag-grid-community/core/dist/cjs/es5/interfaces/iRowNode';

/**
 * Component
 */
@Component({
  selector: 'app-spreadsheet-editor-v2',
  templateUrl: './app-spreadsheet-editor-v2.component.html',
  styleUrls: ['./app-spreadsheet-editor-v2.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppSpreadsheetEditorV2Component implements OnInit, OnDestroy {
  // max number of ms until outside leave is consider mouse out
  private static readonly DEFAULT_CREATE_RECORDS_ROW_NO = 20;
  private static readonly HOVER_OUTSIDE_LIMIT_UNTIL_MOUSE_OUT: number = 500;
  private static readonly MAX_UNDO_TO_KEEP: number = 100;

  // elements
  @ViewChild('cellContextMenu', { static: true }) set cellContextMenu(cellContextMenu: TemplateRef<any>) {
    this.editor.cellContextMenu = cellContextMenu;
  }

  // basic page
  @ViewChild(AppBasicPageV2Component, { static: true }) basicPage: AppBasicPageV2Component;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // create or modify ?
  @Input() set action(action: CreateViewModifyV2Action.CREATE | CreateViewModifyV2Action.MODIFY) {
    // set action
    this.editor.action = action;

    // if create generate new records
    if (this.editor.action === CreateViewModifyV2Action.CREATE) {
      // create
      const records: any[] = [];
      for (let i = 0; i < AppSpreadsheetEditorV2Component.DEFAULT_CREATE_RECORDS_ROW_NO; i++) {
        records.push(this.newRecord());
      }

      // finished
      this.records$ = of(records);
    }
  }

  // columns
  private _locationColumns: string[];
  private _columns: V2SpreadsheetEditorColumn[];
  @Input() set columns(columns: V2SpreadsheetEditorColumn[]) {
    // set data
    this._columns = (columns || [])
      .filter((column) => column.visible === undefined || column.visible);

    // update columns definitions
    this.updateColumnDefinitions();
  }
  get columns(): V2SpreadsheetEditorColumn[] {
    return this._columns;
  }

  // rows data
  private _recordsSubscription: Subscription;
  private _records$: Observable<any[]>;
  @Input() set records$(records$: Observable<any[]>) {
    // set the new observable
    this._records$ = records$;

    // retrieve data
    this.retrieveData();
  }

  // Used to generate a new record
  @Input() newRecord: () => any;

  // save
  @Output() save: EventEmitter<IV2SpreadsheetEditorEventSave> = new EventEmitter<IV2SpreadsheetEditorEventSave>();

  // keep changes
  changes: V2SpreadsheetEditorChange[] = [];
  changesIndex: number = 0;

  // editor
  editor: IV2SpreadsheetEditorExtendedColDefEditor = {
    // setup
    action: undefined,

    // elements
    cellContextMenu: undefined,

    // columns map
    columnsMap: {},

    // location
    locationsMap: {},

    // invalid
    invalid: {
      rows: {}
    },

    // async request
    async: {
      inProgress: false,
      rows: {}
    },
    asyncResponses: {
      rows: {}
    },

    // has data
    hasData: {
      rows: {}
    },

    // readonly
    readonly: {
      rows: {}
    },

    // selection range handlers
    selection: {
      // data
      selected: {
        collecting: undefined,
        previousCollecting: undefined,
        outTime: undefined,
        fill: undefined,
        ranges: []
      },

      // events
      cell: {
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
        },
        mouseUp: () => {
          this.cellMouseUp();
        },
        mouseLeave: () => {
          this.cellMouseLeave();
        },
        fill: () => {
          this.cellFill();
        }
      },
      header: {
        left: {
          mouseDown: (
            row,
            ctrlKey,
            shiftKey
          ) => {
            this.rowNoMouseDown(
              row,
              ctrlKey,
              shiftKey
            );
          },
          mouseEnter: (
            row,
            primaryButtonStillDown
          ) => {
            this.rowNoMouseEnter(
              row,
              primaryButtonStillDown
            );
          },
          mouseUp: () => {
            this.rowNoMouseUp();
          },
          mouseLeave: () => {
            this.rowNoMouseLeave();
          }
        },
        top: {
          mouseDown: (
            column,
            ctrlKey,
            shiftKey
          ) => {
            this.headerMouseDown(
              column,
              ctrlKey,
              shiftKey
            );
          },
          mouseEnter: (
            column,
            primaryButtonStillDown
          ) => {
            this.headerMouseEnter(
              column,
              primaryButtonStillDown
            );
          },
          mouseUp: () => {
            this.headerMouseUp();
          },
          mouseLeave: () => {
            this.headerMouseLeave();
          }
        }
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
        this.saveRecords();
      }
    },
    disable: () => {
      return this.editor.async.inProgress;
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
    retrieveData?: true,
    updateColumnDefinitions?: true
  } = {};

  // timers
  timerCellSelectFocused: any;
  waitForAsyncToFinish: any;

  // constants
  AppSpreadsheetEditorV2LoadingComponent = AppSpreadsheetEditorV2LoadingComponent;
  AppSpreadsheetEditorV2NoDataComponent = AppSpreadsheetEditorV2NoDataComponent;
  CreateViewModifyV2Action = CreateViewModifyV2Action;

  // async in progress ?
  actionButtonLoading: () => boolean = () => {
    return this.editor.async.inProgress;
  };

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected translateService: TranslateService,
    protected elementRef: ElementRef,
    protected toastV2Service: ToastV2Service,
    protected dialogV2Service: DialogV2Service,
    protected locationDataService: LocationDataService
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
    this.stopGetRecords();

    // stop async request
    this.stopAsyncRequests();

    // stop timers - cellSelectFocused
    if (this.timerCellSelectFocused) {
      clearTimeout(this.timerCellSelectFocused);
      this.timerCellSelectFocused = undefined;
    }

    // stop timers - waitForAsyncToFinish
    this.stopWaitForAsyncToFinish();

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
   * Stop retrieving data
   */
  private stopGetRecords(): void {
    // stop retrieving data
    if (this._recordsSubscription) {
      this._recordsSubscription.unsubscribe();
      this._recordsSubscription = undefined;
    }
  }

  /**
   * Stop async requests
   */
  private stopAsyncRequests(): void {
    // stop requests
    for (const rowIndex in this.editor.async.rows) {
      // stop subscriptions
      for (const columnIndex in this.editor.async.rows[rowIndex].columns) {
        this.editor.async.rows[rowIndex].columns[columnIndex].subscription.unsubscribe();
      }

      // cleanup
      delete this.editor.async.rows[rowIndex];
    }

    // nothing in progress anymore
    this.editor.async.inProgress = false;
    this.editor.asyncResponses = {
      rows: {}
    };
  }

  /**
   * Retrieve data
   */
  private retrieveData(): void {
    // clear
    this.editor.locationsMap = {};
    this.editorClearSelected();
    this.editorClearInvalid();
    this.editorClearReadonly();
    this.editorClearHasData();

    // stop async request
    this.stopAsyncRequests();

    // ag table not initialized ?
    if (!this._agTable) {
      // call later
      this._callWhenReady.retrieveData = true;

      // finished
      return;
    }

    // already called
    delete this._callWhenReady.retrieveData;

    // nothing to do ?
    if (!this._records$) {
      // reset data
      this._agTable.api.setRowData([]);
      this._agTable.api.hideOverlay();

      // re-render page
      this.detectChanges();

      // finished
      return;
    }

    // cancel previous one
    this.stopGetRecords();

    // retrieve data
    this._agTable.api.showLoadingOverlay();
    this._recordsSubscription = this._records$
      .pipe(
        // retrieve locations
        switchMap((data) => {
          // nothing to retrieve ?
          if (
            !this._locationColumns?.length ||
            !data.length
          ) {
            return of(data);
          }

          // determine locations that we need to retrieve
          const locationIdsMap: {
            [locationId: string]: true
          } = {};
          this._locationColumns.forEach((field) => {
            data.forEach((item) => {
              // get location id
              const locationId: string = _.get(
                item,
                field
              );

              // nothing to do ?
              if (!locationId) {
                return;
              }

              // attach to list of locations ids to retrieve
              locationIdsMap[locationId] = true;
            });
          });

          // nothing to retrieve ?
          const locationIds: string[] = Object.keys(locationIdsMap);
          if (locationIds.length < 1) {
            return of(data);
          }

          // construct location query
          const qb: RequestQueryBuilder = new RequestQueryBuilder();

          // we need just some fields
          qb.fields(
            'id',
            'name',
            'synonyms',
            'geoLocation'
          );

          // retrieve locations that we need
          qb.filter.bySelect(
            'id',
            locationIds,
            false,
            null
          );

          // retrieve locations
          return this.locationDataService
            .getLocationsList(qb)
            .pipe(map((locations) => {
              // map locations
              locations.forEach((location) => {
                this.editor.locationsMap[location.id] = {
                  id: location.id,
                  geoLocation: location.geoLocation,
                  label: location.name + (
                    location.synonyms?.length < 1 ?
                      '' :
                      ` ( ${location.synonymsAsString} )`
                  ),
                  name: location.name
                };
              });

              // finished
              return data;
            }));
        }),

        // handle error
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe((data) => {
        // finished
        this._recordsSubscription = undefined;

        // must always have an array
        data = data || [];

        // set data & hide loading overlay
        this._agTable.api.setRowData(data);

        // unselect everything
        this._agTable.api.deselectAll();

        // re-render page
        this.detectChanges();

        // validate all rows
        this.validateAllRows();

        // make cells read-only
        // #TODO

        // select first cell
        // - fix for first render issue (necessary to render css properly from this.validateAllRows)
        if (
          this.editor.action === CreateViewModifyV2Action.MODIFY &&
          data.length > 0
        ) {
          // start edit
          this._agTable.api.startEditingCell({
            rowIndex: 0,
            colKey: this.columns[0].field
          });

          // cancel edit
          this._agTable.api.stopEditing(true);
        }
      });
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

    // call methods to finish setup - retrieveData
    if (this._callWhenReady.retrieveData) {
      // call
      this.retrieveData();
    }

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
    this.editor.columnsMap = {};
    this._locationColumns = [];
    this.editorClearSelected();
    this.editorClearInvalid();
    this.editorClearReadonly();
    this.editorClearHasData();

    // stop async request
    this.stopAsyncRequests();

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
      field: AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO,
      resizable: false,
      suppressMovable: true,
      suppressFillHandle: true,
      suppressPaste: true,
      suppressNavigable: true,
      editable: false,
      pinned: 'left',
      width: 50,
      cellClass: 'gd-spreadsheet-editor-row-no',
      editor: this.editor,
      cellRenderer: AppSpreadsheetEditorV2CellRowNoRendererComponent,
      cellStyle: {
        padding: '0',
        border: 'none'
      },
      headerComponent: AppSpreadsheetEditorV2CellBasicHeaderComponent,
      suppressKeyboardEvent: (params): boolean => {
        return this.suppressKeyboardEvent(params);
      },
      suppressHeaderKeyboardEvent: (params): boolean => {
        return this.suppressKeyboardEvent(params);
      }
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
          this.translateService.instant(column.label) :
          '',
        field: column.field,
        resizable: true,
        suppressMovable: true,
        editable: (params): boolean => {
          return params.colDef.field !== AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO &&
            !this.editor.readonly.rows[params.node.rowIndex]?.columns[this.editor.columnsMap[params.colDef.field].index];
        },
        cellEditor: V2SpreadsheetEditorColumnTypeToEditor[column.type].type,
        cellEditorParams: column.editor?.params,
        columnDefinition: column,
        editor: this.editor,
        cellRenderer: AppSpreadsheetEditorV2CellBasicRendererComponent,
        cellStyle: {
          padding: '0',
          border: 'none'
        },
        headerComponent: AppSpreadsheetEditorV2CellBasicHeaderComponent,
        suppressKeyboardEvent: (params): boolean => {
          return this.suppressKeyboardEvent(params);
        },
        suppressHeaderKeyboardEvent: (params): boolean => {
          return this.suppressKeyboardEvent(params);
        },
        onCellValueChanged: (event) => {
          this.cellValueChanged(event);
        },
        valueGetter: (params): any => {
          return _.get(
            params.data,
            params.column.getUserProvidedColDef().field
          );
        },
        valueSetter: (params) => {
          // set value
          _.set(
            params.data,
            params.column.getUserProvidedColDef().field,
            params.newValue
          );

          // finished
          return true;
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
   * Clear selected
   */
  private editorClearSelected(): void {
    // clear
    this.editor.selection.selected = {
      collecting: undefined,
      previousCollecting: undefined,
      outTime: undefined,
      fill: undefined,
      ranges: []
    };
  }

  /**
   * Clear invalid
   */
  private editorClearInvalid(): void {
    // clear
    this.editor.invalid = {
      rows: {}
    };
  }

  /**
   * Clear readonly
   */
  private editorClearReadonly(): void {
    // clear
    this.editor.readonly = {
      rows: {}
    };
  }

  /**
   * Clear has data
   */
  private editorClearHasData(): void {
    // clear
    this.editor.hasData = {
      rows: {}
    };
  }

  /**
   * Actual merge
   */
  private cellActualMergeRanges(): boolean {
    // if a merge was done then we might need to readjust other ranges too
    let atLeastOneMerge: boolean = false;
    let merged: boolean = true;
    while (merged) {
      // reset
      merged = false;

      // merge ranges if need be
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
            atLeastOneMerge = true;
            break;
          }
        }

        // must start again ?
        if (merged) {
          break;
        }
      }
    }

    // finish
    return atLeastOneMerge;
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

        // this.editor.selection.selected.previousCollecting.startingPoint should remain as it is, since that should be the point of entry

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
      // merge ranges
      if (this.cellActualMergeRanges()) {
        // remove intersections
        // - split into multiple ranges
        // - Microsoft Excel doesn't do it, so we will keep overlapping selections too

        // if we merged the collecting range then we need to update previous
        // - can't continue from previous one
        this.editor.selection.selected.previousCollecting = undefined;
      }
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

    // fill ?
    if (this.editor.selection.selected.fill) {
      this.fillCells();
    } else {
      // merge ranges with collecting one if necessary
      this.cellMergeRanges();
    }

    // cleanup
    this.editor.selection.selected.collecting = undefined;
    this.editor.selection.selected.outTime = undefined;
    this.editor.selection.selected.fill = undefined;

    // update css
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Copy values
   */
  private fillCells(): void {
    // nothing to do ?
    if (
      !this.editor.selection.selected.fill ||
      !this.editor.selection.selected.collecting
    ) {
      return;
    }

    // go through collecting values and fill
    const start: number = this.editor.selection.selected.collecting.range.rows.start < this.editor.selection.selected.fill.rows.start ?
      this.editor.selection.selected.collecting.range.rows.start :
      this.editor.selection.selected.fill.rows.end + 1;
    const end: number = this.editor.selection.selected.collecting.range.rows.end >= this.editor.selection.selected.fill.rows.end ?
      this.editor.selection.selected.collecting.range.rows.end :
      this.editor.selection.selected.fill.rows.start - 1;
    const lastRowIndex: number = this._agTable.api.getDisplayedRowCount() - 1;
    if (
      start >= 0 &&
      start <= lastRowIndex &&
      end >= 0 &&
      end <= lastRowIndex
    ) {
      // go through rows and update with selected fill data
      // +1 since %n is 0
      const change: IV2SpreadsheetEditorChangeValues = {
        type: V2SpreadsheetEditorChangeType.VALUES,
        changes: {
          rows: {}
        }
      };
      const rowsThatWeCanCopy: number = 1 + this.editor.selection.selected.fill.rows.end - this.editor.selection.selected.fill.rows.start;
      const rowsToCopyInto: number = 1 + end - start;
      const reverse: boolean = start < this.editor.selection.selected.fill.rows.start;
      for (let rowIndex: number = start; rowIndex <= end; rowIndex++) {
        // initialize change row
        change.changes.rows[rowIndex] = {
          columns: {}
        };

        // determine row from which we should copy data
        const copyFromRowIndex: number = (
          reverse ?
            (((rowsThatWeCanCopy - rowsToCopyInto) + (rowIndex - start)) % rowsThatWeCanCopy) :
            ((rowIndex - start) % rowsThatWeCanCopy)
        ) + this.editor.selection.selected.fill.rows.start;
        const copyFromRowData = this._agTable.api.getDisplayedRowAtIndex(copyFromRowIndex).data;

        // retrieve row data
        const rowData: {
          [prop: string]: any
        } = this._agTable.api.getDisplayedRowAtIndex(rowIndex).data;

        // go through columns
        for (let columnIndex: number = this.editor.selection.selected.fill.columns.start; columnIndex <= this.editor.selection.selected.fill.columns.end; columnIndex++) {
          // if readonly - ignore
          if (this.editor.readonly.rows[rowIndex]?.columns[columnIndex]) {
            continue;
          }

          // determine value
          // -1 because we need to exclude row no column which isn't in this.columns
          const columnField: string = this.columns[columnIndex - 1].field;
          const value = _.get(
            copyFromRowData,
            columnField
          );

          // same value - ignore ?
          const oldValue: any = _.get(
            rowData,
            columnField
          );
          if (oldValue === value) {
            continue;
          }

          // remember previous value
          change.changes.rows[rowIndex].columns[columnIndex] = {
            old: oldValue,
            new: value
          };

          // update data
          _.set(
            rowData,
            columnField,
            value
          );

          // trigger events
          this.cellTriggerEvents(
            rowIndex,
            columnField,
            V2SpreadsheetEditorEventType.CHANGE,
            change
          );
        }

        // validate
        this.rowValidate(rowIndex);
      }

      // add change to list of changes
      this.cellAppendChange(change);

      // refresh
      this._agTable.api.refreshCells({
        force: false,
        suppressFlash: false
      });
    }
  }

  /**
   * Add proper css classes
   */
  private cellProcessRange(range: IV2SpreadsheetEditorExtendedColDefEditorSelectionRange): void {
    // header
    for (let columnIndex: number = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
      // full header or partial selection ?
      const headerHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-header-${columnIndex}`);
      if (headerHtml) {
        if (
          range.rows.start === 0 &&
          range.rows.end === this._agTable.api.getDisplayedRowCount() - 1
        ) {
          // full header
          headerHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-header-selected-full');
        } else {
          // partial header
          headerHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-header-selected-partial');
        }
      }
    }

    // rows
    for (let rowIndex: number = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
      // full row or partial selection ?
      const rowNoHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-row-no-renderer-${rowIndex}`);
      if (rowNoHtml) {
        if (
          range.columns.start === 1 &&
          range.columns.end === this.columns.length
        ) {
          // full row
          rowNoHtml.classList.add('gd-spreadsheet-editor-v2-cell-row-no-renderer-selected-full');
        } else {
          // partial row
          rowNoHtml.classList.add('gd-spreadsheet-editor-v2-cell-row-no-renderer-selected-partial');
        }
      }

      // attach cell css
      for (let columnIndex: number = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
        // retrieve cell html
        const cellHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-${rowIndex}-${columnIndex}`);

        // scrolled and not visible anymore ?
        if (!cellHtml) {
          continue;
        }

        // make it visible
        cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-visible');

        // fill ?
        if (
          this.editor.selection.selected.fill &&
          this.editor.selection.selected.collecting &&
          range === this.editor.selection.selected.collecting.range &&
          (
            rowIndex < this.editor.selection.selected.fill.rows.start ||
            rowIndex > this.editor.selection.selected.fill.rows.end
          )
        ) {
          cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-selected-fill');
        }

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
   * Render remaining stuff other than selected range
   */
  private cellProcessRemaining(showFillIfPossible: boolean): void {
    // invalid cells
    let invalidRows: string = '';
    for (const rowIndex in this.editor.invalid.rows) {
      // cell
      let invalidHtml;
      let invalidFields: string = '';
      for (const columnIndex in this.editor.invalid.rows[rowIndex].columns) {
        // put field in list of invalid fields
        // -1 because row no doesn't exist in this.columns
        invalidFields += (invalidFields ? ', ' : '') +
          this.translateService.instant(this.columns[parseInt(columnIndex, 10) - 1].label);

        // mark cell as invalid
        invalidHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-${rowIndex}-${columnIndex}`);
        if (invalidHtml) {
          // add invalid class
          invalidHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-invalid');

          // add error message
          if (this.editor.invalid.rows[rowIndex].columns[columnIndex].error?.key) {
            invalidHtml.title = AppFormBaseErrorMsgV2.msg(
              this.translateService,
              this.editor.invalid.rows[rowIndex].columns[columnIndex].error.key,
              this.editor.invalid.rows[rowIndex].columns[columnIndex].error.data
            );
          }
        }
      }

      // invalid rows
      invalidRows += (invalidRows ? ', ' : '') +
        (parseInt(rowIndex, 10) + 1);

      // row no
      invalidHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-row-no-renderer-${rowIndex}`);
      if (invalidHtml) {
        // add invalid class
        invalidHtml.classList.add('gd-spreadsheet-editor-v2-cell-row-no-renderer-invalid');

        // add error message
        invalidHtml.title = this.translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_INVALID_COLUMNS', {
            fields: invalidFields
          }
        );
      }
    }

    // announce that we have invalid rows
    if (invalidRows) {
      const headerHtml = document.getElementById('gd-spreadsheet-editor-v2-cell-basic-header-0');
      if (headerHtml) {
        // add invalid class
        headerHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-header-invalid');

        // add error message
        headerHtml.title = this.translateService.instant(
          'LNG_FORM_VALIDATION_ERROR_INVALID_ROWS', {
            rows: invalidRows
          }
        );
      }
    }

    // readonly cells
    for (const rowIndex in this.editor.readonly.rows) {
      for (const columnIndex in this.editor.readonly.rows[rowIndex].columns) {
        const invalidHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-${rowIndex}-${columnIndex}`);
        if (invalidHtml) {
          invalidHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-readonly');
        }
      }
    }

    // focused cell
    const focusedCell = this._agTable.api.getFocusedCell();
    if (
      focusedCell &&
      !this.editor.selection.selected.collecting
    ) {
      // determine if selectable column
      const columnField: string = focusedCell.column.getUserProvidedColDef().field;
      if (columnField !== AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO) {
        const columnIndex: number = this.editor.columnsMap[columnField].index;
        const focusedHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-${focusedCell.rowIndex}-${columnIndex}`);
        if (focusedHtml) {
          focusedHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-focused');
        }
      }
    }

    // display fill ?
    // - only after we finish selecting
    // - only if just one selection (similar to Microsoft Excel)
    if (
      showFillIfPossible &&
      this.editor.selection.selected.ranges.length === 1
    ) {
      // find cell
      const cellHtml = document.getElementById(`gd-spreadsheet-editor-v2-cell-basic-renderer-fill-${this.editor.selection.selected.ranges[0].rows.end}-${this.editor.selection.selected.ranges[0].columns.end}`);

      // scrolled and not visible anymore ?
      if (cellHtml) {
        cellHtml.classList.add('gd-spreadsheet-editor-v2-cell-basic-renderer-fill-visible');
      }
    }
  }

  /**
   * Update css
   */
  private cellUpdateRangeClasses(showFillIfPossible: boolean): void {
    // remove main cells classes
    const cellHtmlElements = this.elementRef.nativeElement.getElementsByClassName('gd-spreadsheet-editor-v2-cell-basic-renderer');
    for (let elementIndex = 0; elementIndex < cellHtmlElements.length; elementIndex++) {
      // class cleanup
      cellHtmlElements[elementIndex].classList.remove(
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-visible',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-left',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-right',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-top',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-border-bottom',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-selected-fill',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-focused',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-invalid',
        'gd-spreadsheet-editor-v2-cell-basic-renderer-readonly'
      );

      // error message cleanup
      cellHtmlElements[elementIndex].title = '';
    }

    // remove main row no cells classes
    const rowNoHtmlElements = this.elementRef.nativeElement.getElementsByClassName('gd-spreadsheet-editor-v2-cell-row-no-renderer');
    for (let elementIndex = 0; elementIndex < rowNoHtmlElements.length; elementIndex++) {
      // class cleanup
      rowNoHtmlElements[elementIndex].classList.remove(
        'gd-spreadsheet-editor-v2-cell-row-no-renderer-invalid',
        'gd-spreadsheet-editor-v2-cell-row-no-renderer-selected-partial',
        'gd-spreadsheet-editor-v2-cell-row-no-renderer-selected-full'
      );

      // error message cleanup
      rowNoHtmlElements[elementIndex].title = '';
    }

    // remove full / partial from headers
    const headerHtmlElements = this.elementRef.nativeElement.getElementsByClassName('gd-spreadsheet-editor-v2-cell-basic-header');
    for (let elementIndex = 0; elementIndex < headerHtmlElements.length; elementIndex++) {
      // class cleanup
      headerHtmlElements[elementIndex].classList.remove(
        'gd-spreadsheet-editor-v2-cell-basic-header-selected-partial',
        'gd-spreadsheet-editor-v2-cell-basic-header-selected-full',
        'gd-spreadsheet-editor-v2-cell-basic-header-invalid'
      );

      // error message cleanup
      headerHtmlElements[elementIndex].title = '';
    }

    // hide previous fills
    const fillHtmlElements = this.elementRef.nativeElement.getElementsByClassName('gd-spreadsheet-editor-v2-cell-basic-renderer-fill');
    for (let elementIndex = 0; elementIndex < fillHtmlElements.length; elementIndex++) {
      fillHtmlElements[elementIndex].classList.remove('gd-spreadsheet-editor-v2-cell-basic-renderer-fill-visible');
    }

    // render already selected ranges
    this.editor.selection.selected.ranges.forEach((range) => {
      this.cellProcessRange(range);
    });

    // update cell classes for currently collecting
    if (this.editor.selection.selected.collecting) {
      this.cellProcessRange(this.editor.selection.selected.collecting.range);
    }

    // render stuff not related to ranges
    this.cellProcessRemaining(showFillIfPossible);
  }

  /**
   * Range - mouse down
   */
  private rangeMouseDown(
    rows: {
      start: number,
      end: number
    },
    columns: {
      start: number,
      end: number
    },
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

      // update previous
      this.editor.selection.selected.collecting.range.rows = {
        start: rows.start < this.editor.selection.selected.collecting.startingPoint.row ?
          rows.start :
          this.editor.selection.selected.collecting.startingPoint.row,
        end: rows.end > this.editor.selection.selected.collecting.startingPoint.row ?
          rows.end :
          this.editor.selection.selected.collecting.startingPoint.row
      };
      this.editor.selection.selected.collecting.range.columns = {
        start: columns.start < this.editor.selection.selected.collecting.startingPoint.column ?
          columns.start :
          this.editor.selection.selected.collecting.startingPoint.column,
        end: columns.end > this.editor.selection.selected.collecting.startingPoint.column ?
          columns.end :
          this.editor.selection.selected.collecting.startingPoint.column
      };
    } else {
      // clean start
      this.editor.selection.selected.collecting = {
        startingPoint: {
          row: rows.start,
          column: columns.start
        },
        range: {
          rows,
          columns
        }
      };
    }

    // update css
    this.cellUpdateRangeClasses(false);
  }

  /**
   * Range - mouse enter
   */
  private rangeMouseEnter(
    rows: {
      start: number,
      end: number
    },
    columns: {
      start: number,
      end: number
    },
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
        moment().diff(this.editor.selection.selected.outTime) > AppSpreadsheetEditorV2Component.HOVER_OUTSIDE_LIMIT_UNTIL_MOUSE_OUT
      )
    ) {
      // wrap up
      this.cellFinishCollecting();

      // finished
      return;
    }

    // reset
    this.editor.selection.selected.outTime = undefined;

    // add to range - row start
    if (rows.start < this.editor.selection.selected.collecting.startingPoint.row) {
      this.editor.selection.selected.collecting.range.rows.start = rows.start;
    } else {
      this.editor.selection.selected.collecting.range.rows.start = this.editor.selection.selected.collecting.startingPoint.row;
    }

    // add to range - row end
    if (rows.end > this.editor.selection.selected.collecting.startingPoint.row) {
      this.editor.selection.selected.collecting.range.rows.end = rows.end;
    } else {
      this.editor.selection.selected.collecting.range.rows.end = this.editor.selection.selected.collecting.startingPoint.row;
    }

    // filling allows only row changes
    if (!this.editor.selection.selected.fill) {
      // add to range - column start
      if (columns.start < this.editor.selection.selected.collecting.startingPoint.column) {
        this.editor.selection.selected.collecting.range.columns.start = columns.start;
      } else {
        this.editor.selection.selected.collecting.range.columns.start = this.editor.selection.selected.collecting.startingPoint.column;
      }

      // add to range - column end
      if (columns.end > this.editor.selection.selected.collecting.startingPoint.column) {
        this.editor.selection.selected.collecting.range.columns.end = columns.end;
      } else {
        this.editor.selection.selected.collecting.range.columns.end = this.editor.selection.selected.collecting.startingPoint.column;
      }
    }

    // update css
    this.cellUpdateRangeClasses(false);
  }

  /**
   * Range - mouse up
   */
  private rangeMouseUp(): void {
    // finished
    this.cellFinishCollecting();
  }

  /**
   * Range - mouse leave
   */
  private rangeMouseLeave(): void {
    // are we collecting cells ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // listen for leaving cells zone
    this.editor.selection.selected.outTime = moment();
  }

  /**
   * Cell - mouse down
   */
  private cellMouseDown(
    row: number,
    column: number,
    ctrlKey: boolean,
    shiftKey: boolean
  ): void {
    this.rangeMouseDown(
      {
        start: row,
        end: row
      }, {
        start: column,
        end: column
      },
      ctrlKey,
      shiftKey
    );
  }

  /**
   * Cell - mouse enter
   */
  private cellMouseEnter(
    row: number,
    column: number,
    primaryButtonStillDown: boolean
  ): void {
    this.rangeMouseEnter(
      {
        start: row,
        end: row
      }, {
        start: column,
        end: column
      },
      primaryButtonStillDown
    );
  }

  /**
   * Cell - mouse up
   */
  private cellMouseUp(): void {
    this.rangeMouseUp();
  }

  /**
   * Cell - mouse leave
   */
  private cellMouseLeave(): void {
    this.rangeMouseLeave();
  }

  /**
   * Cell start vertical fill
   */
  private cellFill(): void {
    // nothing to do ?
    if (!this.editor.selection.selected.ranges.length) {
      return;
    }

    // cleanup
    this.editor.selection.selected.previousCollecting = undefined;
    this.editor.selection.selected.outTime = undefined;

    // determine range that we need to use for filling
    this.editor.selection.selected.fill = this.editor.selection.selected.ranges[0];

    // start filling
    this.rangeMouseDown(
      {
        start: this.editor.selection.selected.fill.rows.start,
        end: this.editor.selection.selected.fill.rows.end
      }, {
        start: this.editor.selection.selected.fill.columns.start,
        end: this.editor.selection.selected.fill.columns.end
      },
      // true to create another range
      true,
      false
    );
  }

  /**
   * Validate cell
   */
  private rowValidate(rowIndex: number): void {
    // retrieve row data
    const rowData = this._agTable.api.getDisplayedRowAtIndex(rowIndex).data;

    // go through columns
    const invalidColumnIndexes: {
      columnIndex: number,
      error: IV2SpreadsheetEditorExtendedColDefEditorError
    }[] = [];
    let rowHasColumnData: boolean = this.editor.action === CreateViewModifyV2Action.MODIFY;
    for (let columnIndex = 0; columnIndex < this.columns.length; columnIndex++) {
      // +1 to take in account row no column
      const realColumnIndex: number = columnIndex + 1;

      // retrieve column & cell data
      const column = this.columns[columnIndex];
      const cellData = _.get(
        rowData,
        column.field
      );

      // found gold ?
      if (
        cellData !== null &&
        cellData !== undefined &&
        cellData !== ''
      ) {
        rowHasColumnData = true;
      }

      // validate cell
      let isValid: boolean = true;
      let error: IV2SpreadsheetEditorExtendedColDefEditorError;

      // validate - required
      if (
        isValid &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorRequired)?.required &&
        !cellData &&
        cellData !== 0 &&
        cellData !== false &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorRequired).required(rowData)
      ) {
        isValid = false;
        error = {
          key: AppFormBaseErrorMsgV2Type.REQUIRED
        };
      }

      // validate - integer
      if (
        isValid &&
        cellData &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorInteger)?.integer
      ) {
        // number validation
        isValid = typeof cellData === 'number' &&
          /^-?[0-9.]+$/.test(cellData.toString());

        // not integer ?
        if (!isValid) {
          error = {
            key: AppFormBaseErrorMsgV2Type.INTEGER
          };
        } else {
          // column setup
          const integerConf = (column.validators as IV2SpreadsheetEditorColumnValidatorInteger)?.integer(rowData);

          // min
          isValid = integerConf.min === undefined || cellData >= integerConf.min;
          if (!isValid) {
            error = {
              key: AppFormBaseErrorMsgV2Type.MIN_NUMBER,
              data: {
                min: integerConf.min
              }
            };
          } else {
            // max
            isValid = integerConf.max === undefined || cellData <= integerConf.max;
            if (!isValid) {
              error = {
                key: AppFormBaseErrorMsgV2Type.MAX_NUMBER,
                data: {
                  max: integerConf.max
                }
              };
            }
          }
        }
      }

      // validate - async
      if (
        isValid &&
        cellData &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorAsync)?.async
      ) {
        // did we already validate this ?
        if (
          this.editor.asyncResponses.rows[rowIndex]?.columns[realColumnIndex] &&
          this.editor.asyncResponses.rows[rowIndex]?.columns[realColumnIndex][cellData]
        ) {
          // validate
          const response = this.editor.asyncResponses.rows[rowIndex]?.columns[realColumnIndex][cellData];
          if (typeof response === 'boolean') {
            if (!response) {
              isValid = false;
              error = {
                key: AppFormBaseErrorMsgV2Type.GENERAL_ASYNC,
                data: {
                  err: 'LNG_FORM_VALIDATION_ERROR_GENERAL_ASYNC'
                }
              };
            }
          } else {
            if (!response.isValid) {
              isValid = false;
              error = {
                key: AppFormBaseErrorMsgV2Type.GENERAL_ASYNC,
                data: {
                  err: response.errMsg,
                  details: response.errMsgData
                }
              };
            }
          }
        } else {
          // stop previous async request
          // +1 to take in account row no column
          if (this.editor.async.rows[rowIndex]?.columns[realColumnIndex]?.subscription) {
            this.editor.async.rows[rowIndex].columns[realColumnIndex].subscription.unsubscribe();
            delete this.editor.async.rows[rowIndex].columns[realColumnIndex];
          }

          // construct async request
          const asyncRequest = (column.validators as IV2SpreadsheetEditorColumnValidatorAsync)?.async(rowData);

          // initialize - row ?
          if (!this.editor.async.rows[rowIndex]) {
            this.editor.async.rows[rowIndex] = {
              columns: {}
            };
          }

          // initialize - column ?
          if (!this.editor.async.rows[rowIndex].columns[realColumnIndex]) {
            this.editor.async.rows[rowIndex].columns[realColumnIndex] = {
              subscription: undefined
            };
          }

          // execute async request
          this.editor.async.inProgress = true;
          this.basicPage.detectChanges();
          this.editor.async.rows[rowIndex].columns[realColumnIndex].subscription = (function(
            // works as long as value is string - visualId ...
            localValue: string,
            localRowIndex: number,
            localColumnIndex: number
          ) {
            return asyncRequest
              .pipe(
                catchError(() => {
                  // resolve as not valid
                  return of(false);
                })
              )
              .subscribe((response) => {
                // stop previous async request
                if (this.editor.async.rows[localRowIndex]?.columns[localColumnIndex]?.subscription) {
                  this.editor.async.rows[localRowIndex].columns[localColumnIndex].subscription.unsubscribe();
                  delete this.editor.async.rows[localRowIndex].columns[localColumnIndex];
                }

                // cleanup
                if (
                  this.editor.async.rows[localRowIndex]?.columns &&
                  Object.keys(this.editor.async.rows[localRowIndex].columns).length < 1
                ) {
                  delete this.editor.async.rows[localRowIndex];
                }

                // finished all async requests ?
                if (Object.keys(this.editor.async.rows).length < 1) {
                  this.editor.async.inProgress = false;
                }

                // set validation for this value
                if (!this.editor.asyncResponses.rows[localRowIndex]) {
                  this.editor.asyncResponses.rows[localRowIndex] = {
                    columns: {}
                  };
                }
                if (!this.editor.asyncResponses.rows[localRowIndex].columns[localColumnIndex]) {
                  this.editor.asyncResponses.rows[localRowIndex].columns[localColumnIndex] = {};
                }
                this.editor.asyncResponses.rows[localRowIndex].columns[localColumnIndex][localValue] = response;

                // update ui buttons
                this.basicPage.detectChanges();

                // validate once again since we have async response
                this.rowValidate(localRowIndex);

                // update css
                this.cellUpdateRangeClasses(true);
              });
          }).call(
            this,
            cellData,
            rowIndex,
            realColumnIndex
          );
        }
      }

      // validate - email
      if (
        isValid &&
        cellData &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorEmail)?.email &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorEmail).email(rowData) &&
        !Constants.REGEX_EMAIL_VALIDATOR.test(cellData)
      ) {
        isValid = false;
        error = {
          key: AppFormBaseErrorMsgV2Type.EMAIL
        };
      }

      // validate - date
      if (
        isValid &&
        cellData &&
        (column.validators as IV2SpreadsheetEditorColumnValidatorDate)?.date
      ) {
        // date validation
        const cellDataMoment: Moment = moment(cellData);
        isValid = cellDataMoment.isValid();

        // not integer ?
        if (!isValid) {
          error = {
            key: AppFormBaseErrorMsgV2Type.INVALID_DATE
          };
        } else {
          // column setup
          const dateConf = (column.validators as IV2SpreadsheetEditorColumnValidatorDate)?.date(rowData);

          // min
          isValid = dateConf.min === undefined || cellDataMoment.isSameOrAfter(moment(dateConf.min));
          if (!isValid) {
            error = {
              key: AppFormBaseErrorMsgV2Type.DATE,
              data: {
                field: moment(dateConf.min).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
                comparator: this.translateService.instant('LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_SAME_OR_AFTER')
              }
            };
          } else {
            // max
            isValid = dateConf.max === undefined || cellDataMoment.isSameOrBefore(moment(dateConf.max));
            if (!isValid) {
              error = {
                key: AppFormBaseErrorMsgV2Type.DATE,
                data: {
                  field: moment(dateConf.min).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT),
                  comparator: this.translateService.instant('LNG_FORM_VALIDATION_ERROR_DATE_COMPARE_SAME_OR_BEFORE')
                }
              };
            }
          }
        }
      }

      // invalid ?
      if (!isValid) {
        invalidColumnIndexes.push({
          columnIndex: realColumnIndex,
          error
        });
      }

      // cleanup
      if (this.editor.invalid.rows[rowIndex]?.columns[realColumnIndex]) {
        // mark as valid
        delete this.editor.invalid.rows[rowIndex].columns[realColumnIndex];
      }
    }

    // cleanup row
    if (
      this.editor.invalid.rows[rowIndex] &&
      Object.keys(this.editor.invalid.rows[rowIndex].columns).length < 1
    ) {
      delete this.editor.invalid.rows[rowIndex];
    }

    // mark invalid ?
    if (
      rowHasColumnData &&
      invalidColumnIndexes.length > 0
    ) {
      invalidColumnIndexes.forEach((invalidColumn) => {
        // must initialize ?
        if (!this.editor.invalid.rows[rowIndex]) {
          this.editor.invalid.rows[rowIndex] = {
            columns: {}
          };
        }

        // make it invalid
        this.editor.invalid.rows[rowIndex].columns[invalidColumn.columnIndex] = {
          error: invalidColumn.error
        };
      });
    }

    // mark that row has data
    if (rowHasColumnData) {
      this.editor.hasData.rows[rowIndex] = true;
    } else {
      delete this.editor.hasData.rows[rowIndex];
    }
  }

  /**
   * Row no - mouse down
   */
  private rowNoMouseDown(
    row: number,
    ctrlKey: boolean,
    shiftKey: boolean
  ): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseDown(
      {
        start: row,
        end: row
      }, {
        start: 1,
        end: this.columns.length
      },
      ctrlKey,
      shiftKey
    );
  }

  /**
   * Row no - mouse enter
   */
  private rowNoMouseEnter(
    row: number,
    primaryButtonStillDown: boolean
  ): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseEnter(
      {
        start: row,
        end: row
      }, {
        start: 1,
        end: this.columns.length
      },
      primaryButtonStillDown
    );
  }

  /**
   * Row no - mouse up
   */
  private rowNoMouseUp(): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseUp();
  }

  /**
   * Row no - mouse leave
   */
  private rowNoMouseLeave(): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseLeave();
  }

  /**
   * Add rows at the end
   */
  rowAppend(): void {
    // ask how many rows to add
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
        },
        hideInputFilter: true,
        inputs: [{
          type: V2SideDialogConfigInputType.NUMBER,
          name: 'rowsNo',
          placeholder: 'LNG_COMMON_ROWS_NO',
          value: 1,
          validators: {
            required: () => true,
            minMax: () => ({
              min: 1,
              max: 100
            })
          }
        }],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_COMMON_BUTTON_APPLY',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // number of rows
        const noOfRows: number = (response.data.map.rowsNo as IV2SideDialogConfigInputNumber).value;
        const listToAdd: any[] = [];
        for (let index = 0; index < noOfRows; index++) {
          listToAdd.push(this.newRecord());
        }

        // append rows
        this._agTable.api.applyTransaction({
          add: listToAdd
        });

        // validate and redraw css
        this.cellUpdateRangeClasses(true);

        // close dialog
        response.handler.hide();
      });
  }

  /**
   * Delete selected rows
   */
  rowDelete(): void {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length < 1) {
      return;
    }

    // determine rows to delete
    const rowsToDeleteMap: {
      [rowIndex: number]: true
    } = {};
    this.editor.selection.selected.ranges.forEach((range) => {
      for (let rowIndex: number = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
        rowsToDeleteMap[rowIndex] = true;
      }
    });

    // format
    const rowsToDelete: number[] = Object.keys(rowsToDeleteMap)
      .map((rowIndex) => parseInt(rowIndex, 10))
      .sort((a, b) => a - b);

    // ask for confirmation
    this.dialogV2Service
      .showConfirmDialog({
        config: {
          title: {
            get: () => 'LNG_COMMON_LABEL_ATTENTION_REQUIRED'
          },
          message: {
            get: () => 'LNG_DIALOG_CONFIRM_DELETE_SELECTED_ROWS',
            data: () => ({
              rows: rowsToDelete.map((rowIndex) => rowIndex + 1).join(', ')
            })
          }
        }
      })
      .subscribe((response) => {
        // canceled ?
        if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
          // finished
          return;
        }

        // delete
        this._agTable.api.applyTransaction({
          remove: rowsToDelete.map((rowIndex) => this._agTable.api.getDisplayedRowAtIndex(rowIndex).data)
        });

        // cleanup
        this.editorClearSelected();

        // stop async request
        this.stopAsyncRequests();

        // update rows
        const updateRowsIndexes = (
          deleteRowIndex,
          oldRows: {
            [rowIndex: number]: any
          }
        ): {
          [rowIndex: number]: any
        } => {
          // determine new row indexes
          const newRows = {};
          for (const rowIndex in oldRows) {
            // format
            const rowIndexNumber: number = parseInt(rowIndex, 10);

            // if deleted row, just ignore
            if (rowIndexNumber === deleteRowIndex) {
              continue;
            }

            // if smaller just add it as it was
            if (rowIndexNumber < deleteRowIndex) {
              newRows[rowIndex] = oldRows[rowIndex];
              continue;
            }

            // else bigger, we need to update
            newRows[rowIndexNumber - 1] = oldRows[rowIndex];
          }

          // finished
          return newRows;
        };

        // update everything
        // - reverse - start from the end, so we don't need to account for previous changes
        rowsToDelete.reverse();
        rowsToDelete.forEach((deleteRowIndex) => {
          // readonly
          this.editor.readonly.rows = updateRowsIndexes(
            deleteRowIndex,
            this.editor.readonly.rows
          );

          // has data
          this.editor.hasData.rows = updateRowsIndexes(
            deleteRowIndex,
            this.editor.hasData.rows
          );

          // invalid
          this.editor.invalid.rows = updateRowsIndexes(
            deleteRowIndex,
            this.editor.invalid.rows
          );

          // changes
          const oldChanges: V2SpreadsheetEditorChange[] = this.changes;
          this.changes = [];
          this.changesIndex = 0;
          oldChanges.forEach((change) => {
            // not handled for now ?
            // - ignore
            if (change.type !== V2SpreadsheetEditorChangeType.VALUES) {
              return;
            }

            // update rows
            change.changes.rows = updateRowsIndexes(
              deleteRowIndex,
              change.changes.rows
            );

            // empty change ?
            // - ignore
            if (Object.keys(change.changes.rows).length < 1) {
              return;
            }

            // append to changes
            this.cellAppendChange(change);
          });
        });

        // redraw
        this._agTable.api.refreshCells({
          force: true,
          suppressFlash: true
        });

        // redraw ranges
        this.cellUpdateRangeClasses(true);
      });
  }

  /**
   * Header - mouse down
   */
  private headerMouseDown(
    column: number,
    ctrlKey: boolean,
    shiftKey: boolean
  ): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // all columns ?
    if (column === 0) {
      this.rangeMouseDown(
        {
          start: 0,
          end: this._agTable.api.getDisplayedRowCount() - 1
        }, {
          start: 1,
          end: this.columns.length
        },
        ctrlKey,
        shiftKey
      );
    } else {
      this.rangeMouseDown(
        {
          start: 0,
          end: this._agTable.api.getDisplayedRowCount() - 1
        }, {
          start: column,
          end: column
        },
        ctrlKey,
        shiftKey
      );
    }
  }

  /**
   * Header - mouse enter
   */
  private headerMouseEnter(
    column: number,
    primaryButtonStillDown: boolean
  ): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // all columns ?
    if (column === 0) {
      this.rangeMouseEnter(
        {
          start: 0,
          end: this._agTable.api.getDisplayedRowCount() - 1
        }, {
          start: 1,
          end: this.columns.length
        },
        primaryButtonStillDown
      );
    } else {
      this.rangeMouseEnter(
        {
          start: 0,
          end: this._agTable.api.getDisplayedRowCount() - 1
        }, {
          start: column,
          end: column
        },
        primaryButtonStillDown
      );
    }
  }

  /**
   * Header - mouse up
   */
  private headerMouseUp(): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseUp();
  }

  /**
   * Header - mouse leave
   */
  private headerMouseLeave(): void {
    // ignore during filling
    if (this.editor.selection.selected.fill) {
      return;
    }

    // trigger
    this.rangeMouseLeave();
  }

  /**
   * Mouse leave
   */
  gridMouseLeave(): void {
    // end collecting
    this.cellFinishCollecting();
  }

  /**
   * Gird mouse move
   */
  gridMouseMove(_event: MouseEvent): void {
    // nothing to do ?
    if (!this.editor.selection.selected.collecting) {
      return;
    }

    // #TODO
    // left top bottom right
    // console.log(event);
    // this._agTable.api.ensureIndexVisible(this.editor.selection.selected.collecting.range.rows.end + 1);
  }

  /**
   * Convert value to text
   */
  private valueToText(
    value: string | Moment | number | boolean,
    columnField: string
  ): string | number {
    // determine column
    switch (this.editor.columnsMap[columnField].columnDefinition.type) {
      case V2SpreadsheetEditorColumnType.TEXT:
      case V2SpreadsheetEditorColumnType.TEXTAREA:
        // nothing changes here
        return value as string;

      case V2SpreadsheetEditorColumnType.NUMBER:
        // nothing changes here
        return value as number;

      case V2SpreadsheetEditorColumnType.DATE:
        // format
        return value ?
          moment(value as string | Moment).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
          value as string;

      case V2SpreadsheetEditorColumnType.SINGLE_SELECT:
        // label
        return value && this.editor.columnsMap[columnField].columnDefinition.optionsMap[value as string]?.label ?
          this.translateService.instant(this.editor.columnsMap[columnField].columnDefinition.optionsMap[value as string].label) :
          value as string;

      case V2SpreadsheetEditorColumnType.LOCATION:
        // label
        return value && this.editor.locationsMap[value as string] ?
          this.editor.locationsMap[value as string].label :
          value as string;
    }
  }

  /**
   * Cell value changed
   */
  private cellValueChanged(event: NewValueParams): void {
    // nothing to do ?
    const columnField: string = event.column.getUserProvidedColDef().field;
    if (columnField === AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO) {
      return;
    }

    // append to changes for redo
    const change: V2SpreadsheetEditorChange = {
      type: V2SpreadsheetEditorChangeType.VALUES,
      changes: {
        rows: {
          [event.node.rowIndex]: {
            columns: {
              [this.editor.columnsMap[columnField].index]: {
                old: event.oldValue,
                new: event.newValue
              }
            }
          }
        }
      }
    };
    this.cellAppendChange(change);

    // trigger events
    this.cellTriggerEvents(
      event.node.rowIndex,
      columnField,
      V2SpreadsheetEditorEventType.CHANGE,
      change
    );
  }

  /**
   * Cell trigger events
   */
  private cellTriggerEvents(
    rowIndex: number,
    columnField: string,
    eventType: V2SpreadsheetEditorEventType,
    change: V2SpreadsheetEditorChange
  ): void {
    // anything to trigger for this cell ?
    if (
      eventType === V2SpreadsheetEditorEventType.CHANGE &&
      !this.editor.columnsMap[columnField].columnDefinition.change
    ) {
      // no point in creating objects if we don't have anything to do
      return;
    }

    // define handler
    const handler: IV2SpreadsheetEditorHandler = {
      rowValidate: (localRowIndex: number) => {
        this.rowValidate(localRowIndex);
      },
      cellReadonly: (
        localRowIndex: number,
        localColumnIndex: number,
        readonly: boolean
      ) => {
        // set readonly
        if (readonly) {
          // initialize ?
          if (!this.editor.readonly.rows[localRowIndex]) {
            this.editor.readonly.rows[localRowIndex] = {
              columns: {}
            };
          }

          // mark as readonly
          this.editor.readonly.rows[localRowIndex].columns[localColumnIndex] = true;
        } else {
          // cleanup - column
          if (this.editor.readonly.rows[localRowIndex]?.columns[localColumnIndex]) {
            delete this.editor.readonly.rows[localRowIndex].columns[localColumnIndex];
          }

          // cleanup - row
          if (
            this.editor.readonly.rows[localRowIndex] &&
            Object.keys(this.editor.readonly.rows[localRowIndex].columns).length < 1
          ) {
            delete this.editor.readonly.rows[localRowIndex];
          }
        }
      },
      redraw: () => {
        // refresh cells
        this._agTable.api.refreshCells({
          force: false,
          suppressFlash: false
        });

        // redraw ranges
        this.cellUpdateRangeClasses(true);
      },
      addChange: (localChange) => {
        this.cellAppendChange(localChange);
      }
    };

    // define event data
    const eventData: IV2SpreadsheetEditorEventData = {
      rowIndex,
      columnIndex: this.editor.columnsMap[columnField].index,
      rowData: this._agTable.api.getDisplayedRowAtIndex(rowIndex).data,
      handler,
      columnsMap: this.editor.columnsMap,
      locationsMap: this.editor.locationsMap,
      change
    };

    // trigger change
    if (
      eventType === V2SpreadsheetEditorEventType.CHANGE &&
      this.editor.columnsMap[columnField].columnDefinition.change
    ) {
      this.editor.columnsMap[columnField].columnDefinition.change(eventData);
    }
  }

  /**
   * Determine selected matrix
   */
  private cellDetermineSelectedMatrix(): IV2SpreadsheetEditorSelectedMatrix {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length < 1) {
      return {
        minMax: undefined,
        matrix: undefined
      };
    }

    // determine what is selected
    const cellsToCopy: IV2SpreadsheetEditorSelectedMatrix = {
      minMax: undefined,
      matrix: {
        cells: {},
        columns: {}
      }
    };
    this.editor.selection.selected.ranges.forEach((range) => {
      // determine min / max
      if (!cellsToCopy.minMax) {
        cellsToCopy.minMax = {
          rows: {
            min: range.rows.start,
            max: range.rows.end
          },
          columns: {
            min: range.columns.start,
            max: range.columns.end
          }
        };
      } else {
        // update
        cellsToCopy.minMax.rows.min = cellsToCopy.minMax.rows.min < range.rows.start ?
          cellsToCopy.minMax.rows.min :
          range.rows.start;
        cellsToCopy.minMax.rows.max = cellsToCopy.minMax.rows.max > range.rows.end ?
          cellsToCopy.minMax.rows.max :
          range.rows.end;
        cellsToCopy.minMax.columns.min = cellsToCopy.minMax.columns.min < range.columns.start ?
          cellsToCopy.minMax.columns.min :
          range.columns.start;
        cellsToCopy.minMax.columns.max = cellsToCopy.minMax.columns.max > range.columns.end ?
          cellsToCopy.minMax.columns.max :
          range.columns.end;
      }

      // determine copy matrix
      for (let rowIndex = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
        // initialize ?
        if (!cellsToCopy.matrix.cells[rowIndex]) {
          cellsToCopy.matrix.cells[rowIndex] = {};
        }

        // mark cells and columns that we need to copy
        for (let columnIndex = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
          // cell
          cellsToCopy.matrix.cells[rowIndex][columnIndex] = true;

          // column
          cellsToCopy.matrix.columns[columnIndex] = true;
        }
      }
    });

    // finished
    return cellsToCopy;
  }

  /**
   * Get text from cells
   */
  private cellToText(
    raw: boolean,
    flash: boolean,
    newLine: string = '\r\n',
    columnSeparator: string = '\t'
  ): string | undefined {
    // determine what we need to copy
    const cellsToCopy: IV2SpreadsheetEditorSelectedMatrix = this.cellDetermineSelectedMatrix();

    // do we have anything to copy ?
    if (!cellsToCopy.minMax) {
      return undefined;
    }

    // construct text that we need to copy
    let text: string = '';
    for (let rowIndex = cellsToCopy.minMax.rows.min; rowIndex <= cellsToCopy.minMax.rows.max; rowIndex++) {
      // nothing to do on this row ?
      // - copy only if we have something
      if (!cellsToCopy.matrix.cells[rowIndex]) {
        continue;
      }

      // append end of line if necessary
      if (rowIndex !== cellsToCopy.minMax.rows.min) {
        text += newLine;
      }

      // retrieve row node
      const rowNode = this._agTable.api.getDisplayedRowAtIndex(rowIndex);

      // copy row data
      for (let columnIndex = cellsToCopy.minMax.columns.min; columnIndex <= cellsToCopy.minMax.columns.max; columnIndex++) {
        // do we need to copy cell value, append an empty value or jump over it ?
        if (cellsToCopy.matrix.cells[rowIndex][columnIndex]) {
          // columnIndex - 1 to exclude row number column which isn't in this.columns
          const columnField: string = this.columns[columnIndex - 1].field;
          let value: string | Moment | number | boolean = _.get(
            rowNode.data,
            columnField
          );

          // convert date
          if (value instanceof moment) {
            value = (value as Moment).toISOString();
          }

          // do we want text instead of raw value ?
          if (!raw) {
            value = this.valueToText(
              value,
              columnField
            );
          }

          // format data
          value = value === undefined || value == null ?
            '' :
            value;

          // append
          text += columnIndex === cellsToCopy.minMax.columns.min ?
            value :
            `${columnSeparator}${value}`;

          // flash each cell individually ?
          if (flash) {
            this._agTable.api.flashCells({
              rowNodes: [rowNode],
              // +1 because we need to exclude row no column which isn't in this.columns
              columns: [columnField]
            });
          }
        } else if (cellsToCopy.matrix.columns[columnIndex]) {
          // append
          text += columnIndex === cellsToCopy.minMax.columns.min ?
            '' :
            columnSeparator;
        }
      }
    }

    // finished
    return text;
  }

  /**
   * Paste text into cells
   */
  private cellTextToCells(
    text: string,
    columnSeparator: string = '\t'
  ): Observable<void> | void {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length !== 1) {
      return;
    }

    // split text into cell values
    let columnValues: string[][] = text.replace(/\n$/g, '').split('\n')
      .map((line) => line.replace(/\r/g, '').split(columnSeparator));

    // locations
    const firstLabelToLocation: {
      [label: string]: IV2SpreadsheetEditorEventDataLocation
    } = {};
    const firstNameToLocation: {
      [name: string]: IV2SpreadsheetEditorEventDataLocation
    } = {};
    const updateFirstsToLocation = () => {
      Object.values(this.editor.locationsMap).forEach((location) => {
        // only the first one matters - label
        if (!firstLabelToLocation[location.label]) {
          firstLabelToLocation[location.label] = location;
        }

        // only the first one matters - name
        if (!firstNameToLocation[location.name]) {
          firstNameToLocation[location.name] = location;
        }
      });
    };

    // transform locations to array to search through it as a last resort
    updateFirstsToLocation();

    // just one line ?, then we need to duplicate the same value for entire selected range (columnValues.length === 1)
    // - same for just one column (columnValues[0].length === 1)
    // - duplicate values instead of doing many ifs bellow
    const range = this.editor.selection.selected.ranges[0];
    if (columnValues.length === 1) {
      // duplicate
      const oldValues: string[][] = columnValues;
      columnValues = [];
      for (let rowIndex: number = 0; rowIndex <= range.rows.end - range.rows.start; rowIndex++) {
        // add the new row
        columnValues.push([]);

        // duplicate values
        if (oldValues[0].length === 1) {
          for (let columnIndex: number = 0; columnIndex <= range.columns.end - range.columns.start; columnIndex++) {
            // push value
            columnValues[rowIndex].push(oldValues[0][0]);
          }
        } else {
          for (let columnIndex: number = 0; columnIndex < oldValues[0].length; columnIndex++) {
            // push value
            columnValues[rowIndex].push(oldValues[0][columnIndex]);
          }
        }
      }
    }

    // for undo / redo
    const change: IV2SpreadsheetEditorChangeValues = {
      type: V2SpreadsheetEditorChangeType.VALUES,
      changes: {
        rows: {}
      }
    };

    // handle value update
    const updateValue = (
      rowIndex: number,
      columnIndex: number,
      oldValue: any,
      newValue: any,
      rowNode: IRowNode,
      columnDefinition: V2SpreadsheetEditorColumn
    ) => {
      // add to changes
      change.changes.rows[rowIndex].columns[columnIndex] = {
        old: oldValue,
        new: newValue
      };

      // paste value
      _.set(
        rowNode.data,
        columnDefinition.field,
        newValue
      );
    };

    // start pasting
    const locationsToRetrieve: {
      [key: string]: {
        rowIndex: number,
        columnIndex: number
      }[]
    } = {};
    for (let rowIndex: number = range.rows.start; rowIndex < range.rows.start + columnValues.length; rowIndex++) {
      // retrieve row node
      const rowNode = this._agTable.api.getDisplayedRowAtIndex(rowIndex);

      // initialize row change
      change.changes.rows[rowIndex] = {
        columns: {}
      };

      // go through each cell and paste data
      const lineIndex: number = rowIndex - range.rows.start;
      for (let columnIndex: number = range.columns.start; columnIndex < range.columns.start + columnValues[lineIndex].length; columnIndex++) {
        // get column definition
        // -1 because row no not included in this.columns
        const columnDefinition = this.columns[columnIndex - 1];

        // check if column is readonly, then ignore
        // #TODO
        // // if readonly - ignore
        // replace same as disabled column definition
        // if (this.editor.readonly.rows[rowIndex]?.columns[columnIndex]) {
        //   continue;
        // }

        // previous value
        const oldValue: string = _.get(
          rowNode.data,
          columnDefinition.field
        );
        let newValue: any = columnValues[lineIndex][columnIndex - range.columns.start];

        // paste value
        switch (columnDefinition.type) {
          case V2SpreadsheetEditorColumnType.TEXT:
          case V2SpreadsheetEditorColumnType.TEXTAREA:

            // we shouldn't have anything else but strings taking in account what we process is from clipboard
            newValue = typeof newValue === 'string' ?
              newValue :
              newValue.toString();

            // finished
            break;

          case V2SpreadsheetEditorColumnType.NUMBER:

            // convert to number
            if (
              newValue &&
              typeof newValue === 'string'
            ) {
              try {
                newValue = parseFloat(newValue);
              } catch (e) {
                // default value if can't convert
                newValue = undefined;
              }
            } else if (
              newValue === '' ||
              typeof newValue !== 'number'
            ) {
              newValue = undefined;
            }

            // finished
            break;

          case V2SpreadsheetEditorColumnType.DATE:

            // convert to date
            if (
              newValue &&
              typeof newValue === 'string'
            ) {
              if (!moment(newValue).isValid()) {
                newValue = undefined;
              }
            } else if (newValue instanceof moment) {
              // no changes
            } else {
              // not supported format
              newValue = undefined;
            }

            // finished
            break;

          case V2SpreadsheetEditorColumnType.SINGLE_SELECT:

            // select option
            if (
              !newValue ||
              typeof newValue !== 'string'
            ) {
              newValue = undefined;
            } else {
              // search for value in options
              if (columnDefinition.optionsMap[newValue]) {
                newValue = columnDefinition.optionsMap[newValue].value;
              } else {
                // search first one that matches by name
                const newValueFirstMatch = columnDefinition.options.find((item) => item.label && (item.label === newValue || this.translateService.instant(item.label) === newValue));
                if (newValueFirstMatch) {
                  newValue = newValueFirstMatch.value;
                } else {
                  // couldn't find match
                  newValue = undefined;
                }
              }
            }

            // finished
            break;

          case V2SpreadsheetEditorColumnType.LOCATION:

            // select option
            if (
              !newValue ||
              typeof newValue !== 'string'
            ) {
              newValue = undefined;
            } else {
              if (this.editor.locationsMap[newValue]) {
                // location found
                // - keep value as it is
              } else {
                // search by label (name + synonyms)
                if (firstLabelToLocation[newValue]) {
                  newValue = firstLabelToLocation[newValue].id;
                } else if (firstNameToLocation[newValue]) {
                  newValue = firstNameToLocation[newValue].id;
                } else {
                  // not found, we need to retrieve it
                  if (!locationsToRetrieve[newValue]) {
                    locationsToRetrieve[newValue] = [];
                  }

                  // search on be
                  locationsToRetrieve[newValue].push({
                    rowIndex,
                    columnIndex
                  });

                  // jump over this one
                  continue;
                }
              }
            }

            // finished
            break;
        }

        // nothing to do ?
        if (oldValue === newValue) {
          continue;
        }

        // update value
        updateValue(
          rowIndex,
          columnIndex,
          oldValue,
          newValue,
          rowNode,
          columnDefinition
        );
      }

      // validate row
      this.rowValidate(rowIndex);
    }

    // finished
    const finished = () => {
      // go through changes and trigger change event
      // - now that we have location data too
      const rowIndexes = Object.keys(change.changes.rows).map((rowIndex) => parseInt(rowIndex, 10));
      for (let ri: number = 0; ri < rowIndexes.length; ri++) {
        // row index
        const rowIndex: number = rowIndexes[ri];

        // determine column indexes
        const columnIndexes = Object.keys(change.changes.rows[rowIndex].columns).map((columnIndex) => parseInt(columnIndex, 10));
        for (let ci: number = 0; ci < columnIndexes.length; ci++) {
          // column index
          const columnIndex: number = columnIndexes[ci];

          // get column definition
          // -1 because row no not included in this.columns
          const columnDefinition = this.columns[columnIndex - 1];

          // trigger value change
          this.cellTriggerEvents(
            rowIndex,
            columnDefinition.field,
            V2SpreadsheetEditorEventType.CHANGE,
            change
          );
        }
      }

      // append change
      this.cellAppendChange(change);

      // redraw rows
      this._agTable.api.refreshCells({
        force: false,
        suppressFlash: false
      });

      // update css
      this.cellUpdateRangeClasses(true);
    };

    // do we have locations to retrieve ?
    // - if not we finished
    const locationKeys: string[] = Object.keys(locationsToRetrieve);
    if (locationKeys.length < 1) {
      // finish
      finished();

      // stop
      return;
    }

    // retrieve locations
    return new Observable<void>((observer) => {
      // construct location query
      const qb: RequestQueryBuilder = new RequestQueryBuilder();

      // we need just some fields
      qb.fields(
        'id',
        'name',
        'synonyms',
        'geoLocation'
      );

      // retrieve locations that we need
      qb.filter.where({
        or: [
          {
            id: {
              inq: locationKeys
            }
          }, {
            name: {
              inq: locationKeys
            }
          }
        ]
      });

      // retrieve locations
      this.locationDataService
        .getLocationsList(qb)
        .pipe(
          // handle error
          catchError((err) => {
            // show error
            this.toastV2Service.error(err);

            // finish
            finished();

            // finish...
            observer.next();
            observer.complete();

            // send error down the road
            return throwError(err);
          })
        )
        .subscribe((locations) => {
          // map locations
          locations.forEach((location) => {
            this.editor.locationsMap[location.id] = {
              id: location.id,
              geoLocation: location.geoLocation,
              label: location.name + (
                location.synonyms?.length < 1 ?
                  '' :
                  ` ( ${location.synonymsAsString} )`
              ),
              name: location.name
            };
          });

          // transform locations to array to search through it as a last resort
          updateFirstsToLocation();

          // update cell values once again
          locationKeys.forEach((locationKey) => {
            // try once again to determine location
            let locationId: string;
            if (this.editor.locationsMap[locationKey]) {
              // location found
              locationId = this.editor.locationsMap[locationKey].id;
            } else if (firstLabelToLocation[locationKey]) {
              locationId = firstLabelToLocation[locationKey].id;
            } else if (firstNameToLocation[locationKey]) {
              locationId = firstNameToLocation[locationKey].id;
            }

            // retrieve cell info
            const cellsInfo = locationsToRetrieve[locationKey];
            cellsInfo.forEach((cellInfo) => {
              // retrieve row node
              const rowNode = this._agTable.api.getDisplayedRowAtIndex(cellInfo.rowIndex);

              // get column definition
              // -1 because row no not included in this.columns
              const columnDefinition = this.columns[cellInfo.columnIndex - 1];

              // determine old value
              const oldValue: string = _.get(
                rowNode.data,
                columnDefinition.field
              );

              // nothing to do ?
              if (oldValue === locationId) {
                return;
              }

              // update value
              updateValue(
                cellInfo.rowIndex,
                cellInfo.columnIndex,
                oldValue,
                locationId,
                rowNode,
                columnDefinition
              );
            });
          });

          // finish
          finished();

          // finish
          observer.next();
          observer.complete();
        });
    });
  }

  /**
   * Context menu option - copy
   */
  cellCopy(raw: boolean): void {
    // copy text
    const textToCopy: string | undefined = this.cellToText(
      raw,
      true
    );

    // nothing to do ?
    if (textToCopy === undefined) {
      return;
    }

    // copy
    // - even empty cell
    navigator.clipboard.writeText(textToCopy)
      .then()
      .catch((error) => {
        this.toastV2Service.error(error.message);
      });
  }

  /**
   * Context menu option - paste
   */
  cellPaste(): void {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length !== 1) {
      return;
    }

    // paste text
    navigator.clipboard.readText()
      .then((text) => {
        // paste into cells
        const asyncResponse = this.cellTextToCells(text);
        if (asyncResponse) {
          const loading = this.dialogV2Service.showLoadingDialog();
          asyncResponse.subscribe(() => {
            loading.close();
          });
        } else {
          // not async, no need to display loading
        }
      })
      .catch((error) => {
        this.toastV2Service.error(error.message);
      });
  }

  /**
   * Make change visible on screen
   */
  private cellScrollToChange(change: V2SpreadsheetEditorChange): void {
    // cell
    let rowIndex: number = -1;
    let columnIndex: number = -1;

    // undo change
    switch (change.type) {
      case V2SpreadsheetEditorChangeType.VALUES:

        // first one
        rowIndex = parseInt(Object.keys(change.changes.rows)[0], 10);
        columnIndex = parseInt(Object.keys(change.changes.rows[rowIndex].columns)[0], 10);

        // finished
        break;
    }

    // nothing to do ?
    if (
      rowIndex < 0 ||
      columnIndex < 0 ||
      rowIndex === undefined ||
      columnIndex === undefined ||
      isNaN(rowIndex) ||
      isNaN(columnIndex)
    ) {
      return;
    }

    // scroll to cell
    // -1 because this.columns doesn't contain row no column and change.changes.rows[rowIndex].columns contains row column
    this._agTable.api.ensureIndexVisible(rowIndex);
    this._agTable.api.ensureColumnVisible(this.columns[columnIndex - 1].field);
  }

  /**
   * Context menu option - undo
   */
  cellUndo(): void {
    // nothing to do ?
    if (this.changesIndex < 1) {
      return;
    }

    // no clear selection because this will lose focus, and we can't chain cell undo

    // determine change without removing it from the list since we need it for cell redo
    this.changesIndex--;
    const change = this.changes[this.changesIndex];

    // make cell visible
    this.cellScrollToChange(change);

    // undo change
    switch (change.type) {
      case V2SpreadsheetEditorChangeType.VALUES:

        // put values back
        const rowIndexes = Object.keys(change.changes.rows).map((rowIndex) => parseInt(rowIndex, 10));
        for (let ri: number = 0; ri < rowIndexes.length; ri++) {
          // row index
          const rowIndex: number = rowIndexes[ri];

          // determine column indexes
          const columnIndexes = Object.keys(change.changes.rows[rowIndex].columns).map((columnIndex) => parseInt(columnIndex, 10));
          for (let ci: number = 0; ci < columnIndexes.length; ci++) {
            // column index
            const columnIndex: number = columnIndexes[ci];

            // put back old value
            const oldValue = change.changes.rows[rowIndex].columns[columnIndex].old;
            const rowNode = this._agTable.api.getDisplayedRowAtIndex(rowIndex);

            // same value - ignore ?
            const columnField = this.columns[columnIndex - 1].field;
            const currentValue: any = _.get(
              rowNode.data,
              columnField
            );
            if (oldValue === currentValue) {
              continue;
            }

            // update value without triggering value changed
            _.set(
              rowNode.data,
              columnField,
              oldValue
            );

            // trigger events
            this.cellTriggerEvents(
              rowIndex,
              columnField,
              V2SpreadsheetEditorEventType.CHANGE,
              undefined
            );
          }

          // validate
          this.rowValidate(rowIndex);
        }

        // finished
        break;
    }

    // redraw
    this._agTable.api.refreshCells({
      force: false,
      suppressFlash: false
    });

    // redraw ranges
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Context menu option - redo
   */
  cellRedo(): void {
    // nothing to do ?
    if (this.changesIndex >= this.changes.length) {
      return;
    }

    // no clear selection because this will lose focus, and we can't chain cell redo

    // determine change
    const change = this.changes[this.changesIndex];
    this.changesIndex++;

    // make cell visible
    this.cellScrollToChange(change);

    // redo change
    switch (change.type) {
      case V2SpreadsheetEditorChangeType.VALUES:

        // put values back
        const rowIndexes = Object.keys(change.changes.rows).map((rowIndex) => parseInt(rowIndex, 10));
        rowIndexes.forEach((rowIndex) => {
          // determine column indexes
          const columnIndexes = Object.keys(change.changes.rows[rowIndex].columns).map((columnIndex) => parseInt(columnIndex, 10));
          columnIndexes.forEach((columnIndex) => {
            // put back new value
            const newValue = change.changes.rows[rowIndex].columns[columnIndex].new;
            const rowNode = this._agTable.api.getDisplayedRowAtIndex(rowIndex);

            // same value - ignore ?
            const columnField = this.columns[columnIndex - 1].field;
            const currentValue: any = _.get(
              rowNode.data,
              columnField
            );
            if (newValue === currentValue) {
              return;
            }

            // update value without triggering value changed
            _.set(
              rowNode.data,
              columnField,
              newValue
            );

            // trigger events
            this.cellTriggerEvents(
              rowIndex,
              columnField,
              V2SpreadsheetEditorEventType.CHANGE,
              undefined
            );
          });

          // validate
          this.rowValidate(rowIndex);
        });

        // finished
        break;
    }

    // redraw
    this._agTable.api.refreshCells({
      force: false,
      suppressFlash: false
    });

    // redraw ranges
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Cell - delete content
   */
  cellDeleteContent(): void {
    // nothing to delete ?
    if (this.editor.selection.selected.ranges.length < 1) {
      return;
    }

    // go through ranges and delete
    const change: IV2SpreadsheetEditorChangeValues = {
      type: V2SpreadsheetEditorChangeType.VALUES,
      changes: {
        rows: {}
      }
    };
    this.editor.selection.selected.ranges.forEach((range) => {
      // go through rows
      for (let rowIndex: number = range.rows.start; rowIndex <= range.rows.end; rowIndex++) {
        // initialize
        change.changes.rows[rowIndex] = {
          columns: {}
        };

        // retrieve row data
        const rowNode = this._agTable.api.getDisplayedRowAtIndex(rowIndex);

        // go through columns
        for (let columnIndex: number = range.columns.start; columnIndex <= range.columns.end; columnIndex++) {
          // if readonly - ignore
          if (this.editor.readonly.rows[rowIndex]?.columns[columnIndex]) {
            continue;
          }

          // determine column field
          // -1 because row no not included in this.columns
          const columnField: string = this.columns[columnIndex - 1].field;
          const oldValue: any = _.get(
            rowNode.data,
            columnField
          );

          // same value - ignore ?
          const newValue = null;
          if (oldValue === newValue) {
            continue;
          }

          // save value
          change.changes.rows[rowIndex].columns[columnIndex] = {
            old: oldValue,
            new: newValue
          };

          // delete value
          _.set(
            rowNode.data,
            columnField,
            newValue
          );

          // trigger events
          this.cellTriggerEvents(
            rowIndex,
            columnField,
            V2SpreadsheetEditorEventType.CHANGE,
            change
          );
        }

        // validate
        this.rowValidate(rowIndex);
      }
    });

    // redraw
    this._agTable.api.refreshCells({
      force: false,
      suppressFlash: true
    });

    // append change
    this.cellAppendChange(change);

    // update css
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Select focused cell
   */
  private cellSelectFocused(): void {
    // focused cell
    let focusedCell = this._agTable.api.getFocusedCell();

    // nothing to do ?
    if (!focusedCell) {
      return;
    }

    // if focused cell is the first one (row no) we need to select the next one
    if (focusedCell.column.getUserProvidedColDef().field === AppSpreadsheetEditorV2CellBasicHeaderComponent.DEFAULT_COLUMN_ROW_NO) {
      // next cell
      this._agTable.api.tabToNextCell();

      // update focused
      focusedCell = this._agTable.api.getFocusedCell();
    }

    // display the newly focused cell
    const columnIndex: number = this.editor.columnsMap[focusedCell.column.getUserProvidedColDef().field].index;
    this.editor.selection.selected = {
      collecting: undefined,
      previousCollecting: undefined,
      outTime: undefined,
      fill: undefined,
      ranges: [{
        rows: {
          start: focusedCell.rowIndex,
          end: focusedCell.rowIndex
        },
        columns: {
          start: columnIndex,
          end: columnIndex
        }
      }]
    };

    // redraw ranges
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Cell - tab to next cell
   */
  private cellTabToNext(): void {
    // focus next cell
    this._agTable.api.tabToNextCell();

    // update focused selection
    this.cellSelectFocused();
  }

  /**
   * Append change
   */
  private cellAppendChange(change: V2SpreadsheetEditorChange): void {
    // on first change remove all undo, since we need to overwrite them
    while (this.changes.length > this.changesIndex) {
      this.changes.pop();
    }

    // round-robin
    while (this.changes.length >= AppSpreadsheetEditorV2Component.MAX_UNDO_TO_KEEP) {
      // remove first element - oldest element
      this.changes.shift();
    }

    // add the new change at the end
    this.changes.push(change);
    this.changesIndex = this.changes.length;
  }

  /**
   * Cell key down
   */
  private suppressKeyboardEvent(
    params: SuppressKeyboardEventParams | SuppressHeaderKeyboardEventParams
  ): boolean {
    // nothing to do ?
    if (this.editor.selection.selected.ranges.length < 1) {
      // don't block caller
      return false;
    }

    // select next cell ?
    if (params.event.code === 'Tab') {
      // allow bubble

      // select next cel
      this.cellTabToNext();

      // stop tba jumping to next html element that allows tab
      // - browser default
      params.event.preventDefault();

      // block caller
      return true;
    }

    // edit mode ?
    if (this._agTable.api.getEditingCells().length > 0) {
      // don't block caller
      return false;
    }

    // allow navigation, but we need to update selection
    // ← ↑ → ↓ Arrow keys will not navigate focused cell.
    if (
      params.event.code === 'ArrowRight' ||
      params.event.code === 'ArrowLeft' ||
      params.event.code === 'ArrowDown' ||
      params.event.code === 'ArrowUp' ||
      params.event.code === 'Home' ||
      params.event.code === 'End' ||
      params.event.code === 'PageUp' ||
      params.event.code === 'PageDown'
    ) {
      // allow bubble

      // update focused selection after focused cell is changed by ag-grid (return false)
      this.timerCellSelectFocused = setTimeout(() => {
        // update focused selection
        this.cellSelectFocused();
        this.timerCellSelectFocused = undefined;
      });

      // don't block caller
      return false;
    }

    // cut selected cells
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyA'
    ) {
      // stop browser default
      params.event.preventDefault();

      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // select all
      this.rangeMouseDown(
        {
          start: 0,
          end: this._agTable.api.getDisplayedRowCount() - 1
        }, {
          start: 1,
          end: this.columns.length
        },
        false,
        false
      );

      // block caller
      return true;
    }

    // delete cell content ?
    if (params.event.code === 'Delete') {
      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // delete content
      this.cellDeleteContent();

      // block caller
      return true;
    }

    // cut selected cells - not implemented
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyX'
    ) {
      // block caller
      return true;
    }

    // copy selected cells
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyC'
    ) {
      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // copy selected
      this.cellCopy(true);

      // block caller
      return true;
    }

    // paste
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyV'
    ) {
      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // paste
      this.cellPaste();

      // block caller
      return true;
    }

    // undo
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyZ'
    ) {
      // stop browser default
      params.event.preventDefault();

      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // undo
      this.cellUndo();

      // block caller
      return true;
    }

    // redo
    if (
      params.event.ctrlKey &&
      params.event.code === 'KeyY'
    ) {
      // stop browser default
      params.event.preventDefault();

      // just ignore if bubble
      if (params.event.repeat) {
        // block caller
        return true;
      }

      // redo
      this.cellRedo();

      // block caller
      return true;
    }

    // don't block caller
    // - do whatever the default behavior would be
    // - let God decide
    return false;
  }

  /**
   * Scroll
   */
  gridBodyScroll(): void {
    // redraw ranges since they might've disappeared when cells were destroyed
    // #TODO
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Cell editing stopped
   */
  gridCellEditingStopped(event: CellEditingStoppedEvent): void {
    // validate
    this.rowValidate(event.rowIndex);

    // update css
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Clear wait for async to finish
   */
  private stopWaitForAsyncToFinish(): void {
    if (this.waitForAsyncToFinish) {
      clearTimeout(this.waitForAsyncToFinish);
      this.waitForAsyncToFinish = undefined;
    }
  }

  /**
   * Retrieve rows to save
   */
  private retrieveRowsToSave(): any[] {
    // list of rows
    const rows: any[] = [];

    // validate once again all rows
    const rowsNo: number = this._agTable.api.getDisplayedRowCount();
    for (let rowIndex = 0; rowIndex < rowsNo; rowIndex++) {
      // no need to add it if we don't have data
      if (!this.editor.hasData.rows[rowIndex]) {
        continue;
      }

      // add it to the list
      rows.push(this._agTable.api.getDisplayedRowAtIndex(rowIndex).data);
    }

    // finished
    return rows;
  }

  /**
   * Validate all rows
   */
  private validateAllRows(): void {
    // validate
    const rowsNo: number = this._agTable.api.getDisplayedRowCount();
    for (let rowIndex = 0; rowIndex < rowsNo; rowIndex++) {
      this.rowValidate(rowIndex);
    }

    // update css
    this.cellUpdateRangeClasses(true);
  }

  /**
   * Save
   */
  private saveRecords(): void {
    // wrap up any editing
    this._agTable.api.stopEditing();

    // can't save ?
    if (this.editor.async.inProgress) {
      return;
    }

    // show loading
    const loading = this.dialogV2Service.showLoadingDialog();

    // validate once again all rows
    this.validateAllRows();

    // stop timers - waitForAsyncToFinish
    this.stopWaitForAsyncToFinish();

    // check periodically if async finished
    const checkIfAsyncFinished = () => {
      // executed
      this.waitForAsyncToFinish = undefined;

      // async finished ?
      if (this.editor.async.inProgress) {
        // try again later
        this.waitForAsyncToFinish = setTimeout(
          checkIfAsyncFinished,
          500
        );
      } else {
        // finished
        asyncFinished();
      }
    };
    this.waitForAsyncToFinish = setTimeout(
      checkIfAsyncFinished,
      500
    );

    // execute once async finished
    const asyncFinished = () => {
      // if we have invalid data we need to resolve this before
      if (Object.keys(this.editor.invalid.rows).length > 0) {
        // message
        this.toastV2Service.error('LNG_COMMON_INVALID_ROWS');

        // hide loading
        loading.close();

        // finished
        return;
      }

      // retrieve only rows that need to be saved
      const rows: any[] = this.retrieveRowsToSave();

      // nothing to save ?
      if (rows.length < 1) {
        // message
        this.toastV2Service.notice('LNG_COMMON_NOTHING_TO_SAVE');

        // hide loading
        loading.close();

        // finished
        return;
      }

      // emit save event so parent component can do the heavy lifting
      this.save.emit({
        rows,
        finished: () => {
          // hide loading when parent finishes
          loading.close();
        }
      });
    };
  }
}
