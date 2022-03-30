import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { HoverRowAction } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { catchError } from 'rxjs/operators';
import { moment } from '../../../../core/helperClasses/x-moment';
import { throwError } from 'rxjs/internal/observable/throwError';
import { IconModel } from '../../../../core/models/icon.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-reference-data-categories-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './reference-data-categories-list.component.html',
  styleUrls: ['./reference-data-categories-list.component.less']
})
export class ReferenceDataCategoriesListComponent
  extends ListComponent
  implements OnInit, OnDestroy {

  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '..', true)
  // ];

  // constants
  ReferenceDataCategoryModel = ReferenceDataCategoryModel;
  IconModel = IconModel;

  // list of entries grouped by category
  referenceData$: Observable<ReferenceDataCategoryModel[]>;

  referenceDataExporFileName: string = moment().format('YYYY-MM-DD');

  fixedTableColumns: string[] = [
    'categoryName',
    'entries'
  ];

  recordActions: HoverRowAction[] = [
    // View Items
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_ACTION_VIEW_CATEGORY',
      linkGenerator: (item: ReferenceDataCategoryModel): string[] => {
        return ['/reference-data', item.id];
      },
      visible: (): boolean => {
        return ReferenceDataEntryModel.canList(this.authUser);
      }
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private referenceDataDataService: ReferenceDataDataService,
    private i18nService: I18nService,
    private toastV2Service: ToastV2Service
  ) {
    super(
      listHelperService,
      true
    );
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.needsRefreshList(true);

    // add page title
    this.referenceDataExporFileName = this.i18nService.instant('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE') +
            ' - ' +
            this.referenceDataExporFileName;
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {}

  /**
   * Initialize Table Advanced Filters
   */
  protected initializeTableAdvancedFilters(): void {}

  /**
   * Initialize table quick actions
   */
  protected initializeQuickActions(): void {}

  /**
   * Initialize table group actions
   */
  protected initializeGroupActions(): void {}

  /**
   * Initialize table add action
   */
  protected initializeAddAction(): void {}

  /**
   * Initialize table grouped data
   */
  protected initializeGroupedData(): void {}

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Reference Data Categories list
   */
  refreshList() {
    // load reference data
    this.referenceData$ = this.referenceDataDataService
      .getReferenceData()
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }
}
