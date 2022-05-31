import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { UserModel } from '../../../../core/models/user.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-help-items-list',
  templateUrl: './help-items-list.component.html'
})
export class HelpItemsListComponent extends ListComponent<HelpItemModel> implements OnDestroy {
  // category data
  private _selectedCategory: HelpCategoryModel;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service
  ) {
    super(listHelperService);

    // Retrieve category
    this._selectedCategory = this.activatedRoute.snapshot.data.selectedCategory;
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
        pinned: IV2ColumnPinned.LEFT,
        sortable: true
      },
      {
        field: 'comment',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_COMMENT',
        sortable: true
      },
      {
        field: 'approved',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'approvedBy',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_BY',
        format: {
          type: (item) => item.approvedBy && this.activatedRoute.snapshot.data.user.map[item.approvedBy] ?
            this.activatedRoute.snapshot.data.user.map[item.approvedBy].name :
            ''
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.approvedBy ?
            `/users/${ data.approvedBy }/view` :
            undefined;
        }
      },
      {
        field: 'approvedDate',
        label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_DATE',
        format: {
          type: V2ColumnFormat.DATE
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
          // View Help Item
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_VIEW_ITEM',
            action: {
              link: (item: HelpItemModel): string[] => {
                return ['/help', 'categories', item.categoryId, 'items', item.id, 'view'];
              }
            },
            visible: (): boolean => {
              return HelpItemModel.canView(this.authUser);
            }
          },

          // Modify Help Item
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_MODIFY_ITEM',
            action: {
              link: (item: HelpItemModel): string[] => {
                return ['/help', 'categories', item.categoryId, 'items', item.id, 'modify'];
              }
            },
            visible: (): boolean => {
              return HelpItemModel.canModify(this.authUser);
            }
          },

          // Approve Help Item
          {
            type: V2ActionType.ICON,
            icon: 'pan_tool',
            iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_ITEM',
            action: {
              click: (item: HelpItemModel) => {
                // show confirm dialog to confirm the action
                this.dialogV2Service.showConfirmDialog({
                  config: {
                    title: {
                      get: () => 'LNG_COMMON_LABEL_APPROVE',
                      data: () => ({
                        name: this.i18nService.instant(item.title)
                      })
                    },
                    message: {
                      get: () => 'LNG_DIALOG_CONFIRM_APPROVE_HELP_ITEM',
                      data: () => ({
                        title: this.i18nService.instant(item.title)
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

                  // convert
                  this.helpDataService
                    .approveHelpItem(item.categoryId, item.id)
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
                      this.toastV2Service.success('LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_SUCCESS_MESSAGE');

                      // hide loading
                      loading.close();

                      // reload data
                      this.needsRefreshList(true);
                    });
                });
              }
            },
            visible: (item: HelpItemModel): boolean => {
              return !item.approved &&
                HelpItemModel.canApproveCategoryItems(this.authUser);
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
                  get: () => 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_ITEM'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: HelpItemModel): void => {
                    // determine what we need to delete
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: this.i18nService.instant(item.title)
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_HELP_ITEM',
                          data: () => ({
                            title: this.i18nService.instant(item.title)
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
                        .deleteHelpItem(item.categoryId, item.id)
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
                          this.toastV2Service.success('LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (): boolean => {
                  return HelpItemModel.canDelete(this.authUser);
                }
              }
            ]
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
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/help/categories', this._selectedCategory.id, 'items', 'create']
      },
      visible: (): boolean => {
        return HelpItemModel.canCreate(this.authUser);
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
      }
    ];

    // add list breadcrumb only if we have permission
    if (HelpCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_LIST_HELP_CATEGORIES_TITLE',
          action: {
            link: ['/help/categories']
          }
        }
      );
    }

    // view category breadcrumb
    if (HelpCategoryModel.canView(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: this._selectedCategory.name,
          action: {
            link: [`/help/categories/${ this._selectedCategory.id }/view`]
          }
        }
      );
    }

    // children list breadcrumb
    this.breadcrumbs.push(
      {
        label: 'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
        action: null
      }
    );
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [
      'id',
      'title',
      'comment',
      'approved',
      'approvedBy',
      'approvedDate'
    ];
  }

  /**
   * Re(load) the items list
   */
  refreshList() {
    // retrieve the list of items
    this.records$ = this.helpDataService
      .getHelpItemsCategoryList(
        this._selectedCategory.id,
        this.queryBuilder
      )
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

    // COUNT
    this.helpDataService
      .getHelpItemsCategoryCount(
        this._selectedCategory.id,
        countQueryBuilder
      )
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
