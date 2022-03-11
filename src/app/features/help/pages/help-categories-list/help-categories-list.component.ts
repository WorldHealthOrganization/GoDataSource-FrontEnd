import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Observable } from 'rxjs';
import { UserSettings } from '../../../../core/models/user.model';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswerButton, HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { DialogAnswer } from '../../../../shared/components/dialog/dialog.component';
import { Router } from '@angular/router';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { I18nService } from '../../../../core/services/helper/i18n.service';
import { catchError, share, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import * as _ from 'lodash';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-help-categories-list',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './help-categories-list.component.html',
  styleUrls: ['./help-categories-list.component.less']
})
export class HelpCategoriesListComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_HELP_CATEGORIES_TITLE', '.', true)
  // ];

  // list of categories
  helpCategoriesList$: Observable<HelpCategoryModel[]>;
  helpCategoriesListCount$: Observable<IBasicCount>;

  // provide constants to template
  Constants = Constants;
  HelpCategoryModel = HelpCategoryModel;
  UserSettings = UserSettings;

  recordActions: HoverRowAction[] = [
    // View Help Category
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_CATEGORY',
      linkGenerator: (item: HelpCategoryModel): string[] => {
        return ['/help', 'categories', item.id, 'view'];
      },
      visible: (item: HelpCategoryModel): boolean => {
        return !item.deleted &&
                    HelpCategoryModel.canView(this.authUser);
      }
    }),

    // Modify Help Category
    new HoverRowAction({
      icon: 'settings',
      iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_MODIFY_HELP_CATEGORY',
      linkGenerator: (item: HelpCategoryModel): string[] => {
        return ['/help', 'categories', item.id, 'modify'];
      },
      visible: (item: HelpCategoryModel): boolean => {
        return !item.deleted &&
                    HelpCategoryModel.canModify(this.authUser);
      }
    }),

    // View Help Items
    new HoverRowAction({
      icon: 'groupWork',
      iconTooltip: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_VIEW_HELP_ITEMS_BUTTON',
      click: (item: HelpCategoryModel) => {
        this.router.navigate(['/help', 'categories', item.id, 'items']);
      },
      visible: (item: HelpCategoryModel): boolean => {
        return !item.deleted &&
                    HelpItemModel.canList(this.authUser);
      }
    }),

    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Help Category
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_HELP_CATEGORY',
          click: (item: HelpCategoryModel) => {
            this.deleteHelpCategory(item);
          },
          visible: (item: HelpCategoryModel): boolean => {
            return !item.deleted &&
                            HelpCategoryModel.canDelete(this.authUser);
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
    private router: Router,
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service,
    private dialogService: DialogService,
    private i18nService: I18nService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    // initialize pagination
    this.initPaginator();

    // ...and re-load the list
    this.needsRefreshList(true);

    // initialize Side Table Columns
    this.initializeTableColumns();
  }

  /**
     * Release resources
     */
  ngOnDestroy() {
    // release parent resources
    super.ngOnDestroy();
  }

  /**
     * Initialize Side Table Columns
     */
  initializeTableColumns() {
    // default table columns
    // this.tableColumns = [
    //   new VisibleColumnModel({
    //     field: 'name',
    //     label: 'LNG_HELP_CATEGORY_FIELD_LABEL_NAME'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'description',
    //     label: 'LNG_HELP_CATEGORY_FIELD_LABEL_DESCRIPTION'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'order',
    //     label: 'LNG_HELP_CATEGORY_FIELD_LABEL_ORDER'
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
   * Re(load) the categories list
   */
  refreshList(finishCallback: (records: any[]) => void) {
    // retrieve the list of Categories
    this.helpCategoriesList$ = this.helpDataService
      .getHelpCategoryList(this.queryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
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
    this.helpCategoriesListCount$ = this.helpDataService
      .getHelpCategoryCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Delete specific category
     * @param {HelpCategoryModel} category
     */
  deleteHelpCategory(category: HelpCategoryModel) {
    // show confirm dialog
    const translatedData = {name: this.i18nService.instant(category.name)};
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_HELP_CATEGORY', translatedData)
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.helpDataService
            .deleteHelpCategory(category.id)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_HELP_CATEGORIES_ACTION_DELETE_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

}
