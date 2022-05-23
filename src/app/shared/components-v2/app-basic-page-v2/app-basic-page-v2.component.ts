import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { TopnavComponent } from '../../../core/components/topnav/topnav.component';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIconLabel, IV2ActionMenuLabel } from '../app-list-table-v2/models/action.model';
import { V2AdvancedFilter } from '../app-list-table-v2/models/advanced-filter.model';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { SavedFilterData } from '../../../core/models/saved-filters.model';
import { IV2SideDialogAdvancedFiltersResponse } from '../app-side-dialog-v2/models/side-dialog-config.model';

/**
 * Component
 */
@Component({
  selector: 'app-basic-page-v2',
  templateUrl: './app-basic-page-v2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBasicPageV2Component implements OnInit, OnDestroy {
  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // quick actions
  @Input() quickActions: IV2ActionMenuLabel;

  // button
  @Input() actionButton: IV2ActionIconLabel;

  // advanced filters
  @Input() advancedFilterType: string;
  @Input() advancedFilters: V2AdvancedFilter[];

  // applied filters
  private _advancedFiltersApplied: SavedFilterData;

  // filter by
  @Output() advancedFilterBy = new EventEmitter<IV2SideDialogAdvancedFiltersResponse>();

  /**
   * Constructor
   */
  constructor(
    protected elementRef: ElementRef,
    protected dialogV2Service: DialogV2Service,
    protected changeDetectorRef: ChangeDetectorRef
  ) {
    // disable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = true;
  }

  /**
   * Initialize resources
   */
  ngOnInit(): void {
    // update table size
    this.resizeTable();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;
  }

  /**
   * Refresh template
   */
  detectChanges(): void {
    this.changeDetectorRef.detectChanges();
  }

  /**
   * Should update height of table
   */
  resizeTable(): void {
    // local variables
    let margins;

    // determine top part used space
    let topHeight: number = 0;
    const top = this.elementRef.nativeElement.querySelector('.gd-basic-top');
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
    const table = this.elementRef.nativeElement.querySelector('.gd-basic-content');
    if (table) {
      // set main table height - mat card
      table.style.height = `calc(100% - ${topHeight}px)`;
    }
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
        this._advancedFiltersApplied
      )
      .subscribe((response) => {
        // set data
        this._advancedFiltersApplied = response?.filtersApplied;

        // cancelled ?
        if (!response) {
          return;
        }

        // emit the Request Query Builder
        this.advancedFilterBy.emit(response);
      });
  }
}
