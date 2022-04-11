import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { ListComponent } from '../../../../core/helperClasses/list-component';
import { SavedFiltersService } from '../../../../core/services/data/saved-filters.data.service';
import * as _ from 'lodash';
import { SavedFilterModel } from '../../../../core/models/saved-filters.model';
import { catchError, share } from 'rxjs/operators';
import { GenericDataService } from '../../../../core/services/data/generic.data.service';
import { Constants } from '../../../../core/models/constants';
import { LabelValuePair } from '../../../../core/models/label-value-pair';
import { DialogService } from '../../../../core/services/helper/dialog.service';
import { DialogAnswer, DialogAnswerButton } from '../../../../shared/components/dialog/dialog.component';
import { HoverRowAction, HoverRowActionType } from '../../../../shared/components';
import { IBasicCount } from '../../../../core/models/basic-count.interface';
import { ListHelperService } from '../../../../core/services/helper/list-helper.service';
import { UserModel } from '../../../../core/models/user.model';
import { UserDataService } from '../../../../core/services/data/user.data.service';
import { ToastV2Service } from '../../../../core/services/helper/toast-v2.service';

@Component({
  selector: 'app-saved-filters',
  templateUrl: './saved-filters.component.html'
})
export class SavedFiltersComponent extends ListComponent implements OnInit, OnDestroy {
  // breadcrumbs
  // breadcrumbs: BreadcrumbItemModel[] = [
  //   new BreadcrumbItemModel('LNG_PAGE_LIST_SAVED_FILTERS_TITLE', '.', true)
  // ];

  yesNoOptionsList$: Observable<any[]>;

  // user list
  userList$: Observable<UserModel[]>;

  pagesWithSavedFilters: LabelValuePair[] = _.map(Constants.APP_PAGE, (page) => {
    return new LabelValuePair(page.label, page.value);
  });

  savedFiltersList$: Observable<SavedFilterModel[]>;
  savedFiltersListCount$: Observable<IBasicCount>;

  // constants
  SavedFilterModel = SavedFilterModel;

  fixedTableColumns: string[] = [
    'name',
    'public',
    'filter-keys',
    'createdBy',
    'updatedBy',
    'updatedAt'
  ];

  recordActions: HoverRowAction[] = [
    // Other actions
    new HoverRowAction({
      type: HoverRowActionType.MENU,
      icon: 'moreVertical',
      menuOptions: [
        // Delete Saved Filter
        new HoverRowAction({
          menuOptionLabel: 'LNG_PAGE_LIST_SAVED_FILTERS_ACTION_DELETE_FILTER',
          click: (item: SavedFilterModel) => {
            this.deleteFilter(item.id);
          },
          visible: (item: SavedFilterModel): boolean => {
            return !item.readOnly || SavedFilterModel.canDelete(this.authUser);
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
    private savedFiltersService: SavedFiltersService,
    private toastV2Service: ToastV2Service,
    private genericDataService: GenericDataService,
    private dialogService: DialogService,
    private userDataService: UserDataService
  ) {
    super(listHelperService);
  }

  /**
     * Component initialized
     */
  ngOnInit() {
    this.yesNoOptionsList$ = this.genericDataService.getFilterYesNoOptions();

    // retrieve users
    this.userList$ = this.userDataService.getUsersListSorted().pipe(share());

    // initialize pagination
    this.initPaginator();
    // ...and re-load the list
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
  initializeBreadcrumbs(): void {
  }

  /**
   * Fields retrieved from api to reduce payload size
   */
  protected refreshListFields(): string[] {
    return [];
  }

  /**
   * Re(load) the Saved filters list, based on the applied filter, sort criterias
   */
  refreshList() {
    // retrieve created user & modified user information
    this.queryBuilder.include('createdByUser', true);
    this.queryBuilder.include('updatedByUser', true);

    // retrieve list
    this.savedFiltersList$ = this.savedFiltersService
      .getSavedFiltersList(this.queryBuilder)
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
    const countQueryBuilder = _.cloneDeep(this.queryBuilder);
    countQueryBuilder.paginator.clear();
    countQueryBuilder.sort.clear();
    this.savedFiltersListCount$ = this.savedFiltersService
      .getSavedFiltersListCount(countQueryBuilder)
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        }),
        share()
      );
  }

  /**
     * Set a saved filter public if it's created by the current user
     * @param savedFilterId
     * @param isPublic
     */
  setPublicItem(savedFilterId: string, isPublic: boolean) {
    this.savedFiltersService.modifyFilter(savedFilterId, { isPublic : isPublic })
      .pipe(
        catchError((err) => {
          this.toastV2Service.error(err);
          return throwError(err);
        })
      )
      .subscribe(() => {
        this.toastV2Service.success('LNG_PAGE_LIST_SAVED_FILTERS_ACTION_MODIFY_FILTER_SUCCESS_MESSAGE');
      });
  }

  /**
     * Delete a saved filter
     * @param filterId
     */
  deleteFilter(filterId: string) {
    this.dialogService.showConfirm('LNG_DIALOG_CONFIRM_DELETE_SAVED_FILTER')
      .subscribe((answer: DialogAnswer) => {
        if (answer.button === DialogAnswerButton.Yes) {
          this.savedFiltersService.deleteFilter(filterId)
            .pipe(
              catchError((err) => {
                this.toastV2Service.error(err);
                return throwError(err);
              })
            )
            .subscribe(() => {
              this.toastV2Service.success('LNG_PAGE_LIST_SAVED_FILTERS_ACTION_DELETE_FILTER_SUCCESS_MESSAGE');

              // reload data
              this.needsRefreshList(true);
            });
        }
      });
  }

}
