import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-help-categories-list',
  templateUrl: './help-categories-list.component.html'
})
export class HelpCategoriesListComponent extends ListComponent<HelpCategoryModel> implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service
  ) {
    super(
      listHelperService, {
        disableFilterCaching: true,
        disableWaitForSelectedOutbreakToRefreshList: true
      }
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
   * Initialized
   */
  initialized(): void {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Table column - actions
   */
  protected initializeTableColumnActions(): void {
    this.tableColumnActions = {
      format: {
        type: V2ColumnFormat.ACTIONS
      },
      actions: [
        // View Help Category
        {
          type: V2ActionType.ICON,
          icon: 'visibility',
          iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_CATEGORY',
          action: {
            link: (item: HelpCategoryModel): string[] => {
              return ['/help', 'categories', item.id, 'view'];
            }
          },
          visible: (item: HelpCategoryModel): boolean => {
            return !item.deleted &&
              HelpCategoryModel.canView(this.authUser);
          }
        },

        // Modify Help Category
        {
          type: V2ActionType.ICON,
          icon: 'edit',
          iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_MODIFY_HELP_CATEGORY',
          action: {
            link: (item: HelpCategoryModel): string[] => {
              return ['/help', 'categories', item.id, 'modify'];
            }
          },
          visible: (item: HelpCategoryModel): boolean => {
            return !item.deleted &&
              HelpCategoryModel.canModify(this.authUser);
          }
        },

        // View Help Items
        {
          type: V2ActionType.ICON,
          icon: 'group_work',
          iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_ITEMS_BUTTON',
          action: {
            link: (item: HelpCategoryModel): string[] => {
              return ['/help', 'categories', item.id, 'items'];
            }
          },
          visible: (item: HelpCategoryModel): boolean => {
            return !item.deleted &&
              HelpItemModel.canList(this.authUser);
          }
        },

        // Other actions
        {
          type: V2ActionType.MENU,
          icon: 'more_horiz',
          menuOptions: [
            // Delete
            {
              label: {
                get: () => 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_HELP_CATEGORY'
              },
              cssClasses: () => 'gd-list-table-actions-action-menu-warning',
              action: {
                click: (item: HelpCategoryModel): void => {
                  // determine what we need to delete
                  this.dialogV2Service.showConfirmDialog({
                    config: {
                      title: {
                        get: () => 'LNG_COMMON_LABEL_DELETE',
                        data: () => ({
                          name: this.i18nService.instant(item.name)
                        })
                      },
                      message: {
                        get: () => 'LNG_DIALOG_CONFIRM_DELETE_HELP_CATEGORY',
                        data: () => ({
                          name: this.i18nService.instant(item.name)
                        })
                      }
                    }
                  }).subscribe((response) => {
                    // canceled ?
                    if (response.button.type === IV2BottomDialogConfigButtonType.CANCEL) {
                      // finished
                      return;
                    }

                    // show loading
                    const loading = this.dialogV2Service.showLoadingDialog();

                    // delete
                    this.helpDataService
                      .deleteHelpCategory(item.id)
                      .pipe(
                        catchError((err) => {
                          // show error
                          this.toastV2Service.error(err);

                          // hide loading
                          loading.close();

                          // send error down the road
                          return throwError(err);
                        })
                      )
                      .subscribe(() => {
                        // success
                        this.toastV2Service.success('LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_SUCCESS_MESSAGE');

                        // hide loading
                        loading.close();

                        // reload data
                        this.needsRefreshList(true);
                      });
                  });
                }
              },
              visible: (item: HelpCategoryModel): boolean => {
                return !item.deleted &&
                  HelpCategoryModel.canDelete(this.authUser);
              }
            }
          ]
        }
      ]
    };
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME',
        pinned: IV2ColumnPinned.LEFT,
        sortable: true
      },
      {
        field: 'description',
        label: 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION',
        sortable: true
      },
      {
        field: 'order',
        label: 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER',
        sortable: true
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
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/help/categories/create']
      },
      visible: (): boolean => {
        return HelpCategoryModel.canCreate(this.authUser);
      }
    };
  }

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
        label: 'LNG_PAGE_LIST_HELP_CATEGORIES_TITLE',
        action: null
      }
    ];
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'name',
      'description',
      'order'
    ];
  }

  /**
   * Re(load) the categories list
   */
  refreshList() {
    // retrieve the list of Categories
    this.records$ = this.helpDataService
      .getHelpCategoryList(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items, based on the applied filters
   */
  refreshListCount(applyHasMoreLimit?: boolean) {
    // reset
    this.pageCount = undefined;

    // set apply value
    if (applyHasMoreLimit !== undefined) {
      this.applyHasMoreLimit = applyHasMoreLimit;
    }

    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.helpDataService
      .getHelpCategoryCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),

        // should be the last pipe
        takeUntil(this.destroyed$)
      )
      .subscribe((response) => {
        this.pageCount = response;
      });
  }
}
