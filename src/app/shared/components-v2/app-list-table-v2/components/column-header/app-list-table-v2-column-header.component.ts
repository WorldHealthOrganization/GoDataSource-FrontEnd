import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { IHeaderAngularComp } from '@ag-grid-community/angular';
import { IAfterGuiAttachedParams, IHeaderParams } from '@ag-grid-community/core';
import { IExtendedColDef } from '../../models/extended-column.model';
import { RequestSortDirection } from '../../../../../core/helperClasses/request-query-builder';
import { V2FilterType } from '../../models/filter.model';
import { ActivatedRoute } from '@angular/router';
import { ILabelValuePairModel } from '../../../../forms-v2/core/label-value-pair.model';

/**
 * Component
 */
@Component({
  selector: 'app-list-table-v2-column-header',
  templateUrl: './app-list-table-v2-column-header.component.html',
  styleUrls: ['./app-list-table-v2-column-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppListTableV2ColumnHeaderComponent implements IHeaderAngularComp {
  // column
  extendedColDef: IExtendedColDef;

  // sort by
  component: {
    columnSortBy: (
      component: AppListTableV2ColumnHeaderComponent,
      column: IExtendedColDef,
      direction: RequestSortDirection | null
    ) => void,
    sortByColumn: IExtendedColDef,
    sortByDirection: RequestSortDirection | null,
    showHeaderFilters: boolean,
    columnFilterBy: (column: IExtendedColDef) => void
  };

  // options
  yesNoAllOptions: ILabelValuePairModel[];

  // constants
  RequestSortDirection = RequestSortDirection;
  V2FilterType = V2FilterType;

  /**
   * Constructor
   */
  constructor(
    private changeDetectorRef: ChangeDetectorRef,
    private activatedRoute: ActivatedRoute
  ) {
    this.yesNoAllOptions = this.activatedRoute.snapshot.data.yesNoAll;
  }

  /**
   * Gets called whenever the cell refreshes
   */
  refresh(_params: IHeaderParams): boolean {
    // re-render
    this.changeDetectorRef.detectChanges();

    // finished
    return true;
  }

  /**
   * After GUI attached
   */
  afterGuiAttached?(_params?: IAfterGuiAttachedParams): void {
    // ignore for now
  }

  /**
   * Cell initialized
   */
  agInit(params: IHeaderParams): void {
    // retrieve extended column definition
    this.extendedColDef = params.column.getColDef() as IExtendedColDef;
    this.component = this.extendedColDef.columnDefinitionData;
  }

  /**
   * Detect changes
   */
  public detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Sort by this column
   */
  sort(): void {
    // remove sort ?
    if (
      this.component.sortByColumn === this.extendedColDef &&
      this.component.sortByDirection === RequestSortDirection.DESC
    ) {
      this.component.columnSortBy(
        null,
        null,
        null
      );
    } else {
      this.component.columnSortBy(
        this,
        this.extendedColDef,
        this.component.sortByColumn !== this.extendedColDef ?
          RequestSortDirection.ASC :
          RequestSortDirection.DESC
      );
    }
  }
}
