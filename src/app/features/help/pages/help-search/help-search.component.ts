import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-help-search',
  templateUrl: './help-search.component.html'
})
export class HelpSearchComponent extends ListComponent<HelpItemModel> implements OnDestroy {
  // help items
  helpItemsList$: Observable<HelpItemModel[]>;

  // TODO: Left for help search bar inspiration
  searchedTerm: string = '';

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private helpDataService: HelpDataService
  ) {
    super(
      listHelperService,
      true
    );

    // TODO: Needs helpCategory resolver
    // this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();
  }

  /**
   * Release resources
   */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  /**
   * Component initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'title',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_TITLE',
        sortable: true
      },
      {
        field: 'name',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY',
        format: {
          type: 'category.name'
        },
        sortable: true
        // TODO: Needs helpCategory resolver
        // filter: {
        //   type: V2FilterType.MULTIPLE_SELECT,
        //   options: (this.activatedRoute.snapshot.data.helpCategory as IResolverV2ResponseModel<HelpCategoryModel>).options
        // }
      },

      // actions
      {
        field: 'actions',
        label: 'LNG_COMMON_LABEL_ACTIONS',
        pinned: IV2ColumnPinned.RIGHT,
        notResizable: true,
        cssCellClass: 'gd-cell-no-focus',
        format: {
          type: V2ColumnFormat.ACTIONS
        },
        actions: [
          // View Case
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_GLOBAL_HELP_ACTION_VIEW_HELP_ITEM',
            action: {
              link: (item: HelpItemModel) => ['/help', 'categories', item.categoryId, 'items', item.id, 'view-global']
            }
          }
        ]
      }
    ];
  }

  /**
   * Initialize process data
   */
  protected initializeProcessSelectedData(): void {}

  /**
   * Initialize table infos
   */
  protected initializeTableInfos(): void {}

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
  protected initializeBreadcrumbs(): void {
    // set breadcrumbs
    this.breadcrumbs = [
      {
        label: 'LNG_COMMON_LABEL_HOME',
        action: {
          link: DashboardModel.canViewDashboard(this.authUser) ?
            ['/dashboard'] :
            ['/account/my-profile']
        }
      }, {
        label: 'LNG_PAGE_GLOBAL_HELP_TITLE',
        action: {
          link: ['/help']
        }
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'title',
      'category'
    ];
  }

  /**
   * Re(load) the items list
   */
  refreshList() {
    this.queryBuilder.filter.where({ approved: true }, true);
    // retrieve the list of items
    if (_.isEmpty(this.searchedTerm)) {
      this.queryBuilder.filter.remove('token');
      this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
    } else {
      this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this.searchedTerm);
    }

    this.records$ = this.helpItemsList$
      .pipe(
        // update page count
        tap((helpItems: []) => {
          this.pageCount = {
            count: helpItems.length,
            hasMore: false
          };
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
* Get total number of items, based on the applied filters
*/
  refreshListCount() { }

  // TODO: Left for help search bar inspiration
  /**
   * Filter the list by a text field
   * @param {string} value
   */
  filterByTextFieldHelpSearch(value: string) {
    this.searchedTerm = value;

    // refresh list
    this.needsRefreshList();
  }
}
