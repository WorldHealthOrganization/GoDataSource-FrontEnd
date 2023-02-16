import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { TopnavComponent } from '../../../core/components/topnav/topnav.component';
import { IV2Breadcrumb } from '../app-breadcrumb-v2/models/breadcrumb.model';
import { IV2ActionIcon, IV2ActionIconLabel, IV2ActionMenuLabel, V2ActionType } from '../app-list-table-v2/models/action.model';
import { V2AdvancedFilter } from '../app-list-table-v2/models/advanced-filter.model';
import { DialogV2Service } from '../../../core/services/helper/dialog-v2.service';
import { SavedFilterData } from '../../../core/models/saved-filters.model';
import { IV2SideDialogAdvancedFiltersResponse } from '../app-side-dialog-v2/models/side-dialog-config.model';
import { Subscription } from 'rxjs/internal/Subscription';
import { I18nService } from '../../../core/services/helper/i18n.service';

/**
 * Component
 */
@Component({
  selector: 'app-basic-page-v2',
  templateUrl: './app-basic-page-v2.component.html',
  styleUrls: ['./app-basic-page-v2.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppBasicPageV2Component implements OnInit, OnDestroy {
  // language handler
  languageSubscription: Subscription;

  // breadcrumbs
  @Input() breadcrumbs: IV2Breadcrumb[];

  // title
  @Input() pageTitle: string;

  // quick actions
  @Input() quickActions: IV2ActionMenuLabel;

  // button
  @Input() actionButton: IV2ActionIconLabel | IV2ActionIcon;

  // advanced filters
  @Input() advancedFilterType: string;
  @Input() advancedFilters: V2AdvancedFilter[];
  @Input() advancedFiltersVisible: boolean;
  @Input() advancedFiltersHideOperator: boolean;

  // applied filters
  private _advancedFiltersApplied: SavedFilterData;

  // selected outbreak dropdown should be disabled ? by default is disabled
  @Input() set selectedOutbreakDisabled(value: boolean) {
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = value;
  }

  // constants
  V2ActionType = V2ActionType;

  // filter by
  @Output() advancedFilterBy = new EventEmitter<IV2SideDialogAdvancedFiltersResponse>();

  /**
   * Constructor
   */
  constructor(
    protected elementRef: ElementRef,
    protected dialogV2Service: DialogV2Service,
    protected changeDetectorRef: ChangeDetectorRef,
    protected i18nService: I18nService
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

    // subscribe to language change
    this.initializeLanguageChangeListener();
  }

  /**
   * Release resources
   */
  ngOnDestroy(): void {
    // enable select outbreak
    TopnavComponent.SELECTED_OUTBREAK_DROPDOWN_DISABLED = false;

    // stop refresh language tokens
    this.releaseLanguageListener();
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
   *  Subscribe to language change
   */
  private initializeLanguageChangeListener(): void {
    // stop refresh language tokens
    this.releaseLanguageListener();

    // attach event
    this.languageSubscription = this.i18nService.languageChangedEvent
      .subscribe(() => {
        // update ui
        this.detectChanges();
      });
  }

  /**
   * Release language listener
   */
  private releaseLanguageListener() {
    // release language listener
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
      this.languageSubscription = null;
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
        this._advancedFiltersApplied,
        {
          operatorHide: this.advancedFiltersHideOperator
        }
      )
      .subscribe((response) => {
        // cancelled ?
        if (!response) {
          return;
        }

        // set data
        this._advancedFiltersApplied = response.filtersApplied;

        // emit the Request Query Builder
        this.advancedFilterBy.emit(response);
      });
  }
}
