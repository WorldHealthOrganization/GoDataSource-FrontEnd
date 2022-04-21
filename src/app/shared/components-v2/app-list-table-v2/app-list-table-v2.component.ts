import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { GridReadyEvent, ValueFormatterParams } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { moment } from '../../../core/helperClasses/x-moment';
import { Constants } from '../../../core/models/constants';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IV2Column, IV2ColumnAction, IV2ColumnBasic, IV2ColumnBasicFormat, IV2ColumnButton, IV2ColumnColor, IV2ColumnIconMaterial, IV2ColumnPinned, IV2ColumnStatus, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from './models/column.model';
import { AppListTableV2ActionsComponent } from './components/actions/app-list-table-v2-actions.component';
import { IExtendedColDef } from './models/extended-column.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel, V2ActionMenuItem, V2ActionType } from './models/action.model';
import { IV2GroupedData, IV2GroupedDataValue } from './models/grouped-data.model';
import { IBasicCount } from '../../../core/models/basic-count.interface';
import { PageEvent } from '@angular/material/paginator';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import {
  IV2SideDialogConfigButtonType,
  IV2SideDialogConfigInputCheckbox,
  IV2SideDialogConfigInputFilterList,
  IV2SideDialogConfigInputFilterListFilter, IV2SideDialogConfigInputFilterListSort,
  IV2SideDialogConfigInputSingleDropdown,
  IV2SideDialogConfigInputText,
  IV2SideDialogHandler,
  V2SideDialogConfigInput,
  V2SideDialogConfigInputType
} from '../app-side-dialog-v2/models/side-dialog-config.model';
import { UserModel, UserSettings } from '../../../core/models/user.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { AppListTableV2ButtonComponent } from './components/button/app-list-table-v2-button.component';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { AppListTableV2SelectionHeaderComponent } from './components/selection-header/app-list-table-v2-selection-header.component';
import { AppListTableV2ColumnHeaderComponent } from './components/column-header/app-list-table-v2-column-header.component';
import { RequestFilterGenerator, RequestFilterOperator, RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { AppListTableV2LoadingComponent } from './components/loading/app-list-table-v2-loading.component';
import { AppListTableV2NoDataComponent } from './components/no-data/app-list-table-v2-no-data.component';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { ColumnApi } from '@ag-grid-community/core/dist/cjs/es5/columns/columnApi';
import { SavedFiltersService } from '../../../core/services/data/saved-filters.data.service';
import {
  IV2AdvancedFilterAddress,
  IV2AdvancedFilterAddressPhoneNumber,
  IV2AdvancedFilterQuestionnaireAnswers,
  V2AdvancedFilter,
  V2AdvancedFilterComparatorType,
  V2AdvancedFilterQuestionWhichAnswer,
  V2AdvancedFilterType
} from './models/advanced-filter.model';
import { AnswerModel, QuestionModel } from '../../../core/models/question.model';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { AddressModel } from '../../../core/models/address.model';
import { IV2DateRange } from '../../forms-v2/components/app-form-date-range-v2/models/date.model';
import { SavedFilterData, SavedFilterDataAppliedFilter, SavedFilterDataAppliedSort, SavedFilterModel } from '../../../core/models/saved-filters.model';
import { IV2BottomDialogConfigButtonType } from '../app-bottom-dialog-v2/models/bottom-dialog-config.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2',
  templateUrl: './app-list-table-v2.component.html',
  styleUrls: ['./app-list-table-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2Component implements OnInit, OnDestroy {
  // static
  private static readonly STANDARD_COLUMN_MAX_DEFAULT_WIDTH: number = 400;
  private static readonly STANDARD_SELECT_COLUMN_WIDTH: number = 42;
  private static readonly STANDARD_SHAPE_SIZE: number = 12;
  private static readonly STANDARD_SHAPE_GAP: number = 6;
  private static readonly STANDARD_SHAPE_PADDING: number = 14;
  private static readonly STANDARD_HEADER_HEIGHT: number = 40;
  private static readonly STANDARD_HEADER_WITH_FILTER_HEIGHT: number = 88;
  private static readonly STANDARD_ADVANCED_FILTER_DIALOG_WIDTH: string = '40rem';

  // records
  recordsSubscription: Subscription;
  private _records$: Observable<any[]>;
  @Input() set records$(records$: Observable<any[]>) {
    // set the new observable
    this._records$ = records$;

    // retrieve data
    this.retrieveData();
  }

  // columns
  private _columns: IV2Column[];
  @Input() set columns(columns: IV2Column[]) {
    // set data
    this._columns = columns;

    // update columns definitions
    this.updateColumnDefinitions();
  }
  get columns(): IV2Column[] {
    return this._columns;
  }

  /**
   * Ag table api handlers
   */
  private _agTable: {
    api: GridApi,
    columnApi: ColumnApi
  } = null;
  private _callWhenReady: {
    retrieveData?: true,
    updateColumnDefinitions?: {
      overwriteVisibleColumns?: string[]
    },
    setSortColumn?: {
      field: string,
      direction: RequestSortDirection
    }
  } = {};

  // key field used to handle each row (checkbox selection, etc)
  @Input() keyField: string = 'id';

  // ag-grid modules
  modules = [
    ClientSideRowModelModule
  ];

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // quick actions
  @Input() quickActions: IV2ActionMenuLabel;

  // group actions
  @Input() groupActions: V2ActionMenuItem[];

  // add button
  @Input() addAction: IV2ActionIconLabel;

  // advanced filters
  @Input() advancedFilterType: string;
  @Input() advancedFilters: V2AdvancedFilter[];

  // advanced filters query builder
  private _advancedFiltersApplied: SavedFilterData;
  private _advancedFiltersQueryBuilder: RequestQueryBuilder;
  get advancedFiltersQueryBuilder(): RequestQueryBuilder {
    return this._advancedFiltersQueryBuilder ?
      _.cloneDeep(this._advancedFiltersQueryBuilder) :
      null;
  }

  // show header filters ?
  savingHeaderFilterVisibility: boolean = false;
  private _showHeaderFilters: boolean = true;
  set showHeaderFilters(showHeaderFilters: boolean) {
    // set data
    this._showHeaderFilters = showHeaderFilters;

    // set header height
    this.updateHeaderHeight();

    // re-render header columns
    this.updateColumnDefinitions();

    // save header filter visibility
    this.saveHeaderFilterVisibility();
  }
  get showHeaderFilters(): boolean {
    return this._showHeaderFilters;
  }

  // grouped data
  groupedDataExpanded: boolean = false;
  groupedDataOneActive: boolean;
  private _groupedDataPreviousClickedValue: IV2GroupedDataValue;
  private _groupedData: IV2GroupedData;
  @Input() set groupedData(groupedData: IV2GroupedData) {
    // keep old item
    const oldGroupedData = this._groupedData;

    // set data
    this._groupedData = groupedData;

    // blocked next get ?
    if (oldGroupedData?.data.blockNextGet) {
      this._groupedData.data.blockNextGet = true;
      this._groupedData.data.values = oldGroupedData.data.values;
    }

    // already expanded, refresh ?
    if (this.groupedDataExpanded) {
      this.expandRefreshGroupedData();
    }
  }
  get groupedData(): IV2GroupedData {
    return this._groupedData;
  }

  // page information
  @Input() pageCount: IBasicCount;
  @Input() pageSize: number;
  @Input() pageIndex: number;

  // click listener
  private clickListener: () => void;

  // refresh data
  @Output() refreshData = new EventEmitter<void>();

  // refresh data count
  @Output() refreshDataCount = new EventEmitter<void>();

  // change page
  @Output() pageChange = new EventEmitter<PageEvent>();

  // change page
  @Output() sortBy = new EventEmitter<{
    field: string,
    direction: RequestSortDirection
  }>();

  // filter by
  @Output() filterBy = new EventEmitter<IExtendedColDef>();
  @Output() advancedFilterBy = new EventEmitter<RequestQueryBuilder>();

  // reset header filters
  @Output() resetHeaderFilters = new EventEmitter<void>();

  // saving columns
  savingColumns: boolean = false;

  // page settings key
  private _pageSettingsKey: UserSettings;
  private _pageSettingsKeyLPinned: string;
  private _pageSettingsKeyRPinned: string;
  private _pageSettingsKeyHeaderFilter: string;
  @Input() set pageSettingsKey(pageSettingsKey: UserSettings) {
    // set data
    this._pageSettingsKey = pageSettingsKey;
    this._pageSettingsKeyLPinned = this._pageSettingsKey ? `${this._pageSettingsKey}LPinned` : this._pageSettingsKey;
    this._pageSettingsKeyRPinned = this._pageSettingsKey ? `${this._pageSettingsKey}RPinned` : this._pageSettingsKey;
    this._pageSettingsKeyHeaderFilter = this._pageSettingsKey ? `${this._pageSettingsKey}HeaderFilter` : this._pageSettingsKey;

    // update columns definitions
    this.updateColumnDefinitions();
  }

  // info values - used to display additional information relevant for this page
  private _infos: string[];
  infosJoined: string;
  @Input() set infos(infos: string[]) {
    // set info
    this._infos = infos;

    // join message
    this.infosJoined = '';
    if (
      this._infos &&
      this._infos.length > 0
    ) {
      this._infos.forEach((info) => {
        this.infosJoined += `<div>${this.translateService.instant(info)}</div>`;
      });
    }
  }

  // filters applied ?
  @Input() filtersApplied: boolean = false;

  // legends
  legends: {
    // required
    html: string;
  }[];

  // selected ids
  private _selected: string[] = [];
  get selectedRows(): string[] {
    return this._selected;
  }

  // sort by
  private _sortBy: {
    component: AppListTableV2ColumnHeaderComponent,
    column: IExtendedColDef,
    direction: RequestSortDirection | null
  } = { component: null, column: null, direction: null };
  get sortByColumn(): IExtendedColDef {
    return this._sortBy?.column;
  }
  get sortByDirection(): RequestSortDirection | null {
    return this._sortBy?.direction;
  }
  @Input() set sortColumn(info: {
    field?: string,
    direction?: RequestSortDirection
  }) {
    // nothing to do ?
    if (
      !info ||
      !info.field ||
      !info.direction
    ) {
      return;
    }

    // set sort column
    if (
      !this._agTable ||
      !this._agTable.columnApi
    ) {
      this._callWhenReady.setSortColumn = {
        field: info.field,
        direction: info.direction
      };
    } else {
      this.updateSortColumn(
        info.field,
        info.direction
      );
    }
  }

  // constants
  AppListTableV2LoadingComponent = AppListTableV2LoadingComponent;
  AppListTableV2NoDataComponent = AppListTableV2NoDataComponent;
  Constants = Constants;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected translateService: TranslateService,
    protected location: Location,
    protected renderer2: Renderer2,
    protected elementRef: ElementRef,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected authDataService: AuthDataService,
    protected toastV2Service: ToastV2Service,
    protected savedFiltersService: SavedFiltersService
  ) {}

  /**
   * Initialize resources
   */
  ngOnInit(): void {
    // listen for href clicks
    this.clickListener = this.renderer2.listen(
      this.elementRef.nativeElement,
      'click',
      (event) => {
        // not a link that we need to handle ?
        if (
          !event.target ||
          !event.target.getAttribute('is-link')
        ) {
          return;
        }

        // stop propagation
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // redirect
        this.router.navigate([event.target.getAttribute('is-link')]);
      }
    );

    // update table size
    this.resizeTable();

    // update filter visibility
    const authUser: UserModel = this.authDataService.getAuthenticatedUser();
    const filterVisibility: boolean | undefined = authUser.getSettings(this._pageSettingsKeyHeaderFilter);
    this._showHeaderFilters = filterVisibility === undefined || filterVisibility;
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // stop retrieving data
    this.stopGetRecords();

    // remove click listener
    if (this.clickListener) {
      this.clickListener();
      this.clickListener = undefined;
    }
  }

  /**
   * Stop retrieving data
   */
  private stopGetRecords(): void {
    // stop retrieving data
    if (this.recordsSubscription) {
      this.recordsSubscription.unsubscribe();
      this.recordsSubscription = undefined;
    }
  }

  /**
   * Retrieve data
   */
  private retrieveData(): void {
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
    this.recordsSubscription = this._records$
      .pipe(
        catchError((err) => {
          // show error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe((data) => {
        // finished
        this.recordsSubscription = undefined;

        // set data & hide loading overlay
        this._agTable.api.setRowData(data);

        // no records found ?
        if (data.length < 1) {
          this._agTable.api.showNoRowsOverlay();
        }

        // some type of columns should have a fixed width
        this.adjustFixedSizeColumns();

        // unselect everything
        this._agTable.api.deselectAll();

        // re-render page
        this.detectChanges();
      });
  }

  /**
   * Update column definitions
   */
  updateColumnDefinitions(
    overwriteVisibleColumns?: string[]
  ): void {
    // ag table not initialized ?
    if (!this._agTable) {
      // call later
      this._callWhenReady.updateColumnDefinitions = {
        overwriteVisibleColumns
      };

      // finished
      return;
    }

    // already called
    delete this._callWhenReady.updateColumnDefinitions;

    // reset data
    this.legends = [];

    // nothing to do ?
    if (
      !this._columns ||
      !this._pageSettingsKey
    ) {
      // reset
      this._agTable.api.setColumnDefs(undefined);

      // finished
      return;
    }

    // disable load visible columns
    let visibleColumns: string[] = [];
    let leftPinnedColumns: string[] = [];
    const leftPinnedColumnsMap: {
      [field: string]: true
    } = {};
    let rightPinnedColumns: string[] = [];
    const rightPinnedColumnsMap: {
      [field: string]: true
    } = {};

    // load column settings
    const authUser: UserModel = this.authDataService.getAuthenticatedUser();

    // visible columns
    if (overwriteVisibleColumns) {
      visibleColumns = overwriteVisibleColumns;
    } else {
      visibleColumns = authUser.getSettings(this._pageSettingsKey);
      visibleColumns = visibleColumns ? visibleColumns : [];
    }

    // left pinned columns
    leftPinnedColumns = authUser.getSettings(this._pageSettingsKeyLPinned);
    leftPinnedColumns = leftPinnedColumns ? leftPinnedColumns : [];

    // right pinned columns
    rightPinnedColumns = authUser.getSettings(this._pageSettingsKeyRPinned);
    rightPinnedColumns = rightPinnedColumns ? rightPinnedColumns : [];

    // mark visible columns if we have any
    if (visibleColumns.length > 0) {
      // map visible columns
      const visibleColumnsMap: {
        [field: string]: true
      } = {};
      visibleColumns.forEach((field) => {
        visibleColumnsMap[field] = true;
      });

      // make columns visible
      this._columns.forEach((column) => {
        column.notVisible = !visibleColumnsMap[column.field] &&
          column.format?.type !== V2ColumnFormat.ACTIONS;
      });
    }

    // map left pinned columns
    leftPinnedColumns.forEach((field) => {
      leftPinnedColumnsMap[field] = true;
    });

    // map right pinned columns
    rightPinnedColumns.forEach((field) => {
      rightPinnedColumnsMap[field] = true;
    });

    // determine columns
    const columnDefs: IExtendedColDef[] = [];

    // attach items selection column only if we have group actions
    if (this.groupActions?.length > 0) {
      columnDefs.push({
        pinned: IV2ColumnPinned.LEFT,
        headerName: '',
        field: this.keyField,
        checkboxSelection: true,
        cellClass: 'gd-cell-no-focus',
        suppressMovable: true,
        headerComponent: AppListTableV2SelectionHeaderComponent,
        width: AppListTableV2Component.STANDARD_SELECT_COLUMN_WIDTH,
        valueFormatter: () => '',
        columnDefinitionData: this,
        columnDefinition: {
          format: {
            type: V2ColumnFormat.ACTIONS
          },
          field: this.keyField,
          label: '',
          actions: [{
            type: V2ActionType.MENU,
            icon: 'expand_more',
            menuOptions: [
              {
                label: 'LNG_LIST_PAGES_BUTTON_BULK_ACTIONS_CHECK_ALL',
                action: {
                  click: () => {
                    this._agTable.api.selectAll();
                  }
                },
                visible: (): boolean => {
                  return this._agTable.api.getDisplayedRowCount() > 0 &&
                    this._agTable.api.getSelectedNodes().length < this._agTable.api.getDisplayedRowCount();
                }
              },
              {
                label: 'LNG_LIST_PAGES_BUTTON_BULK_ACTIONS_UNCHECK_ALL',
                action: {
                  click: () => {
                    this._agTable.api.deselectAll();
                  }
                },
                visible: (): boolean => {
                  return this._agTable.api.getDisplayedRowCount() > 0 &&
                    this._agTable.api.getSelectedNodes().length > 0;
                }
              },
              {
                // divider
                visible: (): boolean => {
                  return this._agTable.api.getDisplayedRowCount() > 0 && (
                    this._agTable.api.getSelectedNodes().length < this._agTable.api.getDisplayedRowCount() ||
                    this._agTable.api.getSelectedNodes().length > 0
                  );
                }
              },
              ...(this.groupActions ? this.groupActions : [])
            ]
          }]
        }
      });
    }

    // process columns
    this._columns.forEach((column) => {
      // no need to take in account ?
      if (
        (
          column.notVisible
        ) || (
          column.exclude &&
          column.exclude(column)
        )
      ) {
        return;
      }

      // determine column pinned value
      let pinned: IV2ColumnPinned | boolean;
      if (column.format?.type !== V2ColumnFormat.ACTIONS) {
        if (
          leftPinnedColumns.length > 0 &&
          leftPinnedColumnsMap[column.field]
        ) {
          pinned = IV2ColumnPinned.LEFT;
        } else if (
          rightPinnedColumns.length > 0 &&
          rightPinnedColumnsMap[column.field]
        ) {
          pinned = IV2ColumnPinned.RIGHT;
        } else {
          if (
            column.pinned === true ||
            column.pinned === IV2ColumnPinned.LEFT &&
            leftPinnedColumns.length < 1
          ) {
            pinned = IV2ColumnPinned.LEFT;
          } else if (
            column.pinned === IV2ColumnPinned.RIGHT &&
            rightPinnedColumns.length < 1
          ) {
            pinned = IV2ColumnPinned.RIGHT;
          }
        }
      } else {
        pinned = column.pinned;
      }

      // attach column to list of visible columns
      columnDefs.push({
        headerName: column.label && column.format?.type !== V2ColumnFormat.STATUS ?
          this.translateService.instant(column.label) :
          '',
        field: column.field,
        pinned,
        resizable: !column.notResizable,
        columnDefinition: column,
        columnDefinitionData: this,
        cellClass: column.cssCellClass,
        valueFormatter: (valueFormat): string => {
          return this.formatValue(valueFormat);
        },
        cellRenderer: this.handleCellRenderer(column),
        suppressMovable: column.format && column.format.type === V2ColumnFormat.ACTIONS,
        headerComponent: AppListTableV2ColumnHeaderComponent
      });

      // update legends
      if (column.format?.type === V2ColumnFormat.STATUS) {
        // get column def
        const statusColumn = column as IV2ColumnStatus;

        // go through legends
        statusColumn.legends.forEach((legend) => {
          // render legends
          let html: string = `<span class="gd-list-table-bottom-left-legend-title">${this.translateService.instant(legend.title)}</span> `;

          // render legend
          legend.items.forEach((legendItem) => {
            html += `<span class="gd-list-table-bottom-left-legend-item">
              ${this.renderStatusForm(legendItem.form, false)} ${this.translateService.instant(legendItem.label)}
            </span>`;
          });

          // add to legends to render
          this.legends.push({
            html
          });
        });
      }
    });

    // update column defs
    this._agTable.api.setColumnDefs(columnDefs);

    // re-render page
    this.detectChanges();
  }

  /**
   * Format value
   */
  private formatValue(valueFormat: ValueFormatterParams): string {
    // retrieve extended column definition
    const extendedColDef: IExtendedColDef = valueFormat.colDef as IExtendedColDef;

    // do we have a custom formatter ?
    const columnDefinition: {
      format?: IV2ColumnBasicFormat;
    } = extendedColDef.columnDefinition as unknown;
    if (columnDefinition.format) {
      // path or method ?
      const formatType: string = typeof columnDefinition.format.type;
      if (formatType === 'string') {
        return _.get(
          valueFormat.data,
          columnDefinition.format.type as string,
          ''
        );

      } else if (formatType === 'function') {
        return (columnDefinition.format.type as (any) => string)(valueFormat.data);

      } else if (formatType === 'number') {
        // get field
        const field: string = columnDefinition.format.field ?
          columnDefinition.format.field :
          extendedColDef.field;

        // retrieve field value
        const fieldValue: any = columnDefinition.format.value ?
          columnDefinition.format.value(valueFormat.data) :
          _.get(
            valueFormat.data,
            field
          );

        // handle accordingly to format type
        const specificFormat: V2ColumnFormat = columnDefinition.format.type as any;
        switch (specificFormat) {
          // AGE
          case V2ColumnFormat.AGE:
            return fieldValue?.months > 0 ?
              fieldValue?.months + ' ' + this.translateService.instant('LNG_AGE_FIELD_LABEL_MONTHS') :
              (
                fieldValue?.years > 0 ?
                  (fieldValue?.years + ' ' + this.translateService.instant('LNG_AGE_FIELD_LABEL_YEARS')) :
                  ''
              );

          // DATE
          case V2ColumnFormat.DATE:
            return fieldValue ?
              moment(fieldValue).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
              '';

          // DATETIME
          case V2ColumnFormat.DATETIME:
            return fieldValue ?
              moment(fieldValue).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
              '';

          // BOOLEAN
          case V2ColumnFormat.BOOLEAN:
            return fieldValue ?
              this.translateService.instant('LNG_COMMON_LABEL_YES') :
              this.translateService.instant('LNG_COMMON_LABEL_NO');

          // COLOR & ICON
          case V2ColumnFormat.COLOR:
          case V2ColumnFormat.ICON_MATERIAL:
            return fieldValue;

          // nothing to do
          case V2ColumnFormat.STATUS:
          case V2ColumnFormat.BUTTON:
          case V2ColumnFormat.ACTIONS:

            // nothing to do here
            return null;

          default:
            throw new Error('V2ColumnFormat: Not supported');
        }
      } else {
        throw new Error('formatValue: Not supported');
      }
    }

    // default - try to translate if string
    return valueFormat.value && typeof valueFormat.value === 'string' ?
      this.translateService.instant(valueFormat.value) :
      valueFormat.value;
  }

  /**
   * Render status form
   */
  private renderStatusForm(
    form: V2ColumnStatusForm,
    addGap: boolean
  ): string {
    let statusHtml: string = '';
    switch (form.type) {
      case IV2ColumnStatusFormType.CIRCLE:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            ${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
            <circle fill="${form.color}" cx="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" cy="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" r="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" />
          </svg>
        `;

        // finished
        break;

      case IV2ColumnStatusFormType.SQUARE:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            ${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
            <rect fill="${form.color}" width="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" />
          </svg>
        `;

        // finished
        break;

      case IV2ColumnStatusFormType.TRIANGLE:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            ${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
            <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2} 0, 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE}, ${AppListTableV2Component.STANDARD_SHAPE_SIZE} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}"/>
          </svg>
        `;

        // finished
        break;

      case IV2ColumnStatusFormType.STAR:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            ${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
            <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2},0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.2},${AppListTableV2Component.STANDARD_SHAPE_SIZE} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.95},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.4} 0,${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.4} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.8},${AppListTableV2Component.STANDARD_SHAPE_SIZE}" />
          </svg>
        `;

        // finished
        break;
    }

    // finished
    return statusHtml;
  }

  /**
   * Custom renderer
   */
  private handleCellRenderer(column: IV2Column): any {
    // link ?
    const basicColumn: IV2ColumnBasic = column as IV2ColumnBasic;
    if (basicColumn.link) {
      return (params: ValueFormatterParams) => {
        // determine value
        const value: string = this.formatValue(params);

        // retrieve url link
        const url: string = basicColumn.link(params.data);

        // create link
        return url ?
          `<a class="gd-list-table-link" href="${this.location.prepareExternalUrl(url)}"><span is-link="${url}">${value}</span><a/>` :
          value;
      };
    } else {
      // color ?
      const colorColumn: IV2ColumnColor = column as IV2ColumnColor;
      if (
        colorColumn.format &&
        colorColumn.format.type === V2ColumnFormat.COLOR
      ) {
        return (params: ValueFormatterParams) => {
          // determine value
          const value: string = this.formatValue(params);

          // create color display
          return value ?
            `<span class="gd-list-table-color"><div style="background-color: ${value}; display: inline-block; width: 2.4rem; height: 2.4rem;"></div> ${value}</span>` :
            this.translateService.instant(colorColumn.noColorLabel);
        };
      }

      // icon ?
      const iconColumn: IV2ColumnIconMaterial = column as IV2ColumnIconMaterial;
      if (
        iconColumn.format &&
        iconColumn.format.type === V2ColumnFormat.ICON_MATERIAL
      ) {
        return (params: ValueFormatterParams) => {
          // determine value
          const value: string = this.formatValue(params);

          // create color display
          return value ?
            `<span class="gd-list-table-icon-material"><span class="material-icons">${value}</span></span>` :
            this.translateService.instant(iconColumn.noIconLabel);
        };
      }

      // actions ?
      const actionColumn: IV2ColumnAction = column as IV2ColumnAction;
      if (
        actionColumn.format &&
        actionColumn.format.type === V2ColumnFormat.ACTIONS
      ) {
        return AppListTableV2ActionsComponent;
      }

      // buttons
      const buttonColumn: IV2ColumnButton = column as IV2ColumnButton;
      if (
        buttonColumn.format &&
        buttonColumn.format.type === V2ColumnFormat.BUTTON
      ) {
        return AppListTableV2ButtonComponent;
      }

      // status
      const statusColumn: IV2ColumnStatus = column as IV2ColumnStatus;
      if (
        statusColumn.format &&
        statusColumn.format.type === V2ColumnFormat.STATUS
      ) {
        return (params: ValueFormatterParams) => {
          // determine forms
          const forms: V2ColumnStatusForm[] = statusColumn.forms(
            statusColumn,
            params.data
          );

          // construct status html
          let statusHtml: string = '';
          forms.forEach((form, formIndex) => {
            statusHtml += this.renderStatusForm(
              form,
              formIndex < forms.length - 1
            );
          });

          // finished
          return statusHtml;
        };
      }
    }

    // nothing to do ?
    return undefined;
  }

  /**
   * Grid ready
   */
  firstDataRendered(): void {
    // resize all columns
    this._agTable.columnApi.autoSizeAllColumns();

    // set max width
    // - but allow user to go beyond that
    this._agTable.columnApi.getAllColumns().forEach((column) => {
      // no need to resize ?
      if (column.getActualWidth() <= AppListTableV2Component.STANDARD_COLUMN_MAX_DEFAULT_WIDTH) {
        return;
      }

      // resize
      this._agTable.columnApi.setColumnWidth(
        column,
        AppListTableV2Component.STANDARD_COLUMN_MAX_DEFAULT_WIDTH
      );
    });

    // some type of columns should have a fixed width
    this.adjustFixedSizeColumns();

    // set min width to column depending on the current content
    // - it would've been better if we could've set it to header width, and not cel content too
    this._agTable.columnApi.getAllColumns().forEach((column) => {
      const colDef = column.getColDef();
      colDef.minWidth = column.getActualWidth();
      column.setColDef(colDef, colDef);
    });
  }

  /**
   * Some type of columns should have a fixed width
   */
  private adjustFixedSizeColumns(): void {
    // some type of columns should have a fixed width
    this._agTable.columnApi.getAllColumns().forEach((column) => {
      // retrieve column definition
      const colDef: IExtendedColDef = column.getColDef() as IExtendedColDef;
      if (colDef.columnDefinition?.format?.type === V2ColumnFormat.STATUS) {
        // determine maximum number of items
        const statusColumn: IV2ColumnStatus = colDef.columnDefinition as IV2ColumnStatus;
        let maxForms: number = 1;
        this._agTable.api.forEachNode((node) => {
          const formsNo: number = statusColumn.forms(
            statusColumn,
            node.data
          ).length;
          maxForms = maxForms < formsNo ?
            formsNo :
            maxForms;
        });

        // set column width
        this._agTable.columnApi.setColumnWidth(
          column,
          (maxForms - 1) * (AppListTableV2Component.STANDARD_SHAPE_SIZE + AppListTableV2Component.STANDARD_SHAPE_GAP) +
          AppListTableV2Component.STANDARD_SHAPE_SIZE +
          AppListTableV2Component.STANDARD_SHAPE_PADDING * 2
        );
      } else if (colDef.headerComponent === AppListTableV2SelectionHeaderComponent) {
        this._agTable.columnApi.setColumnWidth(
          column,
          AppListTableV2Component.STANDARD_SELECT_COLUMN_WIDTH
        );
      }
    });
  }

  /**
   * Visible Columns
   */
  setVisibleColumns(): void {
    // construct list of possible columns
    const columns: IV2Column[] = this._columns
      // filter out pinned columns since those are handled by a different button
      .filter((item) => item.format?.type !== V2ColumnFormat.ACTIONS && (!item.exclude || !item.exclude(item)))
      // sort columns by their label
      .sort((v1, v2) => this.translateService.instant(v1.label).localeCompare(this.translateService.instant(v2.label)));

    // construct list of checkboxes
    const checkboxInputs: V2SideDialogConfigInput[] = [];
    columns.forEach((column) => {
      checkboxInputs.push({
        type: V2SideDialogConfigInputType.CHECKBOX,
        checked: !column.notVisible,
        placeholder: column.label,
        name: column.field,
        data: column
      });
    });

    // display popup
    this.dialogV2Service
      .showSideDialog({
        // dialog
        title: {
          get: () => 'LNG_SIDE_COLUMNS_SECTION_COLUMNS_TO_DISPLAY_TITLE'
        },

        // inputs
        inputs: checkboxInputs,

        // buttons
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_SIDE_COLUMNS_APPLY_FILTERS_BUTTON',
          color: 'primary',
          key: 'apply',
          disabled: (data): boolean => {
            return !data.inputs.find((item: IV2SideDialogConfigInputCheckbox) => item.checked);
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }]
      })
      .subscribe((response) => {
        // nothing to do ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          return;
        }

        // close dialog
        response.handler.hide();

        // set visible column on table to see the effects right away
        const visibleMap: {
          [field: string]: true
        } = {};
        response.data.inputs.forEach((item: IV2SideDialogConfigInputCheckbox) => {
          // change option
          const itemData = item.data as IV2Column;
          itemData.notVisible = !item.checked;

          // visible ?
          if (item.checked) {
            visibleMap[itemData.field] = true;
          }
        });

        // construct visible columns keeping the previous order
        const visibleColumns: string[] = [];
        this._agTable.columnApi.getColumnState().forEach((columnState) => {
          // retrieve column definition
          const colDef: IExtendedColDef = this._agTable.columnApi.getColumn(columnState.colId)?.getColDef() as IExtendedColDef;
          if (
            !colDef ||
            !colDef.columnDefinition ||
            !visibleMap[colDef.columnDefinition.field] ||
            colDef.columnDefinition.format?.type === V2ColumnFormat.ACTIONS
          ) {
            return;
          }

          // add to list
          visibleColumns.push(colDef.columnDefinition.field);
          delete visibleMap[colDef.columnDefinition.field];
        });

        // add at the end the columns that were made visible
        const remainingColumns = Object.keys(visibleMap);
        remainingColumns.forEach((field) => {
          visibleColumns.push(field);
        });

        // hide table columns / show column accordingly
        this.updateColumnDefinitions(visibleColumns);

        // scroll to the end if we added columns at the end
        if (remainingColumns.length > 0) {
          this._agTable.api.ensureColumnVisible(remainingColumns[0]);
        }

        // some type of columns should have a fixed width
        this.adjustFixedSizeColumns();

        // save the new settings
        this.saveVisibleAndOrderOfColumns();
      });
  }

  /**
   * Should update height of table
   */
  resizeTable(): void {
    // local variables
    let margins;

    // determine top part used space
    let topHeight: number = 0;
    const top = this.elementRef.nativeElement.querySelector('.gd-list-top');
    if (top) {
      // add height
      topHeight += top.offsetHeight;

      // get top margins
      margins = getComputedStyle(top);
      if (margins) {
        // top margin
        if (margins.marginTop) {
          topHeight += parseInt(margins.marginTop, 10);
        }

        // bottom margin
        if (margins.marginBottom) {
          topHeight += parseInt(margins.marginBottom, 10);
        }
      }
    }

    // set table height
    const table = this.elementRef.nativeElement.querySelector('.gd-list-table');
    if (table) {
      // set main table height - mat card
      table.style.height = `calc(100% - ${topHeight}px)`;

      // determine used space by table header
      let tableHeaderHeight: number = 0;
      const tableHeader = table.querySelector('.gd-list-table-header');
      if (tableHeader) {
        // add height
        tableHeaderHeight += tableHeader.offsetHeight;

        // get top margins
        margins = getComputedStyle(tableHeader);
        if (margins) {
          // top margin
          if (margins.marginTop) {
            tableHeaderHeight += parseInt(margins.marginTop, 10);
          }

          // bottom margin
          if (margins.marginBottom) {
            tableHeaderHeight += parseInt(margins.marginBottom, 10);
          }
        }
      }

      // determine used space by table header
      let tableBottomHeight: number = 0;
      const tableBottom = table.querySelector('.gd-list-table-bottom');
      if (tableBottom) {
        // add height
        tableBottomHeight += tableBottom.offsetHeight;

        // get top margins
        margins = getComputedStyle(tableBottom);
        if (margins) {
          // top margin
          if (margins.marginTop) {
            tableBottomHeight += parseInt(margins.marginTop, 10);
          }

          // bottom margin
          if (margins.marginBottom) {
            tableBottomHeight += parseInt(margins.marginBottom, 10);
          }
        }
      }

      // determine table data height
      const tableData = table.querySelector('.gd-list-table-data');
      if (tableData) {
        // set main table data height
        tableData.style.height = `calc(100% - ${tableHeaderHeight + tableBottomHeight}px)`;
      }
    }
  }

  /**
   * Refresh template
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Refresh grouped data
   */
  collapseGroupedData(): void {
    // collapse
    this.groupedDataExpanded = false;

    // refresh html
    this.detectChanges();
    this.resizeTable();
  }

  /**
   * Expand grouped data - or refresh
   */
  expandRefreshGroupedData(): void {
    // nothing to refresh ?
    if (!this.groupedData) {
      return;
    }

    // blocked next get ?
    if (this.groupedData.data.blockNextGet) {
      // allow next one
      delete this.groupedData.data.blockNextGet;

      // block
      return;
    }

    // get grouped data
    this.groupedData.data.get(
      this.groupedData,
      () => {
        // refresh html
        this.detectChanges();
        this.resizeTable();
      }
    );

    // display data
    this.groupedDataExpanded = true;

    // refresh html
    this.detectChanges();
    this.resizeTable();
  }

  /**
   * Refresh Data
   */
  refreshDataHandler(): void {
    this.refreshData.emit();
  }

  /**
   * Refresh data count
   */
  refreshDataCountHandler(): void {
    this.refreshDataCount.emit();
  }

  /**
   * Change page
   */
  changePage(page: PageEvent): void {
    this.pageChange.emit(page);
  }

  /**
   * Save visible and order of columns
   */
  saveVisibleAndOrderOfColumns(e?: {
    target: any
  }): void {
    // nothing to do ?
    if (
      !this._pageSettingsKey ||
      e?.target?.classList?.contains('ag-header-cell-resize')
    ) {
      return;
    }

    // display loading spinner while saving visible columns instead of visible columns button
    this.savingColumns = true;

    // update layout
    this.detectChanges();

    // determine order of columns and which are pinned and save data
    const visibleColumns: string[] = [];
    const leftPinnedColumns: string[] = [];
    const rightPinnedColumns: string[] = [];
    this._agTable.columnApi.getColumnState().forEach((columnState) => {
      // retrieve column definition
      const colDef: IExtendedColDef = this._agTable.columnApi.getColumn(columnState.colId)?.getColDef() as IExtendedColDef;

      // nothing to do ?
      if (
        !colDef ||
        !colDef.columnDefinition ||
        colDef.columnDefinition.format?.type === V2ColumnFormat.ACTIONS
      ) {
        return;
      }

      // visible column ?
      if (colDef.columnDefinition.field) {
        // add to save
        visibleColumns.push(colDef.columnDefinition.field);

        // pinned ?
        if (columnState.pinned === 'left') {
          leftPinnedColumns.push(colDef.columnDefinition.field);
        } else if (columnState.pinned === 'right') {
          rightPinnedColumns.push(colDef.columnDefinition.field);
        }
      }
    });

    // update settings
    this.authDataService
      .updateSettingsForCurrentUser({
        [this._pageSettingsKey]: visibleColumns,
        [this._pageSettingsKeyLPinned]: leftPinnedColumns,
        [this._pageSettingsKeyRPinned]: rightPinnedColumns
      })
      .pipe(
        catchError((err) => {
          // error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe(() => {
        // finished saving
        this.savingColumns = false;

        // update layout
        this.detectChanges();
      });
  }

  /**
   * Selection changed
   */
  selectionChanged(): void {
    // update selected
    this._selected = this._agTable.api.getSelectedNodes().map((item) => item.data[this.keyField]);
  }

  /**
   * Sort by - used in AppListTableV2ColumnHeaderComponent even if it is marked as not used...
   */
  columnSortBy(
    component: AppListTableV2ColumnHeaderComponent,
    column: IExtendedColDef,
    direction: RequestSortDirection | null
  ): void {
    // keep old data
    const oldColumn = this._sortBy.column;
    const oldComponent = this._sortBy.component;

    // set data
    this._sortBy.component = component;
    this._sortBy.column = column;
    this._sortBy.direction = direction;

    // redraw the old one ?
    if (
      oldColumn &&
      oldColumn !== column &&
      oldComponent
    ) {
      oldComponent.detectChanges();
    }

    // sort
    this.sortBy.emit({
      field: this._sortBy.column?.columnDefinition.field,
      direction: this._sortBy.direction
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

    // call methods to finish setup - updateColumnDefinitions
    if (this._callWhenReady.updateColumnDefinitions) {
      // call
      this.updateColumnDefinitions(this._callWhenReady.updateColumnDefinitions.overwriteVisibleColumns);
    }

    // call methods to finish setup - retrieveData
    if (this._callWhenReady.retrieveData) {
      // call
      this.retrieveData();
    }

    // call methods to select sort column
    if (this._callWhenReady.setSortColumn) {
      // call
      this.updateSortColumn(
        this._callWhenReady.setSortColumn.field,
        this._callWhenReady.setSortColumn.direction
      );
    }

    // set header height
    this.updateHeaderHeight();
  }

  /**
   * Update header height
   */
  private updateHeaderHeight(): void {
    this._agTable?.api.setHeaderHeight(this.showHeaderFilters ? AppListTableV2Component.STANDARD_HEADER_WITH_FILTER_HEIGHT : AppListTableV2Component.STANDARD_HEADER_HEIGHT);
  }

  /**
   * Save header filter visibility
   */
  private saveHeaderFilterVisibility(): void {
    // display loading spinner while saving
    this.savingHeaderFilterVisibility = true;

    // update layout
    this.detectChanges();

    // update settings
    this.authDataService
      .updateSettingsForCurrentUser({
        [this._pageSettingsKeyHeaderFilter]: this.showHeaderFilters
      })
      .pipe(
        catchError((err) => {
          // error
          this.toastV2Service.error(err);

          // send error down the road
          return throwError(err);
        })
      )
      .subscribe(() => {
        // finished saving
        this.savingHeaderFilterVisibility = false;

        // update layout
        this.detectChanges();
      });
  }

  /**
   * Filter by
   */
  columnFilterBy(column: IExtendedColDef): void {
    // filter
    this.filterBy.emit(column);
  }

  /**
   * Clicked group value
   */
  clickGroupValue(
    groupValue: IV2GroupedDataValue
  ): void {
    // nothing to do ?
    if (!this.groupedData.click) {
      return;
    }

    // reset value
    this.groupedDataOneActive = undefined;

    // same item clicked, then unselect
    if (this._groupedDataPreviousClickedValue === groupValue) {
      // unselect
      delete this._groupedDataPreviousClickedValue.active;
      this._groupedDataPreviousClickedValue = undefined;

      // trigger click
      this.groupedData.click(null, this.groupedData);

      // finished
      return;
    }

    // unselect previous
    if (this._groupedDataPreviousClickedValue) {
      delete this._groupedDataPreviousClickedValue.active;
    }

    // select
    this._groupedDataPreviousClickedValue = groupValue;
    this._groupedDataPreviousClickedValue.active = true;
    this.groupedDataOneActive = true;

    // trigger click
    this.groupedData.click(groupValue, this.groupedData);
  }

  /**
   * Update sort column
   */
  private updateSortColumn(
    field: string,
    direction: RequestSortDirection
  ): void {
    // already called
    delete this._callWhenReady.setSortColumn;

    // reset
    this._sortBy.component = null;

    // retrieve column
    this._sortBy.column = this._agTable.columnApi.getColumn(field).getUserProvidedColDef() as IExtendedColDef;
    this._sortBy.direction = direction;
  }

  /**
   * Show advanced filters
   */
  showAdvancedFilters(): void {
    // no advanced filter type set ?
    if (!this.advancedFilterType) {
      throw new Error('Advanced filter type missing...');
    }

    // display filters dialog
    this.dialogV2Service
      .showSideDialog({
        title: {
          get: () => 'LNG_SIDE_FILTERS_TITLE'
        },
        dontCloseOnBackdrop: true,
        hideInputFilter: true,
        width: AppListTableV2Component.STANDARD_ADVANCED_FILTER_DIALOG_WIDTH,
        inputs: [
          {
            type: V2SideDialogConfigInputType.DROPDOWN_SINGLE,
            placeholder: 'LNG_SIDE_FILTERS_LOAD_FILTER_LABEL',
            name: 'savedFilterList',
            value: undefined,
            options: [],
            clearable: true,
            change: (_data, handler, item: IV2SideDialogConfigInputSingleDropdown) => {
              // get data
              const savedData = item.options.find((option) => option.value === item.value)?.data as SavedFilterModel;
              if (savedData) {
                // load saved filters
                this.loadSavedFilters(
                  handler,
                  handler.data.map.filters as IV2SideDialogConfigInputFilterList,
                  savedData.filterData
                );
              }
            }
          }, {
            type: V2SideDialogConfigInputType.FILTER_LIST,
            name: 'filters',
            options: [],
            filters: [],
            sorts: [],
            operatorValue: RequestFilterOperator.AND
          }
        ],
        bottomButtons: [{
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_SIDE_FILTERS_APPLY_FILTERS_BUTTON',
          color: 'primary',
          key: 'apply',
          disabled: (_data, handler): boolean => {
            return !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.OTHER,
          label: 'LNG_SIDE_FILTERS_SAVE_FILTER_BUTTON',
          color: 'secondary',
          key: 'save',
          disabled: (_data, handler): boolean => {
            const input = handler.data.map.filters as IV2SideDialogConfigInputFilterList;
            return (input.filters.length < 1 && input.sorts.length < 1) || !handler.form || handler.form.invalid;
          }
        }, {
          type: IV2SideDialogConfigButtonType.CANCEL,
          label: 'LNG_COMMON_BUTTON_CANCEL',
          color: 'text'
        }],
        initialized: (handler) => {
          // display loading
          handler.loading.show();

          // construct query for saved filter
          const qb = new RequestQueryBuilder();

          // no need to retrieve all fields
          qb.fields(
            'id',
            'name',
            'readOnly',
            'filterData',
            'userId',
            'createdBy',
            'updatedAt'
          );

          // retrieve created user & modified user information
          qb.include('createdByUser', true);

          // retrieve items specific to our page
          qb.filter.where({
            filterKey: {
              eq: this.advancedFilterType
            }
          });

          // retrieve saved filters
          this.savedFiltersService
            .getSavedFiltersList(qb)
            .subscribe((savedFilters) => {
              // configure saved filters dropdown
              const savedFilterList = handler.data.map.savedFilterList as IV2SideDialogConfigInputSingleDropdown;

              // set saved filters options and other things
              savedFilterList.options = [];
              savedFilters.forEach((item) => {
                // option
                const option: ILabelValuePairModel = {
                  label: item.name,
                  value: item.id,
                  data: item
                };
                savedFilterList.options.push(option);

                // infos
                option.infos = [];

                // set info icons - readonly
                if (item.readOnly) {
                  option.infos.push({
                    label: this.translateService.instant(
                      'LNG_SIDE_FILTERS_LOAD_FILTER_READONLY_LABEL', {
                        name: item.createdByUser?.name ?
                          item.createdByUser?.name :
                          ''
                      }
                    ),
                    icon: 'edit_off'
                  });
                }

                // updated at
                if (item.updatedAt) {
                  option.infos.push({
                    label: this.translateService.instant(
                      'LNG_SIDE_FILTERS_LOAD_FILTER_UPDATED_AT_LABEL', {
                        datetime: moment(item.updatedAt).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT)
                      }
                    ),
                    icon: 'history'
                  });
                }
              });

              // do we need to retrieve other data ?
              const filtersList = (handler.data.map.filters as IV2SideDialogConfigInputFilterList);
              filtersList.options = [];
              const dataToRetrieve: {
                filter: V2AdvancedFilter
              }[] = [];
              this.advancedFilters.forEach((advancedFilter) => {
                // do we need to map questionnaire template to select options ?
                if (advancedFilter.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS) {
                  this.processTemplate(advancedFilter);
                }

                // do we need to load data ?
                if (!advancedFilter.optionsLoad) {
                  // put the exact one in the list
                  (handler.data.map.filters as IV2SideDialogConfigInputFilterList).options.push(advancedFilter);

                  // finished
                  return;
                }

                // add to list of data to retrieve
                dataToRetrieve.push({
                  filter: advancedFilter
                });
              });

              // retrieve data - synchronously
              const nextItem = () => {
                // finished ?
                if (dataToRetrieve.length < 1) {
                  // reload inputs data
                  handler.update.refresh();

                  // put back advanced filters
                  if (
                    this._advancedFiltersApplied && (
                      this._advancedFiltersApplied.appliedFilters.length > 0 ||
                      this._advancedFiltersApplied.appliedSort.length > 0
                    )
                  ) {
                    // load saved filters
                    this.loadSavedFilters(
                      handler,
                      filtersList,
                      this._advancedFiltersApplied
                    );
                  }

                  // hide loading
                  handler.loading.hide();

                  // finished
                  return;
                }

                // get data
                const itemToRetrieve = dataToRetrieve.splice(0, 1)[0];
                itemToRetrieve.filter.optionsLoad((data) => {
                  // clone item
                  const newFilter: V2AdvancedFilter = _.cloneDeep(itemToRetrieve.filter);
                  newFilter.options = data ?
                    data.options :
                    [];

                  // put the exact one in the list
                  (handler.data.map.filters as IV2SideDialogConfigInputFilterList).options.push(newFilter);

                  // next one
                  nextItem();
                });
              };

              // start
              nextItem();
            });
        }
      })
      .subscribe((response) => {
        // cancelled ?
        if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
          return;
        }

        // reset ?
        if (response.button.key === 'reset') {
          // set filter query builder
          this._advancedFiltersQueryBuilder = undefined;
          this._advancedFiltersApplied = undefined;

          // emit the Request Query Builder
          this.advancedFilterBy.emit(this.advancedFiltersQueryBuilder);

          // hide dialog
          response.handler.hide();

          // finished
          return;
        }

        // generate query builder from advanced filters
        const input: IV2SideDialogConfigInputFilterList = response.data.map.filters as IV2SideDialogConfigInputFilterList;
        this.generateQueryBuilderFromAdvancedFilters(
          input.optionsAsLabelValue,
          input.filters,
          input.sorts,
          input.operatorValue,
          input.optionsAsLabelValueMap
        );

        // emit the Request Query Builder
        this.advancedFilterBy.emit(this.advancedFiltersQueryBuilder);

        // finished
        response.handler.hide();

        // after apply - save ?
        if (response.button.key === 'save') {
          // create
          const createFilter = () => {
            this.dialogV2Service
              .showSideDialog({
                title: {
                  get: () => 'LNG_DIALOG_SAVE_FILTERS_TITLE'
                },
                dontCloseOnBackdrop: true,
                hideInputFilter: true,
                width: AppListTableV2Component.STANDARD_ADVANCED_FILTER_DIALOG_WIDTH,
                inputs: [
                  {
                    type: V2SideDialogConfigInputType.TEXT,
                    name: 'filterName',
                    placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_NAME',
                    validators: {
                      required: () => true
                    },
                    value: ''
                  }, {
                    type: V2SideDialogConfigInputType.CHECKBOX,
                    name: 'isPublic',
                    placeholder: 'LNG_SAVED_FILTERS_FIELD_LABEL_PUBLIC',
                    checked: false
                  }
                ],
                bottomButtons: [
                  {
                    type: IV2SideDialogConfigButtonType.OTHER,
                    label: 'LNG_SIDE_FILTERS_SAVE_FILTER_BUTTON',
                    color: 'primary',
                    key: 'save',
                    disabled: (_data, handler): boolean => {
                      return !handler.form || handler.form.invalid;
                    }
                  }, {
                    type: IV2SideDialogConfigButtonType.CANCEL,
                    label: 'LNG_COMMON_BUTTON_CANCEL',
                    color: 'text'
                  }
                ]
              })
              .subscribe((createResponse) => {
                // cancelled ?
                if (createResponse.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                  return;
                }

                // show loading
                createResponse.handler.loading.show();

                // save
                this.savedFiltersService
                  .createFilter(
                    new SavedFilterModel({
                      name: (createResponse.data.map.filterName as IV2SideDialogConfigInputText).value,
                      isPublic: !!(createResponse.data.map.isPublic as IV2SideDialogConfigInputCheckbox).checked,
                      filterKey: this.advancedFilterType,
                      filterData: this._advancedFiltersApplied
                    })
                  )
                  .pipe(
                    catchError((err) => {
                      this.toastV2Service.error(err);
                      return throwError(err);
                    })
                  )
                  .subscribe(() => {
                    // display message
                    this.toastV2Service.success('LNG_SIDE_FILTERS_SAVE_FILTER_SUCCESS_MESSAGE');

                    // finished
                    createResponse.handler.hide();
                  });
              });
          };

          // update or create ?
          const savedFilterList: IV2SideDialogConfigInputSingleDropdown = response.data.map.savedFilterList as IV2SideDialogConfigInputSingleDropdown;
          const authUser: UserModel = this.authDataService.getAuthenticatedUser();
          if (
            savedFilterList.value &&
            SavedFilterModel.canModify(authUser)
          ) {
            // find option
            const loadedData: SavedFilterModel = savedFilterList.options.find((item) => item.value === savedFilterList.value)?.data;
            if (!loadedData.readOnly) {
              // ask if we should update existing or create a new one
              this.dialogV2Service
                .showBottomDialog({
                  config: {
                    title: {
                      get: () => 'LNG_DIALOG_SAVE_FILTERS_UPDATE_OR_CREATE_DIALOG_TITLE'
                    },
                    message: {
                      get: () => 'LNG_DIALOG_SAVE_FILTERS_UPDATE_OR_CREATE_TITLE',
                      data: () => ({
                        filter: loadedData.name
                      })
                    }
                  },
                  dontCloseOnBackdrop: true,
                  bottomButtons: [
                    {
                      type: IV2BottomDialogConfigButtonType.OTHER,
                      label: 'LNG_COMMON_BUTTON_UPDATE',
                      key: 'update',
                      color: 'primary'
                    }, {
                      type: IV2BottomDialogConfigButtonType.OTHER,
                      label: 'LNG_COMMON_BUTTON_CREATE',
                      key: 'create',
                      color: 'primary'
                    }, {
                      type: IV2BottomDialogConfigButtonType.CANCEL,
                      label: 'LNG_DIALOG_CONFIRM_BUTTON_CANCEL',
                      color: 'text'
                    }
                  ]
                })
                .subscribe((bottomResponse) => {
                  // cancel ?
                  if (bottomResponse.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // update / create
                  if (bottomResponse.button.key === 'create') {
                    // create filter
                    createFilter();
                  } else if (bottomResponse.button.key === 'update') {
                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // update
                    this.savedFiltersService
                      .modifyFilter(
                        savedFilterList.value, {
                          filterData: this._advancedFiltersApplied
                        }
                      )
                      .pipe(
                        catchError((err) => {
                          this.toastV2Service.error(err);
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // display message
                        this.toastV2Service.success('LNG_SIDE_FILTERS_MODIFY_FILTER_SUCCESS_MESSAGE');

                        // finished
                        loading.close();
                      });
                  }
                });
            } else {
              // create filter
              createFilter();
            }
          } else {
            // create filter
            createFilter();
          }
        }
      });
  }

  /**
   * Load saved filters
   */
  private loadSavedFilters(
    handler: IV2SideDialogHandler,
    filtersList: IV2SideDialogConfigInputFilterList,
    advancedFiltersApplied: SavedFilterData
  ): void {
    // operator
    filtersList.operatorValue = advancedFiltersApplied.appliedFilterOperator as RequestFilterOperator;

    // reset filters list
    filtersList.filters = [];
    filtersList.sorts = [];

    // add filters
    (advancedFiltersApplied.appliedFilters || []).forEach((appliedFilter) => {
      // add filter
      const advancedFilter = handler.update.addAdvancedFilter(filtersList);

      // set filter by value
      advancedFilter.filterBy.value = appliedFilter.filter.uniqueKey;

      // trigger filter by change
      advancedFilter.filterBy.change(
        handler.data,
        handler,
        advancedFilter as any
      );

      // set comparator value
      advancedFilter.comparator.value = appliedFilter.comparator;

      // trigger comparator change
      advancedFilter.comparator.change(
        handler.data,
        handler,
        advancedFilter as any
      );

      // filter value
      advancedFilter.value = appliedFilter.value;

      // if questionnaire then we need further process
      // - or within address...
      if (
        filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS || (
          filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.ADDRESS &&
          advancedFilter.comparator.value === V2AdvancedFilterComparatorType.WITHIN
        )
      ) {
        // add extra values
        if (filtersList.optionsAsLabelValueMap[advancedFilter.filterBy.value]?.data.type === V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS) {
          handler.update.resetQuestionnaireFilter(advancedFilter);
        }

        // update extra values...values :)
        const valuesToPutBack = { ...appliedFilter.extraValues };
        Object.keys(advancedFilter.extraValues).forEach((prop) => {
          // nothing to do ?
          if (valuesToPutBack[prop] === undefined) {
            return;
          }

          // put back value
          if (prop === 'location') {
            advancedFilter.extraValues[prop] = valuesToPutBack[prop];
          } else {
            advancedFilter.extraValues[prop].value = valuesToPutBack[prop];
          }

          // finished
          // - remove so we know this one was handled
          delete valuesToPutBack[prop];
        });

        // attach remaining options
        Object.keys(valuesToPutBack).forEach((prop) => {
          // put back value
          if (prop === 'location') {
            advancedFilter.extraValues[prop] = valuesToPutBack[prop];
          } else {
            // SHOULDN'T have this case
            // advancedFilter.extraValues[prop].value = valuesToPutBack[prop];
          }
        });
      }
    });

    // add orders
    (advancedFiltersApplied.appliedSort || []).forEach((sortCriteria) => {
      // add sort
      const advancedSort = handler.update.addAdvancedSort(filtersList);

      // setup
      advancedSort.sortBy.value = sortCriteria.sort.uniqueKey;
      advancedSort.order.value = sortCriteria.direction;
    });
  }

  /**
   * Generate query builder from advanced filters
   */
  private generateQueryBuilderFromAdvancedFilters(
    filterOptions: ILabelValuePairModel[],
    appliedFilters: IV2SideDialogConfigInputFilterListFilter[],
    appliedSorts: IV2SideDialogConfigInputFilterListSort[],
    operator: RequestFilterOperator,
    optionsAsLabelValueMap: {
      [optionId: string]: ILabelValuePairModel
    }
  ): void {
    // create a new Request Query Builder
    const queryBuilder = new RequestQueryBuilder();

    // set operator
    queryBuilder.filter.setOperator(operator);

    // map filter definition options
    const filterOptionsMap: {
      [value: string]: V2AdvancedFilter
    } = {};
    filterOptions.forEach((filterOption) => {
      filterOptionsMap[filterOption.value] = filterOption.data;
    });

    // init saved filter
    this._advancedFiltersApplied = new SavedFilterData({});
    this._advancedFiltersApplied.appliedFilterOperator = operator;

    // set conditions
    appliedFilters.forEach((appliedFilter) => {
      // there is no point in adding a condition if no value is provided
      if (
        (
          appliedFilter.value === undefined ||
          appliedFilter.value === null
        ) && (
          appliedFilter.comparator.value !== V2AdvancedFilterComparatorType.HAS_VALUE &&
          appliedFilter.comparator.value !== V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
        )
      ) {
        return;
      }

      // retrieve filter definition
      const filterDefinition: V2AdvancedFilter = filterOptionsMap[appliedFilter.filterBy.value];

      // add to saved filters
      this._advancedFiltersApplied.appliedFilters.push(new SavedFilterDataAppliedFilter({
        filter: {
          uniqueKey: `${filterDefinition.field}${filterDefinition.label}`
        },
        comparator: appliedFilter.comparator.value,
        value: appliedFilter.value,
        extraValues: _.isEmpty(appliedFilter.extraValues) ?
          undefined :
          _.transform(
            appliedFilter.extraValues,
            (acc, value, prop) => {
              // there are cases where we need to save the entire object
              // e.g. - extraValues.location
              acc[prop] = value.name ?
                value.value :
                value;
            },
            {}
          )
      }));

      // do we need to go into a relationship ?
      let qb: RequestQueryBuilder = queryBuilder;
      if (
        filterDefinition.relationshipPath &&
        filterDefinition.relationshipPath.length > 0
      ) {
        _.each(filterDefinition.relationshipPath, (relation) => {
          qb = qb.include(relation).queryBuilder;
        });
      }

      // children query builders
      if (filterDefinition.childQueryBuilderKey) {
        qb = qb.addChildQueryBuilder(
          filterDefinition.childQueryBuilderKey,
          false
        );
      }

      // do we need to merge extra conditions ?
      if (filterDefinition.extraConditions) {
        qb.merge(_.cloneDeep(filterDefinition.extraConditions));
      }

      // check if we need to flag value
      if (filterDefinition.flagIt) {
        // value ?
        let value;
        switch (filterDefinition.type) {
          case V2AdvancedFilterType.NUMBER:
            value = appliedFilter.value && appliedFilter.value !== 0 && typeof appliedFilter.value === 'string' ? parseFloat(appliedFilter.value) : appliedFilter.value;
            break;

          default:
            value = appliedFilter.value;
        }

        // add flag
        if (value !== undefined) {
          qb.filter.flag(
            filterDefinition.field,
            value
          );
        }
      } else {
        // filter
        let searchQb: RequestQueryBuilder;
        switch (filterDefinition.type) {
          case V2AdvancedFilterType.TEXT:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.IS:
                // filter
                qb.filter.byEquality(
                  filterDefinition.field,
                  appliedFilter.value,
                  false,
                  true
                );

                // finished
                break;

              case V2AdvancedFilterComparatorType.CONTAINS_TEXT:
                // filter
                qb.filter.byContainingText(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );

                // finished
                break;

              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(filterDefinition.field);

                // finished
                break;

              // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
              default:
                qb.filter.byText(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.NUMBER:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.BEFORE:
                // filter
                qb.filter.where({
                  [filterDefinition.field]: {
                    lte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                  }
                });

                // finished
                break;

              case V2AdvancedFilterComparatorType.AFTER:
                // filter
                qb.filter.where({
                  [filterDefinition.field]: {
                    gte: _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                  }
                });

                // finished
                break;

              // case FilterComparator.IS:
              default:
                qb.filter.byEquality(
                  filterDefinition.field,
                  _.isString(appliedFilter.value) ? parseFloat(appliedFilter.value) : appliedFilter.value
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.ADDRESS:
          case V2AdvancedFilterType.LOCATION_SINGLE:
          case V2AdvancedFilterType.LOCATION_MULTIPLE:
            // contains / within
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.LOCATION:
                qb.filter.where({
                  [`${filterDefinition.field}.parentLocationIdFilter`]: {
                    inq: appliedFilter.value
                  }
                });
                break;

              case V2AdvancedFilterComparatorType.WITHIN:
                // retrieve location lat & lng
                const geoLocation = _.get(appliedFilter.extraValues, 'location.geoLocation', null);
                const lat: number = geoLocation && (geoLocation.lat || geoLocation.lat === 0) ? parseFloat(geoLocation.lat) : null;
                const lng: number = geoLocation && (geoLocation.lng || geoLocation.lng === 0) ? parseFloat(geoLocation.lng) : null;
                if (
                  lat === null ||
                  lng === null
                ) {
                  break;
                }

                // construct near query
                const nearQuery = {
                  near: {
                    lat: lat,
                    lng: lng
                  }
                };

                // add max distance if provided
                const maxDistance: number = _.get(appliedFilter.extraValues, 'radius.value', null);
                if (maxDistance !== null) {
                  // convert miles to meters
                  (nearQuery as any).maxDistance = Math.round(maxDistance * 1609.34);
                }

                // add filter
                qb.filter.where({
                  [`${filterDefinition.field}.geoLocation`]: nearQuery
                });
                break;

              // V2AdvancedFilterComparatorType.CONTAINS
              default:
                // construct address search qb
                searchQb = AddressModel.buildSearchFilter(
                  appliedFilter.value,
                  filterDefinition.field,
                  (filterDefinition as IV2AdvancedFilterAddress).isArray
                );

                // add condition if we were able to create it
                if (searchQb) {
                  qb.merge(searchQb);
                }
            }

            // finished
            break;

          // filter by phone number
          case V2AdvancedFilterType.ADDRESS_PHONE_NUMBER:
            // construct address phone number search qb
            searchQb = AddressModel.buildPhoneSearchFilter(
              appliedFilter.value,
              filterDefinition.field,
              (filterDefinition as IV2AdvancedFilterAddressPhoneNumber).isArray
            );

            // add condition if we were able to create it
            if (searchQb) {
              qb.merge(searchQb);
            }

            // finished
            break;

          case V2AdvancedFilterType.RANGE_NUMBER:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(filterDefinition.field);

                // finished
                break;

              // others...
              default:
                // between / from / to
                qb.filter.byRange(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.RANGE_AGE:
            // between / from / to
            qb.filter.byAgeRange(
              filterDefinition.field,
              appliedFilter.value,
              false
            );

            // finished
            break;

          case V2AdvancedFilterType.RANGE_DATE:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(filterDefinition.field);

                // finished
                break;

              // others...
              default:
                // between / before / after
                qb.filter.byDateRange(
                  filterDefinition.field,
                  appliedFilter.value,
                  false
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.DATE:
            // between
            const date = appliedFilter.value ?
              null :
              moment(appliedFilter.value);

            // filter
            qb.filter.byDateRange(
              filterDefinition.field,
              date && date.isValid() ?
                {
                  startDate: date.startOf('day'),
                  endDate: date.endOf('day')
                } :
                null,
              false
            );

            // finished
            break;

          case V2AdvancedFilterType.SELECT:
          case V2AdvancedFilterType.MULTISELECT:
            switch (appliedFilter.comparator.value) {
              case V2AdvancedFilterComparatorType.HAS_VALUE:
                // filter
                qb.filter.byHasValue(filterDefinition.field);

                // finished
                break;

              case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                // filter
                qb.filter.byNotHavingValue(filterDefinition.field);

                // finished
                break;

              // FilterComparator.NONE
              default:
                qb.filter.bySelect(
                  filterDefinition.field,
                  appliedFilter.value,
                  false,
                  null
                );
            }

            // finished
            break;

          case V2AdvancedFilterType.QUESTIONNAIRE_ANSWERS:
            // get data
            const question: QuestionModel = optionsAsLabelValueMap[appliedFilter.filterBy.value]?.data.templateOptionsMap[appliedFilter.value]?.data.question;
            const whichAnswer: V2AdvancedFilterQuestionWhichAnswer = appliedFilter.extraValues?.whichAnswer?.value;
            const extraComparator: V2AdvancedFilterComparatorType = appliedFilter.extraValues?.comparator?.value;
            const value: any = appliedFilter.extraValues?.filterValue?.value;
            const whichAnswerDate: IV2DateRange = appliedFilter.extraValues?.whichAnswerDate?.value;

            // we don't need to add filter if no filter value was provided
            if (
              question && (
                !_.isEmpty(value) ||
                _.isBoolean(value) ||
                !_.isEmpty(whichAnswerDate) ||
                extraComparator === V2AdvancedFilterComparatorType.HAS_VALUE ||
                extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
              )
            ) {
              // construct answer date query
              let dateQuery;
              let valueQuery;
              if (!_.isEmpty(whichAnswerDate)) {
                dateQuery = RequestFilterGenerator.dateRangeCompare(whichAnswerDate);
              }

              // take action accordingly to question type
              if (
                !_.isEmpty(value) ||
                _.isBoolean(value) ||
                extraComparator === V2AdvancedFilterComparatorType.HAS_VALUE ||
                extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
              ) {
                switch (question.answerType) {
                  // Text
                  case Constants.ANSWER_TYPES.FREE_TEXT.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.IS:
                        valueQuery = RequestFilterGenerator.textIs(value);
                        break;
                      case V2AdvancedFilterComparatorType.CONTAINS_TEXT:
                        valueQuery = RequestFilterGenerator.textContains(value);
                        break;
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.textStartWith(value);
                    }

                    // finished
                    break;

                  // Date
                  case Constants.ANSWER_TYPES.DATE_TIME.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.dateRangeCompare(value);
                    }

                    // finished
                    break;

                  // Dropdown
                  case Constants.ANSWER_TYPES.SINGLE_SELECTION.value:
                  case Constants.ANSWER_TYPES.MULTIPLE_OPTIONS.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = {
                          inq: value
                        };
                    }

                    // finished
                    break;

                  // Number
                  case Constants.ANSWER_TYPES.NUMERIC.value:
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;

                      // V2AdvancedFilterComparatorType.TEXT_STARTS_WITH
                      default:
                        valueQuery = RequestFilterGenerator.rangeCompare(value);
                    }

                    // finished
                    break;

                  // File
                  case Constants.ANSWER_TYPES.FILE_UPLOAD.value:
                    // neq: null / $eq null doesn't work due to a mongodb bug ( the issue occurs when trying to filter an element from an array which is this case )
                    switch (extraComparator) {
                      case V2AdvancedFilterComparatorType.HAS_VALUE:
                        valueQuery = RequestFilterGenerator.hasValue();
                        break;
                      case V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE:
                        // doesn't have value if handled bellow
                        // NOTHING TO DO
                        break;
                    }

                    // finished
                    break;
                }
              }

              // search through all answers or just the last one ?
              const query: any = {};
              if (
                !whichAnswer ||
                whichAnswer === V2AdvancedFilterQuestionWhichAnswer.LAST_ANSWER
              ) {
                // do we need to attach a value condition as well ?
                if (valueQuery) {
                  query[`${filterDefinition.field}.${question.variable}.0.value`] = valueQuery;
                } else if (extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE) {
                  // handle no value case
                  const condition: any = RequestFilterGenerator.doesntHaveValue(`${filterDefinition.field}.${question.variable}.0.value`);
                  const key: string = Object.keys(condition)[0];
                  query[key] = condition[key];
                }

                // do we need to attach a date condition as well ?
                if (dateQuery) {
                  query[`${filterDefinition.field}.${question.variable}.0.date`] = dateQuery;
                }

                // register query
                qb.filter.where(query);
              } else {
                // do we need to attach a value condition as well ?
                if (valueQuery) {
                  query.value = valueQuery;
                } else if (extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE) {
                  // handle no value case
                  const condition: any = RequestFilterGenerator.doesntHaveValue(
                    'value',
                    true
                  );
                  const key: string = Object.keys(condition)[0];
                  query[key] = condition[key];
                }

                // do we need to attach a date condition as well ?
                if (dateQuery) {
                  query.date = dateQuery;
                }

                // add extra check if date not provided and we need to retrieve all records that don't have a value
                if (
                  !dateQuery &&
                  extraComparator === V2AdvancedFilterComparatorType.DOESNT_HAVE_VALUE
                ) {
                  qb.filter.where({
                    or: [
                      {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          $elemMatch: query
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          exists: false
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          type: 'null'
                        }
                      }, {
                        [`${filterDefinition.field}.${question.variable}`]: {
                          size: 0
                        }
                      }
                    ]
                  });
                } else {
                  qb.filter.where({
                    [`${filterDefinition.field}.${question.variable}`]: {
                      $elemMatch: query
                    }
                  });
                }
              }
            }

            // finished
            break;
        }
      }
    });

    // set sorts
    const objectDetailsSort: {
      [property: string]: string[]
    } = {
      age: ['years', 'months']
    };
    appliedSorts.forEach((appliedSort) => {
      // retrieve field
      // retrieve filter definition
      const filterDefinition: V2AdvancedFilter = filterOptionsMap[appliedSort.sortBy.value];

      // no field - shouldn't encounter this case...
      if (!filterDefinition.field) {
        return;
      }

      // add to saved filters
      this._advancedFiltersApplied.appliedSort.push(new SavedFilterDataAppliedSort({
        sort: {
          uniqueKey: `${filterDefinition.field}${filterDefinition.label}`
        },
        direction: appliedSort.order.value
      }));

      // add sorting criteria
      if (
        objectDetailsSort &&
        objectDetailsSort[appliedSort.sortBy.value]
      ) {
        objectDetailsSort[appliedSort.sortBy.value].forEach((childProperty) => {
          queryBuilder.sort.by(
            `${filterDefinition.field}.${childProperty}`,
            appliedSort.order.value as RequestSortDirection
          );
        });
      } else {
        queryBuilder.sort.by(
          filterDefinition.field,
          appliedSort.order.value as RequestSortDirection
        );
      }
    });

    // set filter query builder
    this._advancedFiltersQueryBuilder = queryBuilder;
  }

  /**
   * Process template
   */
  private processTemplate(advancedFilter: IV2AdvancedFilterQuestionnaireAnswers): void {
    // get template questions
    const questions = advancedFilter.template() || [];

    // reset template options
    advancedFilter.templateOptions = [];
    advancedFilter.templateOptionsMap = {};

    // add question to list
    const addQuestion = (
      question: QuestionModel,
      prefixOrder: string,
      multiAnswerParent: boolean
    ) => {
      // add question to list
      const orderLabel: string = (
        prefixOrder ?
          (prefixOrder + '.') :
          ''
      ) + question.order;
      const label: string = `${orderLabel} ${this.translateService.instant(question.text)}`;

      // create option
      const options = {
        label,
        value: question.variable,
        data: {
          question,
          label,
          multiAnswerParent: multiAnswerParent
        }
      };

      // add to list of questions
      advancedFilter.templateOptions.push(options);

      // map question for easy access
      advancedFilter.templateOptionsMap[question.variable] = options;

      // add recursive sub-questions
      if (
        question.answers &&
        question.answers.length > 0
      ) {
        question.answers.forEach((answer: AnswerModel) => {
          if (
            answer.additionalQuestions &&
            answer.additionalQuestions.length > 0
          ) {
            answer.additionalQuestions
              // ignore some types of questions
              .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
              .forEach((childQuestion: QuestionModel, index: number) => {
                childQuestion.order = index + 1;
                addQuestion(
                  childQuestion,
                  orderLabel,
                  multiAnswerParent
                );
              });
          }
        });
      }
    };

    // determine list of questions to display
    questions
      // ignore some types of questions
      .filter((adQuestion) => adQuestion.answerType !== Constants.ANSWER_TYPES.MARKUP.value)
      .forEach((question: QuestionModel, index: number) => {
        question.order = index + 1;
        addQuestion(
          question,
          '',
          question.multiAnswer
        );
      });
  }

  /**
   * Convert advanced filters to save data
   */
  advancedFiltersToSaveData(): SavedFilterData {
    // nothing to save ?
    if (!this._advancedFiltersApplied) {
      return null;
    }

    // save data
    return this._advancedFiltersApplied;
  }

  /**
   * Convert saved data to advanced filters
   */
  generateFiltersFromFilterData(savedData: SavedFilterData): void {
    // set data
    this._advancedFiltersApplied = savedData;
  }
}
