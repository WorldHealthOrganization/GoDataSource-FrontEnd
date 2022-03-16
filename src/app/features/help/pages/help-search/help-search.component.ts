import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { Constants } from '../../../../core/models/constants';
import { Router } from '@angular/router';
import { HelpDataService } from '../../../../core/services/data/help.data.service';
import { HelpItemModel } from '../../../../core/models/help-item.model';
import { HelpCategoryModel } from '../../../../core/models/help-category.model';
import * as _ from 'lodash';
import { catchError, tap } from 'rxjs/operators';
import { UserSettings } from '../../../../core/models/user.model';
import { HoverRowAction } from '../../../../shared/components';
import { throwError } from 'rxjs/internal/observable/throwError';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-help-search',
  templateUrl: './help-search.component.html'
})
export class HelpSearchComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_GLOBAL_HELP_TITLE', '/help', true)
  // ];

  helpItemsList$: Observable<HelpItemModel[]>;

  helpCategoriesList$: Observable<HelpCategoryModel[]>;

  // provide constants to template
  Constants = Constants;
  HelpCategoryModel = HelpCategoryModel;
  UserSettings = UserSettings;

  searchedTerm: string = '';

  recordActions: HoverRowAction[] = [
    // View Help Item
    new HoverRowAction({
      icon: 'visibility',
      iconTooltip: 'LNG_PAGE_GLOBAL_HELP_ACTION_VIEW_HELP_ITEM',
      click: (item: HelpItemModel) => {
        this.router.navigate(['/help', 'categories', item.categoryId, 'items', item.id, 'view-global']);
      }
    })
  ];

  /**
     * Constructor
     */
  constructor(
    protected listHelperService: ListHelperService,
    private router: Router,
    private helpDataService: HelpDataService,
    private toastV2Service: ToastV2Service
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
    this.helpCategoriesList$ = this.helpDataService.getHelpCategoryList();

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
    //     field: 'title',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_TITLE'
    //   }),
    //   new VisibleColumnModel({
    //     field: 'categoryId',
    //     label: 'LNG_HELP_ITEM_FIELD_LABEL_CATEGORY'
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
    this.queryBuilder.filter.where({approved: true}, true);
    // retrieve the list of items
    if (_.isEmpty(this.searchedTerm)) {
      this.queryBuilder.filter.remove('token');
      this.helpItemsList$ = this.helpDataService.getHelpItemsList(this.queryBuilder);
    } else {
      this.helpItemsList$ = this.helpDataService.getHelpItemsListSearch(this.queryBuilder, this.searchedTerm);
    }

    this.helpItemsList$ = this.helpItemsList$
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          finishCallback([]);
          return throwError(err);
        }),
        tap((data: any[]) => {
          finishCallback(data);
        })
      );
  }


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
