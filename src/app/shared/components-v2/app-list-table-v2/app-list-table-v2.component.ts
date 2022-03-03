import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { BaseModel } from '../../../core/models/base.model';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ColumnApi, ValueFormatterParams } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { moment } from '../../../core/helperClasses/x-moment';
import { Constants } from '../../../core/models/constants';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IV2Column, IV2ColumnAction, IV2ColumnBasic, IV2ColumnBasicFormat, IV2ColumnPinned, V2ColumnFormat } from './models/column.model';
import { AppListTableV2ActionsComponent } from './components/actions/app-list-table-v2-actions.component';
import { IExtendedColDef } from './models/extended-column.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel } from './models/action.model';
import { IV2GroupedData } from './models/grouped-data.model';
import { AgGridAngular } from '@ag-grid-community/angular';
import { V2LoadingComponent } from './models/loading.component';
import { V2NoRowsComponent } from './models/no-rows.component';
import { IBasicCount } from '../../../core/models/basic-count.interface';
import { PageEvent } from '@angular/material/paginator';

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
  // records
  records: BaseModel[];
  recordsSubscription: Subscription;
  private _records$: Observable<BaseModel[]>;
  @Input() set records$(records$: Observable<BaseModel[]>) {
    // cancel previous one
    this.stopGetRecords();

    // set the new observable
    this._records$ = records$;

    // retrieve data
    this.retrieveData();
  };

  // columns
  columnDefs: IExtendedColDef[];
  private _columns: IV2Column[];
  @Input() set columns(columns: IV2Column[]) {
    // set data
    this._columns = columns;

    // update columns definitions
    this.updateColumnDefinitions();
  };

  // key field used to handle each row (checkbox selection, etc)
  @Input() keyField: string = '_id';

  // ag-grid modules
  modules = [
    ClientSideRowModelModule
  ];

  // loading in progress
  loadingDataInProgress: boolean = false;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // quick actions
  @Input() quickActions: IV2ActionMenuLabel;

  // add button
  @Input() addAction: IV2ActionIconLabel;

  // grouped data
  groupedDataExpanded: boolean = false;
  private _groupedData: IV2GroupedData;
  @Input() set groupedData(groupedData: IV2GroupedData) {
    // set data
    this._groupedData = groupedData;

    // already expanded, refresh ?
    if (this.groupedDataExpanded) {
      this.refreshGroupedData();
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

  // ag table handler
  @ViewChild('agTable') agTable: AgGridAngular;

  // constants
  V2LoadingComponent = V2LoadingComponent;
  V2NoRowsComponent = V2NoRowsComponent;
  Constants = Constants;

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected translateService: TranslateService,
    protected i18nService: I18nService,
    protected location: Location,
    protected renderer2: Renderer2,
    protected elementRef: ElementRef,
    protected router: Router
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
    // if first time we need to run one more time detect changes for spinner component to be loaded
    if (!V2LoadingComponent.loadingHtmlElement) {
      this.detectChanges();
    }

    // nothing to do ?
    if (!this._records$) {
      // reset data
      this.records = [];

      // re-render page
      this.detectChanges();

      // finished
      return;
    }

    // retrieve data
    this.agTable.api.showLoadingOverlay();
    this.loadingDataInProgress = true;
    this.recordsSubscription = this._records$.subscribe((data) => {
      // finished
      this.loadingDataInProgress = false;

      // set data & hide loading overlay
      this.records = data;

      // no records found ?
      if (this.records.length < 1) {
        this.agTable.api.showNoRowsOverlay();
      }

      // re-render page
      this.detectChanges();
    });
  }

  /**
   * Update column definitions
   */
  private updateColumnDefinitions(): void {
    // nothing to do ?
    if (!this._columns) {
      // reset
      this.columnDefs = undefined;

      // finished
      return;
    }

    // determine columns
    this.columnDefs = [{
      pinned: IV2ColumnPinned.LEFT,
      headerName: '',
      field: this.keyField,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      cellClass: 'gd-cell-no-focus'
    }];
    this._columns.forEach((column) => {
      // no need to take in account ?
      if (
        column.notVisible || (
          column.exclude &&
          column.exclude(column)
        )
      ) {
        return;
      }

      // attach column to list of visible columns
      this.columnDefs.push({
        headerName: column.label ?
          this.translateService.instant(column.label) :
          '',
        field: column.field,
        pinned: column.pinned,
        resizable: !column.notResizable,
        columnDefinition: column,
        cellClass: column.cssCellClasses,
        valueFormatter: (valueFormat): string => {
          return this.formatValue(valueFormat);
        },
        cellRenderer: this.handleCellRenderer(column)
      });
    });

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

          // ACTIONS
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
    }

    // actions ?
    const actionColumn: IV2ColumnAction = column as IV2ColumnAction;
    if (
      actionColumn.format &&
      actionColumn.format.type === V2ColumnFormat.ACTIONS
    ) {
      return AppListTableV2ActionsComponent;
    }

    // nothing to do ?
    return undefined;
  }

  /**
   * Grid ready
   */
  firstDataRendered(event: {
    columnApi: ColumnApi
  }): void {
    // resize all columns
    event.columnApi.autoSizeAllColumns();
  }

  /**
   * Visible Columns
   */
  setVisibleColumns(): void {
    // #TODO
    this._columns.forEach((col) => col.notVisible = false);
    this.columns = this._columns;
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
  refreshGroupedData(): void {
    // nothing to refresh ?
    if (!this.groupedData) {
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
}
