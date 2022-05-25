import { Component, OnDestroy } from '@angular/core';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { moment } from '../../../../core/helperClasses/x-moment';
import { DashboardModel } from '../../../../core/models/dashboard.model';
import { IconModel } from '../../../../core/models/icon.model';
import { ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogV2Service } from '../../../../core/services/helper/dialog-v2.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ExportDataExtension, ExportDataMethod } from '../../../../core/services/helper/models/dialog-v2.model';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';
import { V2ActionType } from '../../../../shared/components-v2/app-list-table-v2/models/action.model';
import { IV2ColumnPinned, V2ColumnFormat } from '../../../../shared/components-v2/app-list-table-v2/models/column.model';

@Component({
  selector: 'app-reference-data-categories-list',
  templateUrl: './reference-data-categories-list.component.html'
})
export class ReferenceDataCategoriesListComponent
  extends ListComponent<ReferenceDataCategoryModel>
  implements OnDestroy {
  /**
   * Constructor
   */
  constructor(
    protected listHelperService: ListHelperService,
    private referenceDataDataService: ReferenceDataDataService,
    private i18nService: I18nService,
    private dialogV2Service: DialogV2Service,
    private toastV2Service: ToastV2Service
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
    this.initPaginator();

    // ...and re-load the list when the Selected Outbreak is changed
    this.needsRefreshList(true);
  }

  /**
   * Initialize Side Table Columns
   */
  protected initializeTableColumns(): void {
    // default table columns
    this.tableColumns = [
      {
        field: 'name',
        label: 'LNG_REFERENCE_DATA_CATEGORY_FIELD_LABEL_CATEGORY_NAME'
      },
      {
        field: 'entries',
        label: 'LNG_REFERENCE_DATA_CATEGORY_FIELD_LABEL_ENTRIES',
        format: {
          type: V2ColumnFormat.LINK_LIST
        },
        links: (item: ReferenceDataCategoryModel) => item.entries?.length > 0 ?
          item.entries.map((entry) => {
            return {
              label: this.i18nService.instant(entry.value),
              href: ReferenceDataEntryModel.canView(this.authUser) ?
                `/reference-data/${ item.id }/${ item.id }/view` :
                null
            };
          }) :
          []
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
            iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_ACTION_VIEW_CATEGORY',
            action: {
              link: (item: ReferenceDataCategoryModel): string[] => {
                return ['/reference-data', item.id];
              }
            },
            visible: (): boolean => {
              return ReferenceDataEntryModel.canList(this.authUser);
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
      visible: (): boolean => {
        return IconModel.canList(this.authUser) || ReferenceDataCategoryModel.canImport(this.authUser) || ReferenceDataCategoryModel.canExport(this.authUser);
      },
      menuOptions: [
        // Manage icons
        {
          label: {
            get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_MANAGE_ICONS_BUTTON'
          },
          action: {
            link: () => ['/reference-data', 'manage-icons', 'list']
          },
          visible: (): boolean => {
            return IconModel.canList(this.authUser);
          }
        },

        // Divider
        {
          visible: (): boolean => {
            return IconModel.canList(this.authUser);
          }
        },

        // Import reference data
        {
          label: {
            get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_IMPORT_BUTTON'
          },
          action: {
            link: () => ['/import-export-data', 'reference-data', 'import']
          },
          visible: (): boolean => {
            return ReferenceDataCategoryModel.canImport(this.authUser);
          }
        },

        // Export reference data
        {
          label: {
            get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_EXPORT_BUTTON'
          },
          action: {
            click: () => {
              this.dialogV2Service.showExportData({
                title: {
                  get: () => 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_EXPORT_TITLE'
                },
                export: {
                  url: 'reference-data/export',
                  async: true,
                  method: ExportDataMethod.GET,
                  fileName: `${ this.i18nService.instant('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_EXPORT_TITLE') } - ${ moment().format('YYYY-MM-DD HH:mm') }`,
                  queryBuilder: this.queryBuilder,
                  allow: {
                    types: [
                      ExportDataExtension.CSV,
                      ExportDataExtension.XLS,
                      ExportDataExtension.XLSX,
                      ExportDataExtension.JSON,
                      ExportDataExtension.ODS,
                      ExportDataExtension.PDF
                    ],
                    dbColumns: true,
                    jsonReplaceUndefinedWithNull: true
                  }
                }
              });
            }
          },
          visible: (): boolean => {
            return ReferenceDataCategoryModel.canExport(this.authUser);
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
        label: 'LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE',
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
      'categoryId'
    ];
  }

  /**
   * Re(load) the Reference Data Categories list
   */
  refreshList() {
    // load reference data
    this.records$ = this.referenceDataDataService
      .getReferenceData()
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

    this.referenceDataDataService
      .getReferenceDataItemsCount(countQueryBuilder)
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
