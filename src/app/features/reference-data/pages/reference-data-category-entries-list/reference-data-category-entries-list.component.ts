import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataCategory, ReferenceDataCategoryModel, ReferenceDataEntryModel } from '../../../../core/models/reference-data.model';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { UserSettings } from '../../../../core/models/user.model';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { catchError, map, switchMap } from 'rxjs/operators';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import * as _ from 'lodash';
import { throwError } from 'rxjs';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { IconModel } from '../../../../core/models/icon.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-reference-data-category-entries-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './reference-data-category-entries-list.component.html',
  styleUrls: ['./reference-data-category-entries-list.component.less']
})
export class ReferenceDataCategoryEntriesListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  categoryEntriesCount: IBasicCount;
  categoryEntries: ReferenceDataEntryModel[];
  categoryEntriesAll: ReferenceDataEntryModel[];
  categoryId: ReferenceDataCategory;

  category: ReferenceDataCategoryModel;

  // constants
  IconModel = IconModel;
  ReferenceDataEntryModel = ReferenceDataEntryModel;

  UserSettings = UserSettings;

  recordActions: HoverRowAction[] = [
    // View Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_VIEW_ENTRY',
      linkGenerator: (item: ReferenceDataEntryModel): string[] => {
        return ['/reference-data', item.categoryId, item.id, 'view'];
      },
      visible: (): boolean => {
        return ReferenceDataEntryModel.canView(this.authUser);
      }
    }),

    // Modify Item
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_MODIFY_ENTRY',
      linkGenerator: (item: ReferenceDataEntryModel): string[] => {
        return ['/reference-data', item.categoryId, item.id, 'modify'];
      },
      visible: (): boolean => {
        return ReferenceDataEntryModel.canModify(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Item
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY',
          click: (item: ReferenceDataEntryModel) => {
            this.deleteEntry(item);
          },
          visible: (item: ReferenceDataEntryModel): boolean => {
            return !item.readonly &&
                            ReferenceDataEntryModel.canDelete(this.authUser);
          },
          class: 'mat-menu-item-delete'
        })
      ]
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private route: ActivatedRoute,
    private referenceDataDataService: ReferenceDataDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private i18nService: I18nService
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
    // get the route params
    this.route.params
      .subscribe((params: { categoryId }) => {
        this.categoryId = params.categoryId;

        // initialize pagination
        this.initPaginator();

        // retrieve data
        this.needsRefreshList(true);

        // retrieve Reference Data Category info
        this.referenceDataDataService
          .getReferenceDataByCategory(params.categoryId)
          .subscribe((category: ReferenceDataCategoryModel) => {
            // set data
            this.category = category;

            // update breadcrumbs
            this.initializeBreadcrumbs();
          });
      });

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.onDestroy();
  }

  // /**
  //    * Initialize breadcrumbs
  //    */
  // initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add list breadcrumb only if we have permission
  //   if (ReferenceDataCategoryModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
  //     );
  //   }
  //
  //   // view / modify breadcrumb
  //   if (this.category) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel(
  //         this.category.name,
  //         '.',
  //         true
  //       )
  //     );
  //   }
  // }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'label',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_VALUE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'code',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CODE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'icon',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ICON'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'color',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_COLOR'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'order',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ORDER'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'active',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_ACTIVE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'readonly',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_SYSTEM_VALUE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdBy',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'createdAt',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_CREATED_AT',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedBy',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_BY',
    //     visible: false
    //   }),
    //   new VisibleColumnModel({
    //     field: 'updatedAt',
    //     label: 'LNG_REFERENCE_DATA_ENTRY_FIELD_LABEL_UPDATED_AT',
    //     visible: false
    //   })
    // ];
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
    this.categoryEntries = [];
    this.categoryEntriesAll = undefined;
    this.refreshListCount();
    if (this.categoryId) {
      this.referenceDataDataService
        .getReferenceDataByCategory(this.categoryId)
        .pipe(
          catchError((err) => {
            this.toastV2Service.error(err);
            return throwError(err);
          }),
          map((category: ReferenceDataCategoryModel) => {
            return category.entries;
          })
        )
        .subscribe((entries) => {
          // retrieve all entries
          this.categoryEntriesAll = entries ? entries : [];

          // display only items from this page
          if (this.queryBuilder.paginator) {
            this.categoryEntries = this.categoryEntriesAll.slice(
              this.queryBuilder.paginator.skip,
              this.queryBuilder.paginator.skip + this.queryBuilder.paginator.limit
            );
          }

          // refresh the total count
          this.refreshListCount();
        });
    }
  }

  /**
     * Get total number of items
     */
  refreshListCount() {
    this.categoryEntriesCount = {
      count: this.categoryEntriesAll !== undefined ?
        this.categoryEntriesAll.length :
        null
    };
  }

  /**
     * Delete ref data entry
     */
  deleteEntry(entry: ReferenceDataEntryModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_REFERENCE_DATA_ENTRY')
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete entry
          this.referenceDataDataService
            .deleteEntry(entry.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err, { entryValue: entry.value });
                return throwError(err);
              }),
              switchMap(() => {
                // re-load language tokens
                return this.i18nService.loadUserLanguage();
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_DELETE_ENTRY_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Change Reference entry item order value
     */
  changeRefEntryOrder(
    refEntry: ReferenceDataEntryModel,
    order: any
  ) {
    // convert string to number
    order = order && _.isString(order) ? parseFloat(order) : order;

    // modify reference entry item
    this.referenceDataDataService
      .modifyEntry(
        refEntry.id, {
          order: order ? order : null
        }
      )
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        // update loaded ref data
        refEntry.order = order ? order : null;

        // show success ?
        // this might not be the best idea...maybe we can replace / remove it
        this.toastV2Service.success('LNG_PAGE_REFERENCE_DATA_CATEGORY_ENTRIES_LIST_ACTION_CHANGE_ORDER_SUCCESS_MESSAGE');
      });
  }
}
