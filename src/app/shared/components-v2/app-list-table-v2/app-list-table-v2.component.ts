import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy } from '@angular/core';
import { BaseModel } from '../../../core/models/base.model';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs/internal/Subscription';
import { ColDef, Column, ColumnApi } from '@ag-grid-community/core';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { VisibleColumnModel, VisibleColumnModelPinned } from '../../components/side-columns/model';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-list-table-v2',
  templateUrl: './app-list-table-v2.component.html',
  styleUrls: ['./app-list-table-v2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2Component implements OnDestroy {
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
  columnDefs: ColDef[];
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

  /**
   * Constructor
   */
  constructor(
    protected changeDetectorRef: ChangeDetectorRef,
    protected translateService: TranslateService
  ) {}

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // stop retrieving data
    this.stopGetRecords();
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

      // #TODO
      // {headerName: 'Make', field: 'visualId', pinned: 'left', filter: true },
      this.columnDefs.push({
        headerName: this.translateService.instant(column.label),
        field: column.field,
        pinned: column.pinned,
        resizable: true,
        valueFormatter: (a): string => {
          return a.value && typeof a.value === 'string' ?
            this.translateService.instant(a.value) :
            a.value;
        }
      });
    });

    // re-render page
    this.changeDetectorRef.detectChanges();
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
