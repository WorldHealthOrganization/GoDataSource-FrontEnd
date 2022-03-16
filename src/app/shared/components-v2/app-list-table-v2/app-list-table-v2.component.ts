import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, Renderer2, ViewChild } from '@angular/core';
import { BaseModel } from '../../../core/models/base.model';
import { Observable, throwError } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ValueFormatterParams } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { moment } from '../../../core/helperClasses/x-moment';
import { Constants } from '../../../core/models/constants';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { IV2Column, IV2ColumnAction, IV2ColumnBasic, IV2ColumnBasicFormat, IV2ColumnButton, IV2ColumnPinned, IV2ColumnStatus, IV2ColumnStatusFormType, V2ColumnFormat, V2ColumnStatusForm } from './models/column.model';
import { AppListTableV2ActionsComponent } from './components/actions/app-list-table-v2-actions.component';
import { IExtendedColDef } from './models/extended-column.model';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel, V2ActionMenuItem, V2ActionType } from './models/action.model';
import { IV2GroupedData } from './models/grouped-data.model';
import { AgGridAngular } from '@ag-grid-community/angular';
import { V2LoadingComponent } from './models/loading.component';
import { V2NoRowsComponent } from './models/no-rows.component';
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
  private static readonly STANDARD_SHAPE_SIZE: number = 12;
  private static readonly STANDARD_SHAPE_GAP: number = 6;
  private static readonly STANDARD_SHAPE_PADDING: number = 12;

  // records
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
  private _columns: IV2Column[];
  @Input() set columns(columns: IV2Column[]) {
    // set data
    this._columns = columns;

    // update columns definitions
    this.updateColumnDefinitions();
  };

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

  // grouped data
  groupedDataExpanded: boolean = false;
  private _groupedData: IV2GroupedData;
  @Input() set groupedData(groupedData: IV2GroupedData) {
    // set data
    this._groupedData = groupedData;

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

  // ag table handler
  @ViewChild('agTable') agTable: AgGridAngular;

  // saving columns
  savingColumns: boolean = false;

  // page settings key
  private _pageSettingsKey: UserSettings;
  private _pageSettingsKeyLPinned: string;
  private _pageSettingsKeyRPinned: string;
  @Input() set pageSettingsKey(pageSettingsKey: UserSettings) {
    // set data
    this._pageSettingsKey = pageSettingsKey;
    this._pageSettingsKeyLPinned = this._pageSettingsKey ? `${this._pageSettingsKey}LPinned` : this._pageSettingsKey;
    this._pageSettingsKeyRPinned = this._pageSettingsKey ? `${this._pageSettingsKey}RPinned` : this._pageSettingsKey;

    // update columns definitions
    this.updateColumnDefinitions();
  };

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
    protected router: Router,
    protected dialogV2Service: DialogV2Service,
    protected authDataService: AuthDataService,
    protected toastV2Service: ToastV2Service
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
      if (this.agTable) {
        this.agTable.api.setRowData([]);
      }

      // re-render page
      this.detectChanges();

      // finished
      return;
    }

    // retrieve data
    this.agTable.api.showLoadingOverlay();
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
        // set data & hide loading overlay
        this.agTable.api.setRowData(data);

        // no records found ?
        if (data.length < 1) {
          this.agTable.api.showNoRowsOverlay();
        }

        // some type of columns should have a fixed width
        this.adjustFixedSizeColumns();

        // unselect everything
        this.agTable.api.deselectAll();

        // re-render page
        this.detectChanges();
      });
  }

  /**
   * Update column definitions
   */
  private updateColumnDefinitions(
    overwriteVisibleColumns?: string[]
  ): void {
    // reset data
    this.legends = [];

    // nothing to do ?
    if (
      !this._columns ||
      !this._pageSettingsKey
    ) {
      // reset
      if (this.agTable) {
        this.agTable.api.setColumnDefs(undefined);
      }

      // finished
      return;
    }

    // disable load visible columns
    let visibleColumns: string[] = [];
    const visibleColumnsMap: {
      [field: string]: true
    } = {};
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

    // map visible columns
    visibleColumns.forEach((field) => {
      visibleColumnsMap[field] = true;
    });

    // map left pinned columns
    leftPinnedColumns.forEach((field) => {
      leftPinnedColumnsMap[field] = true;
    });

    // map right pinned columns
    rightPinnedColumns.forEach((field) => {
      rightPinnedColumnsMap[field] = true;
    });

    // process column
    const processColumn = (
      column: IV2Column,
      determinePinned: boolean
    ) => {
      // no need to take in account ?
      if (
        (
          visibleColumns.length < 1 &&
          column.notVisible
        ) || (
          column.format?.type !== V2ColumnFormat.ACTIONS &&
          visibleColumns.length > 0 &&
          !visibleColumnsMap[column.field]
        ) || (
          column.exclude &&
          column.exclude(column)
        )
      ) {
        return;
      }

      // determine column pinned value
      let pinned: IV2ColumnPinned | boolean;
      if (determinePinned) {
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
        cellClass: column.cssCellClass,
        valueFormatter: (valueFormat): string => {
          return this.formatValue(valueFormat);
        },
        cellRenderer: this.handleCellRenderer(column),
        suppressMovable: column.format && column.format.type === V2ColumnFormat.ACTIONS
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
    };

    // determine columns
    const columnDefs: IExtendedColDef[] = [{
      pinned: IV2ColumnPinned.LEFT,
      headerName: '',
      field: this.keyField,
      checkboxSelection: true,
      cellClass: 'gd-cell-no-focus',
      suppressMovable: true,
      headerComponent: AppListTableV2SelectionHeaderComponent,
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
                  this.agTable.api.selectAll();
                }
              },
              visible: (): boolean => {
                return this.agTable.api.getDisplayedRowCount() > 0 &&
                  this.agTable.api.getSelectedNodes().length < this.agTable.api.getDisplayedRowCount();
              }
            },
            {
              label: 'LNG_LIST_PAGES_BUTTON_BULK_ACTIONS_UNCHECK_ALL',
              action: {
                click: () => {
                  this.agTable.api.deselectAll();
                }
              },
              visible: (): boolean => {
                return this.agTable.api.getDisplayedRowCount() > 0 &&
                  this.agTable.api.getSelectedNodes().length > 0;
              }
            },
            {
              // divider
              visible: (): boolean => {
                return this.agTable.api.getDisplayedRowCount() > 0 && (
                  this.agTable.api.getSelectedNodes().length < this.agTable.api.getDisplayedRowCount() ||
                  this.agTable.api.getSelectedNodes().length > 0
                );
              }
            },
            ...(this.groupActions ? this.groupActions : [])
          ]
        }]
      }
    }];
    if (visibleColumns.length > 0) {
      // map columns
      const columnMap: {
        [field: string]: IV2Column
      } = {};
      this._columns.forEach((column) => {
        columnMap[column.field] = column;
      });

      // display columns in saved order
      visibleColumns.forEach((field) => {
        // column removed ?
        if (!columnMap[field]) {
          return;
        }

        // process
        processColumn(
          columnMap[field],
          true
        );
      });

      // process the remaining unprocessed items
      this._columns.forEach((column) => {
        if (column.format?.type === V2ColumnFormat.ACTIONS) {
          processColumn(
            column,
            false
          );
        }
      });
    } else {
      this._columns.forEach((column) => {
        processColumn(
          column,
          column.format?.type !== V2ColumnFormat.ACTIONS
        );
      });
    }

    // update column defs
    this.agTable.api.setColumnDefs(columnDefs);

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
            <circle fill="${form.color}" cx="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" cy="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" r="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2}" />
          </svg>
        `;

        // finished
        break;

      case IV2ColumnStatusFormType.SQUARE:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            <rect fill="${form.color}" width="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" />
          </svg>
        `;

        // finished
        break;

      case IV2ColumnStatusFormType.TRIANGLE:
        statusHtml += `
          <svg width="${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)}" height="${AppListTableV2Component.STANDARD_SHAPE_SIZE}" viewBox="0 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE + (addGap ? AppListTableV2Component.STANDARD_SHAPE_GAP : 0)} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}" xmlns="http://www.w3.org/2000/svg">
            <polygon fill="${form.color}" points="${AppListTableV2Component.STANDARD_SHAPE_SIZE / 2} 0, 0 ${AppListTableV2Component.STANDARD_SHAPE_SIZE}, ${AppListTableV2Component.STANDARD_SHAPE_SIZE} ${AppListTableV2Component.STANDARD_SHAPE_SIZE}"/>
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
    this.agTable.columnApi.autoSizeAllColumns();

    // some type of columns should have a fixed width
    this.adjustFixedSizeColumns();
  }

  /**
   * Some type of columns should have a fixed width
   */
  private adjustFixedSizeColumns(): void {
    // some type of columns should have a fixed width
    this.agTable.columnApi.getColumnState().forEach((columnState) => {
      // retrieve column definition
      const column = this.agTable.columnApi.getColumn(columnState.colId);
      const colDef: IExtendedColDef = column?.getColDef() as IExtendedColDef;
      if (colDef.columnDefinition?.format?.type === V2ColumnFormat.STATUS) {
        // determine maximum number of items
        const statusColumn: IV2ColumnStatus = colDef.columnDefinition as IV2ColumnStatus;
        let maxForms: number = 1;
        this.agTable.api.forEachNode((node) => {
          const formsNo: number = statusColumn.forms(
            statusColumn,
            node.data
          ).length;
          maxForms = maxForms < formsNo ?
            formsNo :
            maxForms;
        });

        // set column width
        this.agTable.columnApi.setColumnWidth(
          column,
          (maxForms - 1) * (AppListTableV2Component.STANDARD_SHAPE_SIZE + AppListTableV2Component.STANDARD_SHAPE_GAP) +
          AppListTableV2Component.STANDARD_SHAPE_SIZE +
          AppListTableV2Component.STANDARD_SHAPE_PADDING * 2
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
          key: 'apply'
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
        this.agTable.columnApi.getColumnState().forEach((columnState) => {
          // retrieve column definition
          const colDef: IExtendedColDef = this.agTable.columnApi.getColumn(columnState.colId)?.getColDef() as IExtendedColDef;
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
          this.agTable.api.ensureColumnVisible(remainingColumns[0]);
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
    this.agTable.columnApi.getColumnState().forEach((columnState) => {
      // retrieve column definition
      const colDef: IExtendedColDef = this.agTable.columnApi.getColumn(columnState.colId)?.getColDef() as IExtendedColDef;

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
    this._selected = this.agTable.api.getSelectedNodes().map((item) => item.data[this.keyField]);
  }
}
