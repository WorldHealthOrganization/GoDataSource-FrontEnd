import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { GridReadyEvent, IsFullWidthRowParams, RowHeightParams, RowNode, ValueFormatterParams } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import * as _ from 'lodash';
import { moment } from '../../../core/helperClasses/x-moment';
import { Constants } from '../../../core/models/constants';
import { Location } from '@angular/common';
import { Params, Router } from '@angular/router';
import {
  IV2Column,
  IV2ColumnAction,
  IV2ColumnBasic,
  IV2ColumnBasicFormat,
  IV2ColumnButton,
  IV2ColumnColor,
  IV2ColumnExpandRow,
  IV2ColumnHTML,
  IV2ColumnIconMaterial,
  IV2ColumnIconURL,
  IV2ColumnLinkList,
  IV2ColumnPinned,
  IV2ColumnStatus,
  IV2ColumnStatusFormType,
  V2ColumnFormat,
  V2ColumnStatusForm
} from './models/column.model';
import { AppListTableV2ActionsComponent } from './components/actions/app-list-table-v2-actions.component';
import { IExtendedColDef } from './models/extended-column.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel, IV2GroupActions, IV2Link, V2ActionType } from './models/action.model';
import { IV2GroupedData, IV2GroupedDataValue } from './models/grouped-data.model';
import { IBasicCount } from '../../../core/models/basic-count.interface';
import { PageEvent } from '@angular/material/paginator';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputCheckbox, V2SideDialogConfigInput, V2SideDialogConfigInputType } from '../app-side-dialog-v2/models/side-dialog-config.model';
import { UserModel, UserSettings } from '../../../core/models/user.model';
import { AuthDataService } from '../../../core/services/data/auth.data.service';
import { catchError } from 'rxjs/operators';
import { AppListTableV2ButtonComponent } from './components/button/app-list-table-v2-button.component';
import { ToastV2Service } from '../../../core/services/helper/toast-v2.service';
import { AppListTableV2SelectionHeaderComponent } from './components/selection-header/app-list-table-v2-selection-header.component';
import { AppListTableV2ColumnHeaderComponent } from './components/column-header/app-list-table-v2-column-header.component';
import { RequestQueryBuilder, RequestSortDirection } from '../../../core/helperClasses/request-query-builder';
import { AppListTableV2LoadingComponent } from './components/loading/app-list-table-v2-loading.component';
import { AppListTableV2NoDataComponent } from './components/no-data/app-list-table-v2-no-data.component';
import { GridApi } from '@ag-grid-community/core/dist/cjs/es5/gridApi';
import { ColumnApi } from '@ag-grid-community/core/dist/cjs/es5/columns/columnApi';
import { V2AdvancedFilter } from './models/advanced-filter.model';
import { SavedFilterData } from '../../../core/models/saved-filters.model';
import { ILabelValuePairModel } from '../../forms-v2/core/label-value-pair.model';
import { IV2ProcessSelectedData } from './models/process-data.model';
import { HighlightSearchPipe } from '../../pipes/highlight-search/highlight-search';
import { AppListTableV2ObfuscateComponent } from './components/obfuscate/app-list-table-v2-obfuscate.component';
import { determineIfSmallScreenMode } from '../../../core/methods/small-screen-mode';
import { AppListTableV2DetailRowComponent } from './components/detail/app-list-table-v2-detail-row.component';
import { AppListTableV2DetailColumnComponent } from './components/detail/app-list-table-v2-detail-column.component';
import { IV2RowExpandRow, V2RowType } from './models/row.model';
import { determineIfTouchDevice } from '../../../core/methods/touch-device';
import { I18nService } from '../../../core/services/helper/i18n.service';

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
  private static readonly STANDARD_COLUMN_PADDING: number = 8;
  private static readonly STANDARD_COLUMN_MARGIN: number = 1;
  private static readonly STANDARD_COLUMN_MAX_DEFAULT_WIDTH: number = 400;
  private static readonly STANDARD_COLUMN_ACTION_WIDTH: number = 24;
  private static readonly STANDARD_COLUMN_ACTION_GAP: number = 8;
  private static readonly STANDARD_SELECT_COLUMN_WIDTH: number = 42;
  private static readonly STANDARD_OBFUSCATED_COLUMN_WIDTH: number = 400;
  static readonly STANDARD_SHAPE_SIZE: number = 12;
  static readonly STANDARD_SHAPE_GAP: number = 6;
  static readonly STANDARD_SHAPE_PADDING: number = 14;
  private static readonly STANDARD_HEADER_HEIGHT: number = 40;
  private static readonly STANDARD_HEADER_WITH_FILTER_HEIGHT: number = 88;
  private static readonly STANDARD_ROW_HEIGHT: number = 40;
  private static readonly STANDARD_DETAILS_ROW_HEIGHT: number = 250;

  // small screen mode ?
  isSmallScreenMode: boolean = false;

  // check if this is a touch device
  isTouchDevice: boolean = determineIfTouchDevice();

  // language handler
  languageSubscription: Subscription;

  // records
  recordsSubscription: Subscription;
  private _recordsData: any[];
  private _recordsDataMap: {
    [id: string]: any
  } = {};
  private _records$: Observable<any[]>;
  @Input() set records$(records$: Observable<any[]>) {
    // set the new observable
    this._records$ = records$;

    // retrieve data
    this.retrieveData();
  }
  get recordsData(): any[] {
    return this._recordsData;
  }

  // process rows data
  @Input() processSelectedData: IV2ProcessSelectedData[];
  private _processedSelectedResults: {
    [key: string]: any
  } = {};
  get processedSelectedResults(): {
    [key: string]: any
  } {
    return this._processedSelectedResults;
  }

  // table column actions
  // no need to create setter and call updateColumnDefinitions, because for now columnActions is always initialized before columns, and it shouldn't be changed after that
  @Input() columnActions: IV2ColumnAction;

  // columns
  private _columns: IV2Column[];
  @Input() set columns(columns: IV2Column[]) {
    // set data
    this._columns = columns;

    // determine if we have at least one header filter
    this.hasTableHeaderFilters = false;
    (this._columns || []).forEach((column) => {
      if (column.filter) {
        this.hasTableHeaderFilters = true;
      }
    });

    // set header height
    this.updateHeaderHeight();

    // update columns definitions
    this.updateColumnDefinitions();

    // some type of columns should have a fixed width
    this.adjustFixedSizeColumns();
  }
  get columns(): IV2Column[] {
    return this._columns;
  }

  // paginator disabled ?
  @Input() paginatorDisabled: boolean = false;

  // refresh list disabled ?
  @Input() refreshDisabled: boolean = false;

  // has at least one table header filter ?
  hasTableHeaderFilters: boolean = false;

  // allow user to block hiding table filters
  @Input() canHideTableHeaderFilters: boolean = true;

  // ag table api handlers
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
  get agTable(): {
    api: GridApi,
    columnApi: ColumnApi
  } {
    return this._agTable;
  }

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

  // view action
  @Input() viewAction: IV2Link;

  // quick actions
  @Input() quickActions: IV2ActionMenuLabel;

  // group actions
  @Input() groupActions: IV2GroupActions;
  @Input() groupActionsSingleRecord: boolean;

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

  // advanced filters config
  @Input() advancedFiltersConfig: {
    operatorHide?: boolean,
    disableAdd?: boolean,
    disableReset?: boolean,
    disableDelete?: boolean
  };

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
    return this.hasTableHeaderFilters && (
      !this.canHideTableHeaderFilters ||
      this._showHeaderFilters
    );
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
  @Output() filterBy = new EventEmitter<{
    column: IExtendedColDef,
    valueOverwrite?: any
  }>();
  @Output() advancedFilterBy = new EventEmitter<RequestQueryBuilder>();

  // reset header filters
  @Output() resetHeaderFilters = new EventEmitter<void>();

  // saving columns
  savingColumns: boolean = false;

  // uses expandable rows ?
  private _needsExpandRow: boolean = false;
  set needsExpandRow(needsExpandRow: boolean) {
    // set value
    const changed: boolean = this._needsExpandRow !== needsExpandRow;
    this._needsExpandRow = needsExpandRow;

    // update ag grid
    if (
      changed &&
      this._agTable?.api
    ) {
      // do we have data ?
      if (this._recordsData?.length > 0) {
        // update row data
        if (!this.needsExpandRow) {
          // filter out expandable rows, since we don't have any expandable columns anymore
          this._recordsData = this._recordsData.filter((row) => (row as IV2RowExpandRow).type !== V2RowType.EXPAND_ROW);

          // update rows
          this._agTable.api.setRowData(this._recordsData);
        } else {
          // as a precaution check that we don't have already expandable rows, we shouldn't ...but who knows
          const hasExpandableRows: boolean = !!this._recordsData.find((row) => (row as IV2RowExpandRow).type === V2RowType.EXPAND_ROW);

          // add expandable rows details
          if (!hasExpandableRows) {
            // add expandable rows
            this._recordsData = this.addExpandableRowDetails(this._recordsData);

            // update rows
            this._agTable.api.setRowData(this._recordsData);
          } else {
            // just filter data
            this._agTable.api.onFilterChanged();
          }
        }
      } else {
        // just update to know that we need to filter later
        this._agTable.api.onFilterChanged();
      }
    }
  }
  get needsExpandRow(): boolean {
    return this._needsExpandRow;
  }

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
  get hasUserSettings(): boolean {
    return !!this._pageSettingsKey;
  }

  // collapse / expand bottom section
  bottomSectionIsCollapsed: boolean = false;
  bottomSectionSavingConfig: boolean = false;
  private _pageSettingsKeyBottomSectionCollapsed: string = 'bottomSectionCollapsed';

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
        this.infosJoined += `<div>${this.i18nService.instant(info)}</div>`;
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

  // custom legends not related to columns
  private _suffixLegendsHTML: {
    // required
    html: string;
  }[] = [];
  private _suffixLegends: ILabelValuePairModel[];
  @Input() set suffixLegends(suffixLegends: ILabelValuePairModel[]) {
    // set data
    this._suffixLegends = suffixLegends;

    // generate html
    this._suffixLegendsHTML = [];
    if (suffixLegends?.length > 0) {
      suffixLegends.forEach((item) => {
        // simple item ?
        if (Array.isArray(item.value)) {
          // create html
          let html: string = `<span class="gd-list-table-bottom-left-legend-title">${this.i18nService.instant(item.label)}</span><span class="gd-list-table-bottom-left-legend-items">`;
          (item.value as ILabelValuePairModel[]).forEach((subItem) => {
            html += `<span class="gd-list-table-bottom-left-legend-items-item">${AppListTableV2Component.renderStatusForm({ type: IV2ColumnStatusFormType.SQUARE, color: subItem.color }, false)} ${this.i18nService.instant(subItem.label)}</span>`;
          });

          // close items list
          html += '</span>';

          // add legend
          this._suffixLegendsHTML.push({
            html
          });
        } else {
          this._suffixLegendsHTML.push({
            html: `<span class="gd-list-table-bottom-left-legend-title">${this.i18nService.instant(item.label)}</span><span class="gd-list-table-bottom-left-legend-items"><span class="gd-list-table-bottom-left-legend-items-item">${item.value}</span></span>`
          });
        }
      });
    }
  }
  get suffixLegends(): ILabelValuePairModel[] {
    return this._suffixLegends;
  }

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

  // timers
  private _resizeTableTimer: number;

  // constants
  AppListTableV2LoadingComponent = AppListTableV2LoadingComponent;
  AppListTableV2NoDataComponent = AppListTableV2NoDataComponent;
  AppListTableV2DetailRowComponent = AppListTableV2DetailRowComponent;
  Constants = Constants;

  /**
   * Render status form
   */
  static renderStatusForm(
    form: V2ColumnStatusForm,
    addGap: boolean
  ): string {
    let statusHtml: string = `<svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">`;
    switch (form.type) {
      case IV2ColumnStatusFormType.CIRCLE:
        statusHtml += `${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
          <circle fill="${form.color}" cx="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" cy="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" r="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" />`;

        // finished
        break;

      case IV2ColumnStatusFormType.SQUARE:
        statusHtml += `${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
          <rect fill="${form.color}" width="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" />`;

        // finished
        break;

      case IV2ColumnStatusFormType.TRIANGLE:
        statusHtml += `${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
          <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2} 0, 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE}, ${AppListTableV2Component.STANDARD_SHAPE_SIZE} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}"/>`;

        // finished
        break;

      case IV2ColumnStatusFormType.STAR:
        statusHtml += `${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
          <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2},0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.2},${AppListTableV2Component.STANDARD_SHAPE_SIZE} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.95},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.4} 0,${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.4} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.8},${AppListTableV2Component.STANDARD_SHAPE_SIZE}" />`;

        // finished
        break;

      case IV2ColumnStatusFormType.HEXAGON:
        statusHtml += `${form.tooltip ? `<title>${form.tooltip}</title>` : ''}
          <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE}, ${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.8},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.93} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.25},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.93} 0,${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}, ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.25},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.06} ${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.75},${AppListTableV2Component.STANDARD_SHAPE_SIZE * 0.06}" />`;

        // finished
        break;

      default:
      // case IV2ColumnStatusFormType.EMPTY:
        // nothing to do, empty svg is enough
        // finished
        break;
    }

    // close svg
    statusHtml += '</svg>';

    // finished
    return statusHtml;
  }

  /**
   * Retrieve row height
   */
  getRowHeight: (params: RowHeightParams) => number = (params: RowHeightParams): number => {
    return params.data?.type === V2RowType.EXPAND_ROW ?
      AppListTableV2Component.STANDARD_DETAILS_ROW_HEIGHT :
      AppListTableV2Component.STANDARD_ROW_HEIGHT;
  };

  /**
   * Is full width row ?
   */
  isFullWidthRow: (params: IsFullWidthRowParams) => boolean = (params: IsFullWidthRowParams): boolean => {
    return params.rowNode?.data?.type === V2RowType.EXPAND_ROW;
  };

  /**
   * Hide rows if necessary
   */
  doesExternalFilterPass: (node: RowNode) => boolean = (node: RowNode): boolean => {
    return node.data?.type === V2RowType.EXPAND_ROW ?
      !!(node.data as IV2RowExpandRow).visible :
      true;
  };

  /**
   * Is external filter present ?
   */
  isExternalFilterPresent: () => boolean = (): boolean => {
    return this.needsExpandRow;
  };

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService,
    protected location: Location,
    protected renderer2: Renderer2,
    protected elementRef: ElementRef,
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected authDataService: AuthDataService,
    protected toastV2Service: ToastV2Service
  ) {
    // update bottom section collapse / expand
    this.loadBottomSectionConfig();
  }

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

        // retrieve url
        let url: string = event.target.getAttribute('is-link');

        // remove params
        const urlQuestionIndex: number = url.indexOf('?');
        let params: Params;
        if (urlQuestionIndex > -1) {
          // retrieve params
          const urlParams: string = url.substring(urlQuestionIndex + 1);
          if (urlParams) {
            const urlSearchParams: any = new URLSearchParams(urlParams);
            params = Object.fromEntries(urlSearchParams.entries());
          }

          // strip params
          url = url.substring(0, urlQuestionIndex);
        }

        // redirect
        this.router.navigate(
          [url], {
            queryParams: params
          }
        );
      }
    );

    // update filter visibility
    const authUser: UserModel = this.authDataService.getAuthenticatedUser();
    const filterVisibility: boolean | undefined = this._pageSettingsKeyHeaderFilter ?
      authUser.getSettings(this._pageSettingsKeyHeaderFilter) :
      undefined;
    this._showHeaderFilters = filterVisibility === undefined || filterVisibility;

    // update small screen mode
    // - calls this.resizeTable
    this.updateRenderMode();

    // subscribe to language change
    this.initializeLanguageChangeListener();
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

    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // stop previous
    this.stopResizeTableTimer();
  }

  /**
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageChangeListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        this.updateColumnDefinitions();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageChangeListener(): void {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
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
      this._recordsData = [];
      this._recordsDataMap = {};
      this._processedSelectedResults = {};
      this._agTable.api.setRowData(this._recordsData);
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

        // must always have an array
        data = data || [];

        // add expand rows if necessary
        if (this.needsExpandRow) {
          data = this.addExpandableRowDetails(data);
        }

        // set data & hide loading overlay
        this._recordsData = data;
        this._processedSelectedResults = {};
        this._agTable.api.setRowData(this._recordsData);

        // map data
        this._recordsDataMap = {};
        this._recordsData.forEach((record) => {
          this._recordsDataMap[record[this.keyField]] = record;
        });

        // unselect everything
        this._agTable.api.deselectAll();

        // some type of columns should have a fixed width
        this.adjustFixedSizeColumns();

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

    // nothing to do ?
    if (!this._columns) {
      // reset
      this.needsExpandRow = false;
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
    const visibleColumnsMap: {
      [field: string]: IV2Column
    } = {};

    // load column settings
    const authUser: UserModel = this.authDataService.getAuthenticatedUser();

    // visible columns
    if (overwriteVisibleColumns) {
      visibleColumns = overwriteVisibleColumns;
    } else {
      visibleColumns = this._pageSettingsKey ?
        authUser.getSettings(this._pageSettingsKey) :
        undefined;
      visibleColumns = visibleColumns ? visibleColumns : [];
    }

    // left pinned columns
    leftPinnedColumns = this._pageSettingsKeyLPinned ?
      authUser.getSettings(this._pageSettingsKeyLPinned) :
      undefined;
    leftPinnedColumns = leftPinnedColumns ? leftPinnedColumns : [];

    // right pinned columns
    rightPinnedColumns = this._pageSettingsKeyRPinned ?
      authUser.getSettings(this._pageSettingsKeyRPinned) :
      undefined;
    rightPinnedColumns = rightPinnedColumns ? rightPinnedColumns : [];

    // mark visible columns if we have any
    if (visibleColumns.length > 0) {
      // map visible columns
      visibleColumns.forEach((field) => {
        visibleColumnsMap[field] = null;
      });

      // make columns visible
      this._columns.forEach((column) => {
        // set not visible
        const isVisible: boolean = visibleColumnsMap[column.field] !== undefined ||
          !!column.alwaysVisible;
        column.notVisible = !isVisible;

        // update map if found
        if (isVisible) {
          visibleColumnsMap[column.field] = column;
        }
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
    if (
      this.groupActionsSingleRecord || (
        this.groupActions && (
          !this.groupActions.visible ||
          this.groupActions.visible()
        ) &&
        this.groupActions.actions?.length > 0
      )
    ) {
      columnDefs.push({
        pinned: this.isSmallScreenMode ?
          false :
          IV2ColumnPinned.LEFT,
        headerName: '',
        field: this.keyField,
        checkboxSelection: true,
        cellClass: 'gd-cell-no-focus',
        suppressMovable: true,
        lockPosition: 'left',
        headerComponent: AppListTableV2SelectionHeaderComponent,
        width: AppListTableV2Component.STANDARD_SELECT_COLUMN_WIDTH,
        valueFormatter: () => '',
        columnDefinitionData: this,
        columnDefinition: {
          format: {
            type: V2ColumnFormat.ACTIONS
          },
          actions: [{
            type: V2ActionType.MENU,
            icon: 'expand_more',
            menuOptions: this.groupActionsSingleRecord ?
              [
                ...(this.groupActions?.actions?.length > 0 ? this.groupActions.actions : [])
              ] : [
                {
                  label: {
                    get: () => 'LNG_LIST_PAGES_BUTTON_BULK_ACTIONS_CHECK_ALL'
                  },
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
                  label: {
                    get: () => 'LNG_LIST_PAGES_BUTTON_BULK_ACTIONS_UNCHECK_ALL'
                  },
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
                ...(this.groupActions?.actions?.length > 0 ? this.groupActions.actions : [])
              ]
          }]
        }
      });
    }

    // render columns
    const renderColumn = (column: IV2Column) => {
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

      // attach column to list of visible columns
      columnDefs.push({
        headerName: column.label && column.format?.type !== V2ColumnFormat.STATUS ?
          this.i18nService.instant(column.label) :
          '',
        field: column.field,
        pinned: this.isSmallScreenMode ?
          false :
          pinned,
        resizable: !column.notResizable,
        columnDefinition: column,
        columnDefinitionData: this,
        cellClass: column.cssCellClass,
        valueFormatter: (valueFormat): string => {
          return this.formatValue(valueFormat);
        },
        cellRenderer: this.handleCellRenderer(column),
        suppressMovable: this.isSmallScreenMode ?
          true :
          !!(column as any).notMovable,
        lockPosition: column.lockPosition,
        headerComponent: AppListTableV2ColumnHeaderComponent
      });
    };

    // keep order of columns
    if (
      visibleColumns &&
      visibleColumns.length > 0
    ) {
      // render column in order of visibility
      // - order changed by user
      visibleColumns.forEach((field) => {
        // not found in definitions ?
        if (!visibleColumnsMap[field]) {
          // don't render it
          // - it might've been removed from definitions
          return;
        }

        // render column
        renderColumn(visibleColumnsMap[field]);
      });

      // render always visible columns too
      this._columns.forEach((column) => {
        // no always visible ?
        if (!column.alwaysVisible) {
          return;
        }

        // render column
        renderColumn(column);
      });
    } else {
      // process columns in default order
      this._columns.forEach((column) => {
        renderColumn(column);
      });
    }

    // legends should always be visible no matter if the column is visible because legends might contain information from other columns too and not only from the one that isn't visible
    this.legends = [];
    this._columns.forEach((column) => {
      // update legends
      if (column.format?.type === V2ColumnFormat.STATUS) {
        // get column def
        const statusColumn = column as IV2ColumnStatus;

        // go through legends
        statusColumn.legends.forEach((legend) => {
          // render legends
          let html: string = `<span class="gd-list-table-bottom-left-legend-title">${this.i18nService.instant(legend.title)}</span><span class="gd-list-table-bottom-left-legend-items">`;

          // render legend
          legend.items
            .sort((item1, item2) => {
              // if same order, compare labels
              if (item1.order === item2.order) {
                return this.i18nService
                  .instant(item1.label)
                  .localeCompare(this.i18nService.instant(item2.label));
              }

              // format order
              let order1: number = Number.MAX_SAFE_INTEGER;
              try {
                order1 = typeof item1.order === 'number' ? item1.order : parseInt(item1.order, 10);
                order1 = isNaN(order1) ? Number.MAX_SAFE_INTEGER : order1;
              } catch (e) {}
              let order2: number = Number.MAX_SAFE_INTEGER;
              try {
                order2 = typeof item2.order === 'number' ? item2.order : parseInt(item2.order, 10);
                order2 = isNaN(order2) ? Number.MAX_SAFE_INTEGER : order2;
              } catch (e) {}

              // compare order
              return order1 - order2;
            })
            .forEach((legendItem) => {
              html += `<span class="gd-list-table-bottom-left-legend-items-item">
                ${AppListTableV2Component.renderStatusForm(legendItem.form, false)} ${this.i18nService.instant(legendItem.label)}
              </span>`;
            });

          // close items list
          html += '</span>';

          // add to legends to render
          this.legends.push({
            html
          });
        });
      }
    });

    // attach actions column to the start or to the end depending on if small or big screen
    if (this.columnActions) {
      // create action column
      const actionColumn: IExtendedColDef = {
        headerName: '',
        field: 'actions',
        pinned: this.isSmallScreenMode ?
          false :
          IV2ColumnPinned.RIGHT,
        resizable: false,
        columnDefinition: this.columnActions,
        columnDefinitionData: this,
        cellClass: 'gd-cell-no-focus',
        cellRenderer: this.handleCellRenderer(this.columnActions),
        suppressMovable: true,
        lockPosition: this.isSmallScreenMode ?
          'left' :
          'right',
        headerComponent: AppListTableV2ColumnHeaderComponent
      };

      // attach column to list of visible columns depending on screen size
      if (this.isSmallScreenMode) {
        // add it to the beginning
        columnDefs.splice(
          this.groupActionsSingleRecord || (
            this.groupActions && (
              !this.groupActions.visible ||
              this.groupActions.visible()
            ) &&
            this.groupActions.actions?.length > 0
          ) ? 1 : 0,
          0,
          actionColumn
        );
      } else {
        // add it to the end
        columnDefs.push(actionColumn);
      }
    }

    // add suffix legends
    this.legends.push(...this._suffixLegendsHTML);

    // update column defs
    this._agTable.api.setColumnDefs(columnDefs);

    // determine if we need to display expandable row
    let needsExpandRow: boolean = false;
    for (let columnIndex: number = 0; columnIndex < columnDefs.length; columnIndex++) {
      // retrieve column definition
      const extendedColDef: IExtendedColDef = columnDefs[columnIndex];
      if (extendedColDef.columnDefinition?.format?.type === V2ColumnFormat.EXPAND_ROW) {
        // needs row expansion
        needsExpandRow = true;

        // finished
        break;
      }
    }

    // update row expand
    this.needsExpandRow = needsExpandRow;

    // re-render page
    this.detectChanges();

    // update table size
    this.resizeTable();
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
        // determine value
        const tmpValue: any = _.get(
          valueFormat.data,
          columnDefinition.format.type as string
        );

        // empty value ?
        if (
          tmpValue === undefined ||
          tmpValue === null
        ) {
          return '';
        }

        // finished
        return tmpValue;
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
              fieldValue?.months + ' ' + this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS') :
              (
                fieldValue?.years > 0 ?
                  (fieldValue?.years + ' ' + this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS')) :
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
              this.i18nService.instant('LNG_COMMON_LABEL_YES') :
              this.i18nService.instant('LNG_COMMON_LABEL_NO');

          // COLOR & ICON
          case V2ColumnFormat.COLOR:
          case V2ColumnFormat.ICON_URL:
          case V2ColumnFormat.ICON_MATERIAL:
            return fieldValue;

          // nothing to do
          case V2ColumnFormat.STATUS:
          case V2ColumnFormat.BUTTON:
          case V2ColumnFormat.ACTIONS:
          case V2ColumnFormat.LINK_LIST:
          case V2ColumnFormat.HTML:
          case V2ColumnFormat.EXPAND_ROW:

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
    return typeof valueFormat.value === 'string' ?
      (
        valueFormat.value ?
          this.i18nService.instant(valueFormat.value) :
          ''
      ) : (
        valueFormat.value === null || valueFormat.value === undefined ?
          '' :
          valueFormat.value
      );
  }

  /**
   * Custom renderer
   */
  private handleCellRenderer(column: IV2Column | IV2ColumnAction): any {
    // obfuscate ?
    const basicColumn: IV2ColumnBasic = column as IV2ColumnBasic;
    if (basicColumn.format?.obfuscated) {
      return AppListTableV2ObfuscateComponent;
    }

    // link ?
    if (basicColumn.link) {
      return (params: ValueFormatterParams) => {
        // determine value
        let value: string = this.formatValue(params);

        // do we need to highlight anything ?
        if ((column as any).highlight) {
          // highlight text if necessary
          value = HighlightSearchPipe.highlight(
            value,
            (column as any).highlight
          );
        }

        // retrieve url link
        const url: string = value ?
          basicColumn.link(params.data) :
          undefined;

        // create link
        return url ?
          `<a class="gd-list-table-link" href="${this.location.prepareExternalUrl(url)}"><span is-link="${url}">${value}</span></a>` :
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
            `<div class="gd-list-table-color"><span style="background-color: ${value};"></span> ${value}</div>` :
            this.i18nService.instant(colorColumn.noColorLabel);
        };
      }

      // URL icon ?
      const URLIconColumn: IV2ColumnIconURL = column as IV2ColumnIconURL;
      if (
        URLIconColumn.format &&
        URLIconColumn.format.type === V2ColumnFormat.ICON_URL
      ) {
        return (params: ValueFormatterParams) => {
          // determine value
          const value: string = this.formatValue(params);

          // create color display
          return value ?
            `<img class="gd-list-table-icon-url" src="${value}" alt="${URLIconColumn.noIconLabel}" />` :
            this.i18nService.instant(URLIconColumn.noIconLabel);
        };
      }

      // material icon ?
      const materialIconColumn: IV2ColumnIconMaterial = column as IV2ColumnIconMaterial;
      if (
        materialIconColumn.format &&
        materialIconColumn.format.type === V2ColumnFormat.ICON_MATERIAL
      ) {
        return (params: ValueFormatterParams) => {
          // determine value
          const value: string = this.formatValue(params);

          // create color display
          return value ?
            `<span class="gd-list-table-icon-material"><span class="material-icons">${value}</span></span>` :
            this.i18nService.instant(materialIconColumn.noIconLabel);
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

      // link list
      const linkListColumn: IV2ColumnLinkList = column as IV2ColumnLinkList;
      if (
        linkListColumn.format &&
        linkListColumn.format.type === V2ColumnFormat.LINK_LIST
      ) {
        return (params: ValueFormatterParams) => {
          // create links
          return (linkListColumn.links(params.data) || [])
            .map((item) => item.href ?
              `<a class="gd-list-table-link" href="${this.location.prepareExternalUrl(item.href)}"><span is-link="${item.href}">${item.label}</span></a>` :
              item.label
            )
            .join(' / ');
        };
      }

      // html
      const htmlColumn: IV2ColumnHTML = column as IV2ColumnHTML;
      if (
        htmlColumn.format &&
        htmlColumn.format.type === V2ColumnFormat.HTML
      ) {
        return (params: ValueFormatterParams) => {
          // html
          return htmlColumn.html(
            params.data,
            htmlColumn
          );
        };
      }

      // expand column
      const expandColumn: IV2ColumnExpandRow = column as IV2ColumnExpandRow;
      if (
        expandColumn.format &&
        expandColumn.format.type === V2ColumnFormat.EXPAND_ROW
      ) {
        return AppListTableV2DetailColumnComponent;
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
            statusHtml += AppListTableV2Component.renderStatusForm(
              form,
              formIndex < forms.length - 1
            );
          });

          // finished
          return statusHtml;
        };
      }
    }

    // do we need to highlight anything ?
    if ((column as any).highlight) {
      return (params: ValueFormatterParams) => {
        // determine value
        let value: any = this.formatValue(params);

        // highlight text if necessary
        value = HighlightSearchPipe.highlight(
          value,
          (column as any).highlight
        );

        // finished
        return value;
      };
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
    this._agTable.columnApi.getColumns().forEach((column) => {
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
    this._agTable.columnApi.getColumns().forEach((column) => {
      const colDef = column.getUserProvidedColDef();
      colDef.minWidth = column.getActualWidth();
      column.setColDef(colDef, colDef);
    });
  }

  /**
   * Some type of columns should have a fixed width
   */
  private adjustFixedSizeColumns(): void {
    // nothing to do ?
    if (!this._agTable?.columnApi) {
      return;
    }

    // some type of columns should have a fixed width
    this._agTable.columnApi.getColumns().forEach((column) => {
      // retrieve column definition
      const colDef: IExtendedColDef = column.getUserProvidedColDef() as IExtendedColDef;
      if (colDef.columnDefinition?.width) {
        this._agTable.columnApi.setColumnWidth(
          column,
          colDef.columnDefinition.width
        );
      } else if (colDef.columnDefinition?.format?.type === V2ColumnFormat.STATUS) {
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
          maxForms * (AppListTableV2Component.STANDARD_SHAPE_SIZE + AppListTableV2Component.STANDARD_SHAPE_PADDING) +
            (maxForms < 2 ? AppListTableV2Component.STANDARD_SHAPE_PADDING : 0)
        );
      } else if (colDef.headerComponent === AppListTableV2SelectionHeaderComponent) {
        this._agTable.columnApi.setColumnWidth(
          column,
          AppListTableV2Component.STANDARD_SELECT_COLUMN_WIDTH
        );
      } else if ((colDef.columnDefinition as IV2ColumnBasic).format?.obfuscated) {
        this._agTable.columnApi.setColumnWidth(
          column,
          AppListTableV2Component.STANDARD_OBFUSCATED_COLUMN_WIDTH
        );
      } else if (colDef.columnDefinition?.format?.type === V2ColumnFormat.ACTIONS) {
        // number of actions
        const noActions: number = this.columnActions?.actions?.length ?
          this.columnActions.actions.length :
          0;

        // set column width
        if (noActions > 0) {
          this._agTable.columnApi.setColumnWidth(
            column,
            // width of buttons
            noActions * AppListTableV2Component.STANDARD_COLUMN_ACTION_WIDTH +
            // gap between buttons
            ((noActions - 1) * AppListTableV2Component.STANDARD_COLUMN_ACTION_GAP) +
            // cell padding (left + right)
            2 * AppListTableV2Component.STANDARD_COLUMN_PADDING +
            // cell margin (left + right)
            2 * AppListTableV2Component.STANDARD_COLUMN_MARGIN
          );
        }
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
      .filter((item) => !item.alwaysVisible && (!item.exclude || !item.exclude(item)))
      // sort columns by their label
      .sort((v1, v2) => this.i18nService.instant(v1.label).localeCompare(this.i18nService.instant(v2.label)));

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
        width: '50rem',

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
          const colDef: IExtendedColDef = this._agTable.columnApi.getColumn(columnState.colId)?.getUserProvidedColDef() as IExtendedColDef;
          if (
            !colDef ||
            !colDef.columnDefinition ||
            colDef.columnDefinition.format?.type === V2ColumnFormat.ACTIONS ||
            !visibleMap[colDef.columnDefinition.field]
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
   * Stop resize table timer
   */
  private stopResizeTableTimer(): void {
    if (this._resizeTableTimer) {
      clearTimeout(this._resizeTableTimer);
      this._resizeTableTimer = undefined;
    }
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
    // if small screen don't save visible columns, pinned etc
    if (this.isSmallScreenMode) {
      return;
    }

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
      const colDef: IExtendedColDef = this._agTable.columnApi.getColumn(columnState.colId)?.getUserProvidedColDef() as IExtendedColDef;

      // nothing to do ?
      if (
        !colDef ||
        !colDef.columnDefinition ||
        colDef.columnDefinition.format?.type === V2ColumnFormat.ACTIONS
      ) {
        return;
      }

      // visible column ?
      if (
        colDef.columnDefinition.field &&
        !colDef.columnDefinition.alwaysVisible
      ) {
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
    this._selected = this._agTable.api.getSelectedNodes().map(
      (item) => _.get(item.data, this.keyField)
    );

    // process data
    this._processedSelectedResults = {};
    if (this.processSelectedData?.length > 0) {
      this.processSelectedData.forEach((processor) => {
        // no need to execute?
        if (!processor.shouldProcess(
          this._recordsDataMap,
          this._selected
        )) {
          return;
        }

        // process
        this._processedSelectedResults[processor.key] = processor.process(
          this._recordsDataMap,
          this._selected
        );
      });
    }
  }

  /**
   * Sort by - used in AppListTableV2ColumnHeaderComponent even if it is marked as not used...
   * - used externally - do not remove
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
      field: typeof this._sortBy.column?.columnDefinition.sortable === 'string' ?
        this._sortBy.column.columnDefinition.sortable :
        this._sortBy.column?.columnDefinition.field,
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
    // nothing to do ?
    if (!this._pageSettingsKeyHeaderFilter) {
      return;
    }

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
   * - used externally - do not remove
   */
  columnFilterBy(
    column: IExtendedColDef,
    valueOverwrite?: any
  ): void {
    // filter
    this.filterBy.emit({
      column,
      valueOverwrite
    });
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
    this.groupedDataOneActive = false;

    // unselect previous
    if (this._groupedDataPreviousClickedValue) {
      delete this._groupedDataPreviousClickedValue.active;
    }

    // same item clicked, then unselect
    if (this._groupedDataPreviousClickedValue === groupValue) {
      // unselect
      this._groupedDataPreviousClickedValue = undefined;

      // trigger click
      this.groupedData.click(null, this.groupedData);

      // finished
      return;
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

    // show advanced filters dialog
    this.dialogV2Service
      .showAdvancedFiltersDialog(
        this.advancedFilterType,
        this.advancedFilters,
        this._advancedFiltersApplied,
        this.advancedFiltersConfig
      )
      .subscribe((response) => {
        // cancelled ?
        if (!response) {
          return;
        }

        // set data
        this._advancedFiltersQueryBuilder = response.queryBuilder;
        this._advancedFiltersApplied = response.filtersApplied;

        // emit the Request Query Builder
        this.advancedFilterBy.emit(this.advancedFiltersQueryBuilder);
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

  /**
   * Update
   */
  @HostListener('window:resize')
  private updateRenderMode(): void {
    // determine
    const isSmallScreenMode = determineIfSmallScreenMode();

    // update column definitions only if responsive changes
    if (isSmallScreenMode !== this.isSmallScreenMode) {
      // small screen mode ?
      this.isSmallScreenMode = isSmallScreenMode;

      // this.detectChanges / this.resizeTable() are called by resize layout by updateColumnDefinitions
      this.updateColumnDefinitions();

      // stop previous
      this.stopResizeTableTimer();

      // wait for html to be rendered since isSmallScreenMode was changed
      this._resizeTableTimer = setTimeout(() => {
        // reset
        this._resizeTableTimer = undefined;

        // update
        this.resizeTable();
      });
    } else {
      // update table size
      this.resizeTable();
    }
  }

  /**
   * Add expandable row details
   */
  private addExpandableRowDetails(oldData: any[]): any[] {
    // append details rows
    const newData: any[] = [];
    oldData.forEach((dataRow) => {
      newData.push(
        // original row
        dataRow,

        // details row used for details
        {
          type: V2RowType.EXPAND_ROW,
          visible: false,
          column: null,
          rowData: dataRow
        } as IV2RowExpandRow
      );
    });

    // finished
    return newData;
  }

  /**
   * Retrieve bottom section setting
   */
  private loadBottomSectionConfig(): void {
    // retrieve collapse / expand value
    const authUser: UserModel = this.authDataService.getAuthenticatedUser();
    this.bottomSectionIsCollapsed = !!authUser.getSettings(this._pageSettingsKeyBottomSectionCollapsed);
  }

  /**
   * Expand / collapse bottom section (legend & pagination)
   */
  expandCollapseBottomSection(): void {
    // disable while saving user settings
    this.bottomSectionSavingConfig = true;

    // attach / detach collapsed class
    this.bottomSectionIsCollapsed = !this.bottomSectionIsCollapsed;

    // refresh html
    this.detectChanges();
    this.resizeTable();

    // update settings
    this.authDataService
      .updateSettingsForCurrentUser({
        [this._pageSettingsKeyBottomSectionCollapsed]: this.bottomSectionIsCollapsed
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
        this.bottomSectionSavingConfig = false;

        // update layout
        this.detectChanges();
      });
  }
}
