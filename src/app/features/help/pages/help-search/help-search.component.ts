import { Component, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import { TranslateService } from '@ngx-translate/core';
import { V2FilterType } from '../../../../shared/components-v2/app-list-table-v2/models/filter.model';
import { ActivatedRoute } from '@angular/router';
import { IResolverV2ResponseModel } from '../../../../core/services/resolvers/data/models/resolver-response.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { IV2SideDialogConfigButtonType, IV2SideDialogConfigInputText, V2SideDialogConfigInputType } from '../../../../shared/components-v2/app-side-dialog-v2/models/side-dialog-config.model';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';

@Component({
  selector: 'app-help-search',
  templateUrl: './help-search.component.html'
})
export class HelpSearchComponent extends ListComponent<HelpItemModel> implements OnDestroy {
  // help items
  helpItemsList$: Observable<HelpItemModel[]>;

  // search by
  private _searchedTerm: string = '';

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private helpDataService: HelpDataService,
    private translateService: TranslateService,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService,
      true
    );
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
    // this page doesn't have pagination

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
        field: 'categoryId',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY',
        format: {
          type: (item) => item.category?.name ?
            this.translateService.instant(item.category.name) :
            ''
        },
        sortable: true,
        filter: {
          type: V2FilterType.MULTIPLE_SELECT,
          options: (this.activatedRoute.snapshot.data.helpCategory as IResolverV2ResponseModel<HelpCategoryModel>).options
        }
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
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      menuOptions: [
        // Search
        {
          label: {
            get: () => 'LNG_LAYOUT_LIST_DEFAULT_FILTER_PLACEHOLDER'
          },
          action: {
            click: () => {
              this.dialogV2Service
                .showSideDialog({
                  title: {
                    get: () => 'LNG_LAYOUT_LIST_DEFAULT_FILTER_PLACEHOLDER'
                  },
                  hideInputFilter: true,
                  inputs: [{
                    type: V2SideDialogConfigInputType.TEXT,
                    name: 'searchedTerm',
                    placeholder: 'LNG_LAYOUT_LIST_DEFAULT_FILTER_PLACEHOLDER',
                    value: this._searchedTerm
                  }],
                  bottomButtons: [{
                    type: IV2SideDialogConfigButtonType.OTHER,
                    label: 'LNG_COMMON_BUTTON_APPLY',
                    color: 'primary'
                  }, {
                    type: IV2SideDialogConfigButtonType.CANCEL,
                    label: 'LNG_COMMON_BUTTON_CANCEL',
                    color: 'text'
                  }]
                })
                .subscribe((response) => {
                  // cancelled ?
                  if (response.button.type === IV2SideDialogConfigButtonType.CANCEL) {
                    // finished
                    return;
                  }

                  // close dialog
                  response.handler.hide();

                  // set data
                  this._searchedTerm = (response.data.map.searchedTerm as IV2SideDialogConfigInputText).value;

                  // refresh list
                  this.needsRefreshList();
                });
            }
          }
        }
      ]
    };
  }

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
    // remove paginator
    this.queryBuilder.paginator.clear();

    // only approved
    this.queryBuilder.filter.where({ approved: true }, true);

    // retrieve the list of items
    if (!this._searchedTerm) {
      this.queryBuilder.filter.remove('token');
      this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
    } else {
      this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this._searchedTerm);
    }

    // retrieve data
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
}
