import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthDataService } from '../../../../core/services/data/auth.data.service';
import {
  UserModel,
  UserSettings
} from '../../../../core/models/user.model';
import { SnackbarService } from '../../../../core/services/helper/snackbar.service';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { ActivatedRoute } from '@angular/router';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError, share, tap } from 'rxjs/operators';
import { CacheKey, CacheService } from '../../../../core/services/helper/cache.service';
import { throwError } from 'rxjs';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';

@Component({
  selector: 'app-help-items-list',
  templateUrl: './help-items-list.component.html'
})
export class HelpItemsListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [];

  // authenticated user
  authUser: UserModel;
  categoryId: string;
  selectedCategory: HelpCategoryModel;

  helpItemsList$: Observable<HelpItemModel[]>;
  helpItemsListCount$: Observable<IBasicCount>;

  // provide constants to template
  Constants = Constants;
  HelpItemModel = HelpItemModel;
  UserSettings = UserSettings;

  recordActions: HoverRowAction[] = [
    // View Help Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_VIEW_ITEM',
      linkGenerator: (item: HelpItemModel): string[] => {
        return ['/help', 'categories', item.categoryId, 'items', item.id, 'view'];
      },
      visible: (): boolean => {
        return HelpItemModel.canView(this.authUser);
      }
    }),

    // Modify Help Item
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_MODIFY_ITEM',
      linkGenerator: (item: HelpItemModel): string[] => {
        return ['/help', 'categories', item.categoryId, 'items', item.id, 'modify'];
      },
      visible: (): boolean => {
        return HelpItemModel.canModify(this.authUser);
      }
    }),

    // Approve Help Item
    new HoverRowAction({
      icon: 'pan_tool',
      iconTooltip: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_ITEM',
      click: (item: HelpItemModel) => {
        this.approveHelpItem(item);
      },
      visible: (item: HelpItemModel): boolean => {
        return !item.approved &&
                    HelpItemModel.canApproveCategoryItems(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Help Item
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_ITEM',
          click: (item: HelpItemModel) => {
            this.deleteHelpItem(item);
          },
          visible: (): boolean => {
            return HelpItemModel.canDelete(this.authUser);
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
    private helpDataService: HelpDataService,
    private authDataService: AuthDataService,
    private snackbarService: SnackbarService,
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private cacheService: CacheService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // get the authenticated user
    this.authUser = this.authDataService.getAuthenticatedUser();

    this.route.params
      .subscribe((params: { categoryId }) => {
        this.categoryId = params.categoryId;
        this.helpDataService
          .getHelpCategory(this.categoryId)
          .subscribe((category) => {
            // set data
            this.selectedCategory = category;

            // update breadcrumbs
            this.initializeBreadcrumbs();

            // initialize pagination
            this.initPaginator();
            // ...and re-load the list
            this.needsRefreshList(true);

            // initialize Side Table Columns
            this.initializeSideTableColumns();
          });

      });
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
     * Initialize breadcrumbs
     */
  // initializeBreadcrumbs() {
  //   // reset
  //   this.breadcrumbs = [];
  //
  //   // add list breadcrumb only if we have permission
  //   if (HelpCategoryModel.canList(this.authUser)) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '/help/categories')
  //     );
  //   }
  //
  //   // view category breadcrumb
  //   if (
  //     HelpCategoryModel.canView(this.authUser) &&
  //           this.selectedCategory
  //   ) {
  //     this.breadcrumbs.push(
  //       new BreadcrumbItemModel(
  //         this.selectedCategory.name,
  //         `/help/categories/${this.categoryId}/view`,
  //         false,
  //         {},
  //         this.selectedCategory
  //       )
  //     );
  //   }
  //
  //   // children list breadcrumb
  //   this.breadcrumbs.push(
  //     new BreadcrumbItemModel(
  //       'LNG_PAGE_LIST_HELP_ITEMS_TITLE',
  //       '.',
  //       true
  //     )
  //   );
  // }

  /**
     * Initialize Side Table Columns
     */
  initializeSideTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'title',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_TITLE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'comment',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_COMMENT'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'approved',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'approvedBy',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_BY'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'approvedDate',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_APPROVED_DATE'
    //   })
    // ];
  }

  /**
   * Initialize breadcrumbs
   */
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the items list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    // retrieve the list of items
    this.helpItemsList$ = this.helpDataService
      .getHelpItemsCategoryList(this.categoryId, this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.snackbarService.showApiError(err);
          finishCallback([]);
          return throwError(err);
        }),
        tap(this.checkEmptyList.bind(this)),
        tap((data: any[]) => {
          finishCallback(data);
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
    this.helpItemsListCount$ = this.helpDataService
      .getHelpItemsCategoryCount(
        this.categoryId,
        countQueryBuilder
      )
      .pipe(
        catchError((err) => {
          this.snackbarService.showApiError(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete specific item
     * @param {HelpItemModel} item
     */
  deleteHelpItem(item: HelpItemModel) {
    // show confirm dialog
    const translatedData = {title: this.i18nService.instant(item.title)};
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HELP_ITEM', translatedData)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.helpDataService
            .deleteHelpItem(item.categoryId, item.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_DELETE_SUCCESS_MESSAGE');

              // remove help items from cache
              this.cacheService.remove(CacheKey.HELP_ITEMS);

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

  /**
     * Approve specific item
     * @param {HelpItemModel} item
     */
  approveHelpItem(item: HelpItemModel) {
    // show confirm dialog
    const translatedData = {title: this.i18nService.instant(item.title)};
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_APPROVE_HELP_ITEM', translatedData)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.helpDataService
            .approveHelpItem(item.categoryId, item.id)
            .pipe(
              catchError((err) => {
                this.snackbarService.showApiError(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              // display success message
              this.snackbarService.showSuccess('LNG_PAGE_LIST_HELP_ITEMS_ACTION_APPROVE_SUCCESS_MESSAGE');

              // remove help items from cache
              this.cacheService.remove(CacheKey.HELP_ITEMS);

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

}
