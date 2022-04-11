import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ReferenceDataDataService } from '../../../../core/services/data/reference-data.data.service';
import { ReferenceDataCategoryModel } from '../../../../core/models/reference-data.model';
import { IconDataService } from '../../../../core/services/data/icon.data.service';
import { IconModel } from '../../../../core/models/icon.model';
import { Observable, throwError } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { DialogAnswer, DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { catchError, share } from 'rxjs/operators';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import * as _ from 'lodash';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-manage-icons-list',
  templateUrl: './manage-icons-list.component.html'
})
export class ManageIconsListComponent extends ListComponent implements OnInit, OnDestroy {
  // Breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  // Category Name
  category: ReferenceDataCategoryModel;

  // constants
  IconModel = IconModel;

  // Icons
  iconsList$: Observable<IconModel[]>;
  iconsListCount$: Observable<IBasicCount>;

  fixedTableColumns: string[] = [
    'name',
    'icon'
  ];

  recordActions: HoverRowAction[] = [
    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Icon
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_ACTION_DELETE',
          click: (item: IconModel) => {
            this.deleteIcon(item);
          },
          visible: (): boolean => {
            return IconModel.canDelete(this.authUser);
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
    private iconDataService: IconDataService,
    private dialogService: DialogService,
    private toastV2Service: ToastV2Service
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the query params
    // retrieve Reference Data Category info
    if (!this.route.snapshot.queryParams.categoryId) {
      // update breadcrumbs
      this.initializeBreadcrumbs();
    } else {
      this.retrieveCategory(this.route.snapshot.queryParams.categoryId);
    }

    // initialize pagination
    this.initPaginator();

    // retrieve icons
    this.needsRefreshList(true);
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
  // initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add reference categories list breadcrumb only if we have permission
  //   if (ReferenceDataCategoryModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_REFERENCE_DATA_CATEGORIES_LIST_TITLE', '/reference-data')
  //     );
  //   }
  //
  //   // add category
  //   if (
  //     this.category &&
  //           ReferenceDataEntryModel.canList(this.authUser)
  //   ) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel(
  //         this.category.name,
  //         `/reference-data/${this.category.id}`,
  //         false,
  //         {},
  //         this.category
  //       )
  //     );
  //   }
  //
  //   // add manage icons breadcrumb
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel(
  //       'LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_TITLE',
  //       '',
  //       true
  //     )
  //   );
  // }

  /**
     * Retrieve category
     * @param categoryId
     */
  retrieveCategory(categoryId: string) {
    this.referenceDataDataService
      .getReferenceDataByCategory(categoryId)
      .subscribe((category: ReferenceDataCategoryModel) => {
        // set category
        this.category = category;

        // update breadcrumbs
        this.initializeBreadcrumbs();
      });
  }

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
   * Retrieve Icons
   */
  refreshList() {
    this.iconsList$ = this.iconDataService
      .getIconsList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      );
  }

  /**
     * Get total number of items, based on the applied filters
     */
  refreshListCount() {
    // remove paginator from query builder
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.iconsListCount$ = this.iconDataService
      .getIconsCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete Icon
     * @param icon
     */
  deleteIcon(icon: IconModel) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_ICON', icon)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          // delete case
          this.iconDataService
            .deleteIcon(icon.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_REFERENCE_DATA_MANAGE_ICONS_LIST_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }
}
