import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { UserModel } from '../../../../core/models/user.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { IV2BottomDialogConfigButtonType } from '../../../../shared/components-v2/app-bottom-dialog-v2/models/bottom-dialog-config.model';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { IconModel } from '../../../../core/models/icon.model';

@Component({
  selector: 'app-reference-data-category-entries-list',
  templateUrl: './reference-data-category-entries-list.component.html'
})
export class ReferenceDataCategoryEntriesListComponent extends ListComponent<ReferenceDataEntryModel> implements OnDestroy {
  // category
  category: ReferenceDataCategoryModel;

  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private referenceDataDataService: ReferenceDataDataService,
    private toastV2Service: ToastV2Service,
    private activatedRoute: ActivatedRoute,
    private dialogV2Service: DialogV2Service,
    private translateService: TranslateService
  ) {
    super(
      listHelperService,
      true
    );

    // retrieve category
    this.category = this.activatedRoute.snapshot.data.category;
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
   * Initialize Side Table Columns
   */
  protected initializeTableColumns() {
    // default table columns
    this.tableColumns = [
      {
        field: 'value',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE',
        pinned: IV2ColumnPinned.LEFT
      },
      {
        field: 'code',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE'
      },
      {
        field: 'description',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION'
      },
      {
        field: 'iconUrl',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON',
        noIconLabel: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_LABEL_NO_ICON',
        format: {
          type: V2ColumnFormat.ICON_URL
        }
      },
      {
        field: 'colorCode',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR',
        noColorLabel: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_LABEL_NO_COLOR',
        format: {
          type: V2ColumnFormat.COLOR
        }
      },
      {
        field: 'order',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER'
      },
      {
        field: 'active',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'readonly',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_SYSTEM_VALUE',
        format: {
          type: V2ColumnFormat.BOOLEAN
        }
      },
      {
        field: 'createdBy',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.createdBy && this.activatedRoute.snapshot.data.user.map[item.createdBy] ?
            this.activatedRoute.snapshot.data.user.map[item.createdBy].name :
            ''
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.createdBy ?
            `/users/${ data.createdBy }/view` :
            undefined;
        }
      },
      {
        field: 'createdAt',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
        }
      },
      {
        field: 'updatedBy',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_BY',
        notVisible: true,
        format: {
          type: (item) => item.updatedBy && this.activatedRoute.snapshot.data.user.map[item.updatedBy] ?
            this.activatedRoute.snapshot.data.user.map[item.updatedBy].name :
            ''
        },
        exclude: (): boolean => {
          return !UserModel.canView(this.authUser);
        },
        link: (data) => {
          return data.updatedBy ?
            `/users/${ data.updatedBy }/view` :
            undefined;
        }
      },
      {
        field: 'updatedAt',
        label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_AT',
        notVisible: true,
        format: {
          type: V2ColumnFormat.DATETIME
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
          // View reference data
          {
            type: V2ActionType.ICON,
            icon: 'visibility',
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_VIEW_ENTRY',
            action: {
              link: (item: ReferenceDataEntryModel): string[] => {
                return ['/reference-data', item.categoryId, item.id, 'view'];
              }
            },
            visible: (): boolean => {
              return ReferenceDataEntryModel.canView(this.authUser);
            }
          },

          // Modify reference data
          {
            type: V2ActionType.ICON,
            icon: 'edit',
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_MODIFY_ENTRY',
            action: {
              link: (item: ReferenceDataEntryModel): string[] => {
                return ['/reference-data', item.categoryId, item.id, 'modify'];
              }
            },
            visible: (): boolean => {
              return ReferenceDataEntryModel.canModify(this.authUser);
            }
          },

          // Other actions
          {
            type: V2ActionType.MENU,
            icon: 'more_horiz',
            visible: (item: ReferenceDataEntryModel): boolean => {
              return !item.readonly &&
                ReferenceDataEntryModel.canDelete(this.authUser);
            },
            menuOptions: [
              // Delete Lab Results
              {
                label: {
                  get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY'
                },
                cssClasses: () => 'gd-list-table-actions-action-menu-warning',
                action: {
                  click: (item: ReferenceDataEntryModel): void => {
                    // confirm
                    this.dialogV2Service.showConfirmDialog({
                      config: {
                        title: {
                          get: () => 'LNG_COMMON_LABEL_DELETE',
                          data: () => ({
                            name: `${ this.translateService.instant(item.value) }`
                          })
                        },
                        message: {
                          get: () => 'LNG_DIALOG_CONFIRM_DELETE_REFERENCE_DATA_ENTRY'
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

                      // delete reference data
                      this.referenceDataDataService
                        .deleteEntry(item.id)
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
                          this.toastV2Service.success('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY_SUCCESS_MESSAGE');

                          // hide loading
                          loading.close();

                          // reload data
                          this.needsRefreshList(true);
                        });
                    });
                  }
                },
                visible: (item: ReferenceDataEntryModel): boolean => {
                  return !item.readonly &&
                    ReferenceDataEntryModel.canDelete(this.authUser);
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
  protected initializeQuickActions(): void {
    this.quickActions = {
      type: V2ActionType.MENU,
      label: 'LNG_COMMON_BUTTON_QUICK_ACTIONS',
      visible: (): boolean => {
        return IconModel.canList(this.authUser);
      },
      menuOptions: [
        // Manage Icons
        {
          label: {
            get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_MANAGE_ICONS_BUTTON'
          },
          action: {
            link: () => ['/reference-data', 'manage-icons', 'list'],
            linkQueryParams: () => ({
              categoryId: this.category.id
            })
          },
          visible: (): boolean => {
            return IconModel.canList(this.authUser);
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
  protected initializeAddAction(): void {
    this.addAction = {
      type: V2ActionType.ICON_LABEL,
      label: 'LNG_COMMON_BUTTON_ADD',
      icon: 'add_circle_outline',
      action: {
        link: (): string[] => ['/reference-data', this.category.id, 'create']
      },
      visible: (): boolean => {
        return ReferenceDataEntryModel.canCreate(this.authUser);
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
    if (ReferenceDataCategoryModel.canList(this.authUser)) {
      this.breadcrumbs.push(
        {
          label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
          action: {
            link: ['/reference-data']
          }
        });
    }

    // view / modify breadcrumb
    this.breadcrumbs.push(
      {
        label: this.category.name,
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
      'categoryId',
      'value',
      'code',
      'description',
      'iconUrl',
      'colorCode',
      'order',
      'active',
      'readonly',
      'createdBy',
      'createdAt',
      'updatedBy',
      'updatedAt'
    ];
  }

  /**
   * Re(load) the Reference Data Categories list
   */
  refreshList() {
    // add category id to request
    this.queryBuilder.filter.byEquality(
      'categoryId',
      this.category.id
    );

    // retrieve records
    this.records$ = this.referenceDataDataService
      .getEntries(this.queryBuilder)
      .pipe(
        // should be the last pipe
        takeUntil(this.destroyed$)
      );
  }

  /**
   * Get total number of items
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

    // add category id to request
    countQueryBuilder.filter.byEquality(
      'categoryId',
      this.category.id
    );

    // apply has more limit
    if (this.applyHasMoreLimit) {
      countQueryBuilder.flag(
        'applyHasMoreLimit',
        true
      );
    }

    // count
    this.referenceDataDataService
      .getReferenceDataItemsCount(countQueryBuilder)
      .pipe(
        // error
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
