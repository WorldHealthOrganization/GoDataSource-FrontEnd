import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { BaseModel } from '../../../core/models/base.model';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ColDef, Column, ColumnApi, ValueFormatterParams } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { VisibleColumnModel, VisibleColumnModelFormat, VisibleColumnModelPinned } from '../../components/side-columns/model';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { I18nService } from '../../../core/services/helper/i18n.service';
import { moment } from '../../../core/helperClasses/x-moment';
import { Constants } from '../../../core/models/constants';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Extended AG-Grid column definition
 */
interface IExtendedColDef extends ColDef {
  // visible column definition
  visibleColumnDefinition?: VisibleColumnModel;
}

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
  private _columns: VisibleColumnModel[];
  @Input() set columns(columns: VisibleColumnModel[]) {
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

  // click listener
  clickListener: () => void;

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
  retrieveData(): void {
    // nothing to do ?
    if (!this._records$) {
      // reset data
      this.records = undefined;

      // re-render page
      this.changeDetectorRef.detectChanges();

      // finished
      return;
    }

    // retrieve data
    this.recordsSubscription = this._records$.subscribe((data) => {
      // set data
      this.records = data;

      // re-render page
      this.changeDetectorRef.detectChanges();
    });
  }

  /**
   * Update column definitions
   */
  updateColumnDefinitions(): void {
    // nothing to do ?
    if (!this._columns) {
      // reset
      this.columnDefs = undefined;

      // finished
      return;
    }

    // determine columns
    this.columnDefs = [{
      pinned: VisibleColumnModelPinned.LEFT,
      headerName: '',
      field: this.keyField,
      checkboxSelection: true,
      headerCheckboxSelection: true
    }];
    this._columns.forEach((column) => {
      // no need to take in account ?
      if (
        !column.visible || (
          column.excludeFromDisplay &&
          column.excludeFromDisplay(column)
        )
      ) {
        return;
      }

      // attach column to list of visible columns
      this.columnDefs.push({
        headerName: this.translateService.instant(column.label),
        field: column.field,
        pinned: column.pinned,
        resizable: true,
        visibleColumnDefinition: column,
        valueFormatter: (valueFormat): string => {
          return this.formatValue(valueFormat);
        },
        cellRenderer: this.handleCellRenderer(column)
      });
    });

    // re-render page
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Format value
   */
  private formatValue(valueFormat: ValueFormatterParams): string {
    // retrieve extended column definition
    const extendedColDef: IExtendedColDef = valueFormat.colDef as IExtendedColDef;
    const field: string = extendedColDef.visibleColumnDefinition.formatField ?
      extendedColDef.visibleColumnDefinition.formatField :
      extendedColDef.field;

    // do we have a custom formatter ?
    if (extendedColDef.visibleColumnDefinition.format !== undefined) {
      // path or method ?
      const formatType: string = typeof extendedColDef.visibleColumnDefinition.format;
      if (formatType === 'string') {
        return _.get(
          valueFormat.data,
          extendedColDef.visibleColumnDefinition.format as string,
          ''
        );

      } else if (formatType === 'function') {
        return (extendedColDef.visibleColumnDefinition.format as (any) => string)(valueFormat.data);

      } else if (formatType === 'number') {
        // retrieve field value
        const fieldValue: any = extendedColDef.visibleColumnDefinition.formatValue ?
          extendedColDef.visibleColumnDefinition.formatValue(valueFormat.data) :
          _.get(
            valueFormat.data,
            field
          );

        // handle accordingly to format type
        switch (extendedColDef.visibleColumnDefinition.format) {
          // AGE
          case VisibleColumnModelFormat.AGE:
            return fieldValue?.months > 0 ?
              fieldValue?.months + ' ' + this.i18nService.instant('LNG_AGE_FIELD_LABEL_MONTHS') :
              (
                fieldValue?.years > 0 ?
                  (fieldValue?.years + ' ' + this.i18nService.instant('LNG_AGE_FIELD_LABEL_YEARS')) :
                  ''
              );

          // DATE
          case VisibleColumnModelFormat.DATE:
            return fieldValue ?
              moment(fieldValue).format(Constants.DEFAULT_DATE_DISPLAY_FORMAT) :
              '';

          // DATETIME
          case VisibleColumnModelFormat.DATETIME:
            return fieldValue ?
              moment(fieldValue).format(Constants.DEFAULT_DATE_TIME_DISPLAY_FORMAT) :
              '';

          // BOOLEAN
          case VisibleColumnModelFormat.BOOLEAN:
            return fieldValue ?
              this.i18nService.instant('LNG_COMMON_LABEL_YES') :
              this.i18nService.instant('LNG_COMMON_LABEL_NO');

          default:
            throw new Error('VisibleColumnModelFormat: Not supported');
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
  private handleCellRenderer(column: VisibleColumnModel): (ValueFormatterParams) => any {
    // link ?
    if (column.link) {
      return (params: ValueFormatterParams) => {
        // determine value
        const value: string = this.formatValue(params);

        // retrieve url link
        const url: string = column.link(params.data);

        // create link
        return url ?
          `<a class="gd-list-table-link" href="${this.location.prepareExternalUrl(url)}"><span is-link="${url}">${value}</span><a/>` :
          value;
      };
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
    // if pinned start with column fitting content
    const pinnedColumns: Column[] = [];
    event.columnApi.getAllColumns().forEach((column) => {
      // jump over column ?
      if (!column.isPinned()) {
        return;
      }

      // add to list of columns to fit content
      pinnedColumns.push(column);
    });

    // anything to resize ?
    if (pinnedColumns.length < 1) {
      return;
    }

    // resize
    event.columnApi.autoSizeColumns(pinnedColumns);
  }
}
